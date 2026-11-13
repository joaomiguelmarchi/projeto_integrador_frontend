# Guia de integração — Faturamento (backend)

> Documento escrito para ser entregue a um assistente de código (Claude) no repositório do **backend**.
> Objetivo: implementar a API que alimenta a tela `/faturamento` do frontend (Vue 3), que hoje roda apenas com dados de demonstração.
> Siga os padrões que **já existem** no backend para os módulos `quotation` e `appointment` (envelope de resposta, autenticação por cookie, nomes de rotas). Antes de codar, leia esses módulos no backend e replique a estrutura (controller → service → repository → entity/DTO).

---

## 1. Contexto do negócio

- Uma **conta** (account) é gerada para um paciente a partir de um **atendimento** (appointment) concluído.
- A conta lista os **procedimentos** realizados (com quantidade e valor unitário) e um conjunto de **parcelas** (payments) com vencimento.
- Ciclo de vida da conta:

```
 atendimento muda para REALIZADO
            │
            ▼
   [PENDENTE] ──faturar──► [FATURADO] ──(parcelas são pagas uma a uma)
        │                       │
        └────inativar───────────┴──► [INATIVO]  (terminal, só leitura)
```

- Parcelas: `PENDENTE` → `PAGO`. Só é possível registrar pagamento quando a conta está `FATURADO`.
- **Devedores**: contas não inativas com pelo menos uma parcela `PENDENTE` com `dueDate < hoje`. Esse cálculo hoje é feito no frontend; o backend só precisa devolver os dados (ver seção 6 para endpoint opcional).

---

## 2. Convenções obrigatórias (iguais aos outros módulos)

### 2.1 Envelope de resposta
Toda resposta (sucesso ou erro) usa o envelope já existente:

```json
{ "data": <payload ou null>, "error": null }
{ "data": null, "error": { "code": "ACCOUNT_NOT_FOUND", "message": "Conta não encontrada." } }
```

- O frontend exibe `error.message` diretamente ao usuário → **mensagens em português, claras**.
- `data` nunca pode ser `null` em sucesso (o frontend trata `data == null` como erro). Para operações sem retorno, devolva `true` ou a entidade atualizada.

### 2.2 Autenticação
- Sessão via **cookie** (`withCredentials: true`). Todas as rotas abaixo exigem usuário autenticado.
- Sem sessão → HTTP **401**. Sem permissão → HTTP **403**.

### 2.3 Padrão de rotas (mesmo de `/quotation` e `/appointment`)
- `GET  /<recurso>/list`
- `GET  /<recurso>/details/{id}`
- `PATCH /<recurso>/{id}/<ação>`
- `DELETE /<recurso>/delete/{id}` → inativação lógica (soft delete), retorna `true`

### 2.4 Tipos
- Datas: string `YYYY-MM-DD` (sem hora, sem timezone).
- Valores monetários: **decimal em reais com 2 casas** (ex.: `150.00`), igual a `quotation.totalValue` e `procedures[].value`. No banco use `NUMERIC(12,2)` / `BigDecimal`. Nunca `double/float`.
- Enums em **MAIÚSCULAS** sem acento (como `PENDENTE`, `REALIZADO` nos outros módulos).
- IDs: numérico (`id`) + código legível (`code`, ex.: `CTA-000123`), seguindo o padrão de `quotation`/`appointment`.

---

## 3. Modelo de dados

### 3.1 Tabela `account` (conta)
| coluna | tipo | regra |
|---|---|---|
| id | bigint PK | |
| code | varchar unique | gerado, formato `CTA-000001` |
| patient_id | FK patient | obrigatório |
| appointment_id | FK appointment, **unique** | uma conta por atendimento |
| status | enum `PENDENTE` \| `FATURADO` \| `INATIVO` | default `PENDENTE` |
| generated_at | date | data de criação da conta |
| invoiced_at | date null | preenchido ao faturar |
| inactivated_at | date null | preenchido ao inativar |
| created_by / updated_by | FK user | se o projeto já usa auditoria |

### 3.2 Tabela `account_procedure` (itens)
| coluna | tipo | regra |
|---|---|---|
| id | bigint PK | |
| account_id | FK account | |
| procedure_id | FK procedure null | referência ao cadastro |
| description | varchar | **snapshot** do nome no momento da geração |
| quantity | int | ≥ 1 |
| unit_value | numeric(12,2) | **snapshot** do valor no momento da geração |

> Guardar snapshot: se o preço do procedimento mudar depois, a conta já gerada não muda.

### 3.3 Tabela `account_payment` (parcelas)
| coluna | tipo | regra |
|---|---|---|
| id | bigint PK | |
| account_id | FK account | |
| installment_number | int | 1..N |
| due_date | date | |
| value | numeric(12,2) | > 0 |
| status | enum `PENDENTE` \| `PAGO` | default `PENDENTE` |
| paid_at | date null | preenchido ao registrar pagamento |

**Invariante:** soma de `account_payment.value` == soma de `quantity * unit_value` da conta. Ao dividir em parcelas, jogue a diferença de centavos na **última** parcela.

---

## 4. Geração automática da conta

Quando um atendimento muda para status `REALIZADO` (endpoint existente `PATCH /appointment/{id}/status`):

1. Se já existe conta para esse `appointment_id`, não faz nada (idempotente).
2. Cria `account` com `status = PENDENTE`, `generated_at = hoje`, `patient_id` do atendimento.
3. Copia `appointment.procedures` para `account_procedure` (`description`, `procedure_id`, `unit_value = value`, `quantity = 1` — agrupar procedimentos repetidos somando a quantidade).
4. Cria **uma parcela** (à vista) com `due_date = hoje` e `value = total`.
5. Tudo na mesma transação da mudança de status.

Se o atendimento sair de `REALIZADO` (ex.: corrigido para `CANCELADO`) e a conta ainda estiver `PENDENTE`, inativar a conta. Se já estiver `FATURADO`, manter e não bloquear (decisão a confirmar com o time — ver seção 8).

---

## 5. Endpoints

Contrato de resposta usado por todos os endpoints que devolvem uma conta (`ApiAccount`):

```json
{
  "id": 12,
  "code": "CTA-000012",
  "status": "FATURADO",
  "generatedAt": "2026-10-01",
  "invoicedAt": "2026-10-02",
  "patientId": 7,
  "patientName": "Maria Oliveira",
  "patientPhone": "(11) 98888-7777",
  "appointmentId": 33,
  "appointmentCode": "AGD-000033",
  "totalValue": 450.00,
  "paidValue": 150.00,
  "openValue": 300.00,
  "overdueValue": 150.00,
  "procedures": [
    { "id": 1, "procedureId": 4, "description": "Restauração", "quantity": 2, "unitValue": 150.00 },
    { "id": 2, "procedureId": 9, "description": "Limpeza", "quantity": 1, "unitValue": 150.00 }
  ],
  "payments": [
    { "id": 1, "installmentNumber": 1, "dueDate": "2026-09-13", "value": 150.00, "status": "PAGO", "paidAt": "2026-09-13" },
    { "id": 2, "installmentNumber": 2, "dueDate": "2026-10-13", "value": 150.00, "status": "PENDENTE", "paidAt": null },
    { "id": 3, "installmentNumber": 3, "dueDate": "2026-11-12", "value": 150.00, "status": "PENDENTE", "paidAt": null }
  ]
}
```

Campos calculados (`totalValue`, `paidValue`, `openValue`, `overdueValue`) são calculados no backend na serialização (não persistir). `overdueValue` = soma das parcelas `PENDENTE` com `dueDate < hoje`; é `0` se a conta estiver `INATIVO`.
`patientPhone`: usar `patient.phoneNumber`; se vazio, `commercialPhoneNumber`, depois `homePhoneNumber`; senão `null`.
`payments` ordenado por `installmentNumber`.

### 5.1 `GET /account/list`
Lista todas as contas (todos os status), ordenadas por `generatedAt` desc.
Query params opcionais: `status` (`PENDENTE|FATURADO|INATIVO`), `patientId`.
Resposta: `{ data: ApiAccount[], error: null }` (lista vazia = `[]`, nunca `null`).

### 5.2 `GET /account/details/{id}`
Resposta: `{ data: ApiAccount }`. Inexistente → 404 + `ACCOUNT_NOT_FOUND`.

### 5.3 `PATCH /account/{id}/invoice` — Faturar conta
Body opcional para definir o parcelamento no momento do faturamento:

```json
{ "installments": 3, "firstDueDate": "2026-10-23" }
```

- Sem body: mantém as parcelas atuais.
- Com body: apaga as parcelas `PENDENTE` atuais e recria `installments` parcelas mensais a partir de `firstDueDate` (mesmo dia nos meses seguintes; se o mês não tiver o dia, usar o último dia do mês). Diferença de centavos na última parcela.
- Regras: conta precisa estar `PENDENTE` → senão 409 `ACCOUNT_INVALID_STATUS` ("Apenas contas pendentes podem ser faturadas."). `installments` entre 1 e 24.
- Efeito: `status = FATURADO`, `invoiced_at = hoje`.
- Resposta: `ApiAccount` atualizada.

### 5.4 `PATCH /account/{id}/payments/{paymentId}/pay` — Registrar pagamento
Body opcional: `{ "paidAt": "2026-10-23" }` (default = hoje; não pode ser data futura).
- Regras:
  - conta precisa estar `FATURADO` → senão 409 `ACCOUNT_INVALID_STATUS` ("Pagamentos só podem ser registrados em contas faturadas.").
  - parcela precisa pertencer à conta → senão 404 `PAYMENT_NOT_FOUND`.
  - parcela precisa estar `PENDENTE` → senão 409 `PAYMENT_ALREADY_PAID` ("Esta parcela já foi paga.").
- Efeito: `status = PAGO`, `paid_at`.
- Resposta: `ApiAccount` atualizada (o frontend recalcula saldo/devedores a partir dela).

### 5.5 `DELETE /account/delete/{id}` — Inativar conta
- Soft delete: `status = INATIVO`, `inactivated_at = hoje`. Não apagar registros.
- Já inativa → 409 `ACCOUNT_INVALID_STATUS` ("Esta conta já está inativa.").
- Resposta: `{ data: true }` (o frontend valida `=== true`).

### 5.6 (Opcional) `GET /account/debtors`
Mesmo formato de `ApiAccount[]`, filtrando contas não `INATIVO` com `overdueValue > 0`, ordenado pela parcela vencida mais antiga. O frontend consegue calcular isso sozinho a partir de `/account/list`; implemente só se o volume de contas justificar.

---

## 6. Códigos de erro

| HTTP | code | quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | body inválido (installments fora do intervalo, data futura, etc.) |
| 401 | — | sem sessão |
| 403 | — | sem permissão |
| 404 | `ACCOUNT_NOT_FOUND` | conta inexistente |
| 404 | `PAYMENT_NOT_FOUND` | parcela inexistente ou de outra conta |
| 409 | `ACCOUNT_INVALID_STATUS` | transição de status não permitida |
| 409 | `PAYMENT_ALREADY_PAID` | parcela já paga |

Sempre com `error.message` em português pronto para exibir.

---

## 7. Checklist de implementação

- [ ] Migrations das 3 tabelas (com FKs, `unique(appointment_id)`, índices em `status`, `patient_id`, `account_payment.due_date`).
- [ ] Entidades + enums `AccountStatus { PENDENTE, FATURADO, INATIVO }` e `PaymentStatus { PENDENTE, PAGO }`.
- [ ] Gerador de `code` `CTA-XXXXXX` (mesma estratégia usada para orçamento/agendamento).
- [ ] Hook na mudança de status do atendimento para `REALIZADO` (seção 4), transacional e idempotente.
- [ ] Endpoints 5.1–5.5 com o envelope padrão e autenticação.
- [ ] Cálculo de `totalValue/paidValue/openValue/overdueValue` com `BigDecimal` e "hoje" no fuso da clínica (`America/Sao_Paulo`).
- [ ] Validação de transições de status centralizada no service (não no controller).
- [ ] Testes:
  - gerar conta ao marcar atendimento `REALIZADO` (e não duplicar se marcar de novo);
  - faturar conta `PENDENTE` com e sem parcelamento; soma das parcelas == total (testar 100.00 em 3x → 33.33, 33.33, 33.34);
  - faturar conta `FATURADO`/`INATIVO` → 409;
  - pagar parcela em conta `PENDENTE` → 409; pagar parcela já paga → 409; pagar parcela de outra conta → 404;
  - inativar conta → `data: true`; inativar de novo → 409;
  - `overdueValue` considera só parcelas `PENDENTE` vencidas e é 0 em conta `INATIVO`.

---

## 8. Pontos em aberto (confirmar com o time antes de decidir sozinho)

1. Atendimento que deixa de ser `REALIZADO` com conta já `FATURADO`: manter conta ou bloquear a mudança?
2. Conta com parcela já `PAGO` pode ser inativada? (Proposta atual: sim, só leitura depois.)
3. Deve ser possível estornar um pagamento (`PAGO` → `PENDENTE`)? A tela atual não tem essa ação.
4. Permissões: qualquer usuário autenticado ou só perfis administrativos?

---

## 9. Referência — como o frontend vai consumir (não implementar no backend)

Para contexto. Hoje o frontend usa `src/core/entities/Billing.ts` e `src/infrastructure/services/BillingDemo.ts` (dados fictícios). Após o backend ficar pronto, será criado `src/infrastructure/services/AccountService.ts` no padrão de `QuotationService.ts`:

| ação na tela | chamada |
|---|---|
| carregar abas "Faturamento" e "Devedores" | `GET /account/list` |
| botão "Detalhes da conta" | `GET /account/details/{id}` |
| "Faturar conta" (conta Pendente) | `PATCH /account/{id}/invoice` |
| "Registrar pagamento" (parcela Pendente, conta Faturado) | `PATCH /account/{id}/payments/{paymentId}/pay` |
| "Inativar conta" | `DELETE /account/delete/{id}` |
| "Cobrança" (mensagem copiada) | nada no backend — usa `patientName`, `patientPhone`, `overdueValue`, `code` |

Mapeamento de status no frontend: `PENDENTE→Pendente`, `FATURADO→Faturado`, `INATIVO→Inativo`, `PAGO→Pago`. O frontend converte valores em reais para centavos internamente.
