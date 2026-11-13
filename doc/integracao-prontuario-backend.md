# Guia de integração — Prontuário (backend)

> Documento escrito para ser entregue a um assistente de código (Claude) no repositório do **backend**.
> Objetivo: implementar a API que alimenta a tela `/prontuarioPaciente` do frontend (Vue 3). Hoje essa tela só busca a lista de pacientes no backend; **anamnese, exames e histórico de atendimentos ficam apenas em memória no navegador** (somem ao recarregar a página).
> Também inclui uma alteração no **cadastro de paciente**: adicionar o campo **cidade** no endereço (seção 7).
> Siga os padrões que **já existem** no backend para os módulos `patient`, `appointment` e `quotation` (envelope de resposta, autenticação por cookie, nomes de rotas, estrutura controller → service → repository → entity/DTO). Leia esses módulos antes de codar e replique a estrutura.

---

## 1. Contexto do negócio

O prontuário é a ficha clínica de um paciente. Na tela, o usuário seleciona um paciente e vê 3 abas:

| aba | o que mostra | origem dos dados hoje | o que o backend precisa fazer |
|---|---|---|---|
| **Dados pessoais** | dados do cadastro + **histórico de atendimentos** | cadastro: `GET /patient/list` ✅ · histórico: lista fixa no código ❌ | filtrar atendimentos por paciente (seção 6) |
| **Anamnese** | questionário de saúde, modelo **Adulto** ou **Pediátrico** | só memória ❌ | salvar/carregar anamnese (seção 4) |
| **Exames** | anexos (imagens e PDF) com tipo, data e observações | só memória (`URL.createObjectURL`) ❌ | upload, listagem, download e remoção de arquivos (seção 5) |

Regras gerais:

- **Um paciente tem no máximo uma anamnese** (registro único por paciente, atualizado a cada "Salvar"). Ela guarda os **dois modelos** (adulto e pediátrico) ao mesmo tempo + qual modelo está selecionado. O frontend troca de modelo sem perder o que foi preenchido no outro, e os alertas de saúde consideram os dois.
- **Alertas de saúde**: quando certas perguntas são respondidas com "Sim", o frontend mostra um ícone de alerta e um diálogo ao abrir o prontuário (ver seção 4.5). O cálculo é feito no frontend; o backend só precisa devolver as respostas.
- **Exames**: um paciente tem N exames. Cada exame = 1 arquivo + metadados. Remoção é lógica (soft delete).
- Apenas pacientes **ativos** aparecem para seleção (filtro feito no frontend usando `statusCode`).

---

## 2. Convenções obrigatórias (iguais aos outros módulos)

### 2.1 Envelope de resposta
Toda resposta (sucesso ou erro) usa o envelope já existente:

```json
{ "data": <payload>, "error": null }
{ "data": null, "error": { "code": "PATIENT_NOT_FOUND", "message": "Paciente não encontrado." } }
```

- O frontend exibe `error.message` diretamente ao usuário → **mensagens em português, claras**.
- `data` **nunca** pode ser `null` em sucesso (o frontend trata `data == null` como erro). Listas vazias = `[]`. Operações sem retorno devolvem `true`.
- **Exceção:** o endpoint de download de arquivo (5.3) devolve o binário direto, sem envelope.

### 2.2 Autenticação
- Sessão via **cookie** (`withCredentials: true`). Todas as rotas abaixo exigem usuário autenticado.
- Sem sessão → HTTP **401**. Sem permissão → HTTP **403**.
- Base URL padrão do frontend: `http://localhost:9090` (variável `VITE_API_URL`).

### 2.3 Padrão de rotas
- `GET  /<recurso>/list`
- `GET  /<recurso>/details/{id}`
- `POST /<recurso>/register` · `POST /<recurso>/edit`
- `DELETE /<recurso>/delete/{id}` → inativação lógica, retorna `true`

### 2.4 Tipos
- Datas: string `YYYY-MM-DD`. Data/hora: `YYYY-MM-DDTHH:mm:ss` (sem timezone, horário da clínica `America/Sao_Paulo`), igual a `appointment.start`.
- Enums em **MAIÚSCULAS sem acento** (`SIM`, `NAO`, `NAO_SEI`...). O frontend faz o mapeamento para o texto com acento.
- Campos de texto livre vazios: aceitar `""` ou `null` e devolver `""` (string vazia) — o frontend usa `v-model` direto em inputs.
- IDs: numérico (`id`). Paciente é identificado por `patientId` (o `id` do `/patient/list`).

---

## 3. Visão geral dos endpoints novos/alterados

| método | rota | seção | descrição |
|---|---|---|---|
| GET | `/anamnesis/details/{patientId}` | 4.3 | carrega a anamnese do paciente (ou uma vazia) |
| POST | `/anamnesis/save` | 4.4 | cria ou atualiza (upsert) a anamnese do paciente |
| GET | `/exam/list?patientId={id}` | 5.1 | lista exames do paciente (metadados) |
| POST | `/exam/upload` (multipart) | 5.2 | anexa 1..N arquivos |
| GET | `/exam/{id}/file` | 5.3 | baixa/visualiza o arquivo (binário) |
| DELETE | `/exam/delete/{id}` | 5.4 | remove exame (soft delete) |
| GET | `/appointment/list?patientId={id}` | 6 | **alteração**: aceitar filtro por paciente sem `start`/`end` |
| POST | `/patient/register` · `/patient/edit` · GET `/patient/list` | 7 | **alteração**: novo campo `city` |

---

## 4. Anamnese

### 4.1 Contrato (`ApiAnamnesis`)

Usado tanto na resposta do GET quanto no body do POST:

```json
{
  "id": 5,
  "patientId": 7,
  "selectedType": "ADULTO",
  "updatedAt": "2026-11-12T10:42:00",
  "updatedByName": "Dra. Ana Paula",
  "adult": {
    "mainComplaint": "Dor no dente 36 ao mastigar",
    "brushingFrequency": "3 vezes",
    "flossUse": "Às vezes",
    "responses": {
      "currentHealthProblem": { "answer": "NAO", "details": "" },
      "currentMedication":    { "answer": "SIM", "details": "Losartana 50mg" },
      "hypertension":         { "answer": "SIM", "details": "" },
      "pregnant":             { "answer": null,  "details": "" }
    }
  },
  "pediatric": {
    "mainComplaint": "",
    "siblingsCount": "",
    "mainCaregiver": "",
    "preferredActivity": "",
    "attends": { "school": false, "daycare": false, "afterSchool": false },
    "schoolPeriod": "",
    "brushing": "",
    "brushingFrequency": "",
    "flossUse": "",
    "schoolServices": { "medicalCare": false, "dentalCare": false, "food": false },
    "firstDentistVisit": null,
    "lastDentistVisit": "",
    "responses": {
      "allergy": { "answer": "NAO_SEI", "details": "" }
    }
  }
}
```

- `selectedType`: `ADULTO` | `PEDIATRICO`.
- `responses`: **mapa** `chave da pergunta → { answer, details }`. As chaves estão na seção 4.2. No GET, devolva **todas** as chaves do modelo (as não respondidas com `answer: null, details: ""`).
- `answer`: `SIM` | `NAO` | `NAO_SEI` | `POUCO` | `PEITO` | `MAMADEIRA` | `null` (não respondida). Validar que o valor está entre as opções permitidas da pergunta (tabela 4.2) → senão 400.
- `firstDentistVisit` (pediátrico): `SIM` | `NAO` | `null`.
- `id`, `updatedAt`, `updatedByName`: somente leitura (ignorar no POST). `updatedByName` é opcional, se o backend já tiver auditoria de usuário.
- Campos de texto livre: limite sugerido de 1000 caracteres (`mainComplaint`) e 500 (demais e `details`).

### 4.2 Catálogo de perguntas (chaves fixas)

As chaves são definidas no frontend (`src/presentation/views/PatientRecordView.vue`) e **não podem mudar**. O backend deve validar contra esta lista (chave desconhecida → 400).

Legenda das opções: **SNX** = `SIM, NAO, NAO_SEI` · **SN** = `SIM, NAO`.

**Modelo adulto — `adult.responses`**

| nº | chave | pergunta | opções | tem `details`? |
|---|---|---|---|---|
| 01 | `currentHealthProblem` | Apresenta-se com algum problema de saúde? | SNX | sim (Qual?) |
| 02 | `medicalTreatment` | Está em tratamento médico atualmente? | SNX | sim (Qual médico?) |
| 03 | `currentMedication` | Está tomando algum medicamento? | SNX | sim (Qual?) |
| 04 | `seriousPastDisease` | Já teve alguma doença séria no passado? | SNX | sim (Qual?) |
| 05 | `hospitalizedOrOperated` | Já foi hospitalizado e/ou operado? | SNX | sim (Motivo/ano) |
| 06 | `smoker` | Você é fumante? | SNX | sim (Cigarros/dia) |
| 07 | `cardiovascularProblem` | Tem ou teve algum problema cardiovascular? | SNX | sim (Qual?) |
| 08 | `breathOrChestPain` | Sente falta de ar ou dor no peito após esforços leves? | SNX | não |
| 09 | `hypertension` | É hipertenso? Tem pressão alta? | SNX | não |
| 10 | `frequentFainting` | Apresenta desmaios frequentes? | SNX | não |
| 11 | `epilepsy` | Tem disritmia/epilepsia? | SNX | não |
| 12 | `allergy` | Apresenta alergia a alguma medicação ou produto? | SNX | sim (Qual?) |
| 13 | `dentalAnesthesia` | Já se submeteu a alguma anestesia dentária? | SNX | não |
| 14 | `asthmaOrRhinitis` | Tem asma ou rinite alérgica? | SNX | não |
| 15 | `diabetes` | É diabético? | SNX | não |
| 16 | `thirstOrHunger` | Sente sede ou fome na maior parte do tempo? | SNX | não |
| 17 | `slowHealing` | As feridas demoram para cicatrizar? | SNX | não |
| 18 | `abnormalBleeding` | Já teve sangramento anormal após extração dentária? | SNX | não |
| 19 | `bloodProblem` | Apresenta algum problema de sangue? | SNX | sim (Qual?) |
| 20 | `mouthLesionTreatment` | Já se submeteu a cirurgia ou radioterapia devido a lesão na boca? | SN | não |
| 21 | `nervous` | Considera-se excessivamente nervoso? | SNX | não |
| 22 | `swallowingDifficulty` | Tem dificuldade em engolir? | SNX | não |
| 23 | `skinDisease` | Tem alguma doença de pele? | SNX | não |
| 24 | `frequentSoreThroat` | Sente dores de garganta frequentemente? | SNX | não |
| 25 | `mouthBreathing` | Costuma respirar pela boca? | SNX | não |
| 26 | `toothAppearanceComplaint` | Tem alguma queixa com relação à aparência dos dentes? | SN | sim (Qual?) |
| 27 | `dentalTreatmentAnxiety` | Fica apreensivo ao submeter-se a tratamento dentário? | SNX | não |
| 28 | `seriousDentalTreatmentProblem` | Já teve algum problema sério relacionado a tratamento dentário? | SN | sim (Qual?) |
| 29 | `gumBleeding` | Sua gengiva sangra facilmente? | SNX | não |
| 30 | `bruxism` | Range ou aperta os dentes à noite? | SNX | não |
| 31 | — | Higiene bucal → campos `adult.brushingFrequency` e `adult.flossUse` (texto livre) | — | — |
| 32 | `menstrualProblems` | Tem problemas associados ao período menstrual? | SNX | não |
| 33 | `contraceptiveUse` | Faz uso de contraceptivo? | SNX | não |
| 34 | `pregnant` | Está grávida? | SNX | não |

**Modelo pediátrico — `pediatric.responses`**

| nº | chave | pergunta | opções | tem `details`? |
|---|---|---|---|---|
| 1 | `prenatalCare` | Gravidez: Pré-natal com médico | SN | sim (Usou algum medicamento?) |
| 2 | `congenitalAnomalies` | Anomalias congênitas? | SN | sim (Qual?) |
| 3 | `childHealthProblems` | Problemas com a saúde da criança? | SN | sim (Qual?) |
| 4 | `hospitalized` | Já esteve hospitalizado? | SN | sim (Quando?) |
| 5 | `surgery` | Já se submeteu a alguma cirurgia? | SN | sim (Qual?) |
| 6 | `currentMedication` | Faz uso de alguma medicação? | SN | sim (Qual?) |
| 7 | `anesthesia` | Já tomou anestesia? | SNX | não |
| 8 | `allergy` | Tem alguma alergia? | SNX | sim (Qual?) |
| 9 | `initialFeeding` | Alimentação inicial? | `PEITO, MAMADEIRA` | sim (Qual idade parou?) |
| 10 | `accessoryDevices` | Fez ou faz uso de dispositivos acessórios? | SN | sim (Bico, mamadeira, dedo ou outro) |
| 11 | `fruitsAndVegetables` | Alimenta-se de frutas e verduras? | `SIM, NAO, POUCO` | não |

> Para perguntas **sem** `details`, aceitar e ignorar (ou salvar vazio) se vier preenchido.

### 4.3 `GET /anamnesis/details/{patientId}`
- Paciente inexistente → 404 `PATIENT_NOT_FOUND`.
- Paciente existe mas **ainda não tem anamnese** → **200** com uma anamnese vazia: `id: null`, `selectedType: "ADULTO"`, todos os textos `""`, booleanos `false`, todas as respostas `{ answer: null, details: "" }`. **Não** devolver 404 nesse caso (o frontend sempre abre o formulário).
- Resposta: `{ data: ApiAnamnesis }`.

### 4.4 `POST /anamnesis/save`
- Body: `ApiAnamnesis` (com `patientId` obrigatório).
- **Upsert**: se não existe anamnese para `patientId`, cria; se existe, substitui todo o conteúdo (adulto + pediátrico + `selectedType`).
- Respostas ausentes no body → gravar como `answer: null`.
- Validações → 400 `VALIDATION_ERROR` com mensagem clara (ex.: "Resposta inválida para a pergunta 'Está grávida?'.").
- Paciente inativo → 409 `PATIENT_INACTIVE` ("Não é possível alterar o prontuário de um paciente inativo.").
- Resposta: `ApiAnamnesis` salva (com `id` e `updatedAt` preenchidos).
- Hoje o botão "Salvar" só mostra um toast; ele passará a chamar este endpoint.

### 4.5 Alertas de saúde (referência — calculado no frontend)
O frontend (`src/infrastructure/services/ClinicalHealthAlerts.ts`) mostra alerta quando `answer == SIM` em:
- adulto: `diabetes`, `epilepsy`, `hypertension`, `currentHealthProblem`, `cardiovascularProblem`, `bloodProblem`, `allergy`;
- pediátrico: `childHealthProblems`, `allergy`.

Considera **os dois modelos** independentemente do `selectedType`. O backend não precisa calcular isso agora. (Opcional/futuro: expor `hasHealthAlerts: boolean` em `/patient/list` para mostrar o alerta também na agenda.)

### 4.6 Modelo de dados sugerido

**Tabela `anamnesis`**
| coluna | tipo | regra |
|---|---|---|
| id | bigint PK | |
| patient_id | FK patient, **unique** | 1 anamnese por paciente |
| selected_type | enum `ADULTO` \| `PEDIATRICO` | default `ADULTO` |
| adult_main_complaint | text | |
| adult_brushing_frequency | varchar(500) | |
| adult_floss_use | varchar(500) | |
| ped_main_complaint | text | |
| ped_siblings_count | varchar(50) | texto livre no frontend |
| ped_main_caregiver | varchar(500) | |
| ped_preferred_activity | varchar(500) | |
| ped_attends_school / ped_attends_daycare / ped_attends_after_school | boolean | default false |
| ped_school_period | varchar(500) | |
| ped_brushing / ped_brushing_frequency / ped_floss_use | varchar(500) | |
| ped_school_medical_care / ped_school_dental_care / ped_school_food | boolean | default false |
| ped_first_dentist_visit | enum `SIM` \| `NAO` null | |
| ped_last_dentist_visit | varchar(500) | |
| created_at / updated_at / updated_by | auditoria | se o projeto já usa |

**Tabela `anamnesis_response`**
| coluna | tipo | regra |
|---|---|---|
| id | bigint PK | |
| anamnesis_id | FK anamnesis | |
| model | enum `ADULTO` \| `PEDIATRICO` | |
| question_key | varchar(64) | chave da seção 4.2 |
| answer | enum (`SIM`,`NAO`,`NAO_SEI`,`POUCO`,`PEITO`,`MAMADEIRA`) null | |
| details | varchar(500) | |

`unique(anamnesis_id, model, question_key)`.

> Alternativa aceitável: guardar `adult`/`pediatric` como **JSON/JSONB**. Mais simples, mas dificulta consultas futuras (ex.: "pacientes diabéticos"). Prefira a tabela normalizada se o custo for parecido.

O catálogo de chaves/opções pode ficar como enum/constante no código do backend (não precisa de tabela).

---

## 5. Exames (anexos)

### 5.1 `GET /exam/list?patientId={id}`
Resposta: `{ data: ApiExam[] }`, ordenado por `createdAt` desc (o mais recente primeiro), sem os removidos.

```json
{
  "id": 31,
  "patientId": 7,
  "type": "RADIOGRAFIA_PANORAMICA",
  "date": "2026-11-10",
  "notes": "Pré-tratamento ortodôntico",
  "fileName": "panoramica_maria.jpg",
  "fileType": "image/jpeg",
  "size": 482133,
  "createdAt": "2026-11-12T10:50:00"
}
```

- `type`: `RADIOGRAFIA_PANORAMICA` | `RADIOGRAFIA_PERIAPICAL` | `TOMOGRAFIA` | `FOTOGRAFIA_INTRAORAL` | `EXAME_LABORATORIAL` | `OUTRO`.
  (Frontend exibe: Radiografia panorâmica, Radiografia periapical, Tomografia, Fotografia intraoral, Exame laboratorial, Outro.)
- `size` em **bytes**. `fileType` = MIME type.
- Não devolver URL pública; o frontend monta a URL a partir do `id` (seção 5.3).

### 5.2 `POST /exam/upload` — `multipart/form-data`
O frontend permite selecionar **vários arquivos de uma vez**, todos com o mesmo tipo/data/observação.

| campo | tipo | regra |
|---|---|---|
| `patientId` | number | obrigatório, paciente existente e ativo |
| `type` | string (enum 5.1) | obrigatório |
| `date` | `YYYY-MM-DD` | obrigatório, não pode ser futura |
| `notes` | string | opcional, até 500 caracteres |
| `files` | arquivo (repetido) | 1..10 arquivos |

- Aceitar somente `image/*` (jpeg, png, webp, gif, bmp) e `application/pdf`. **Validar pelo conteúdo (magic bytes)**, não só pela extensão/MIME enviados.
- Tamanho máximo sugerido: **10 MB por arquivo** (configurável). Ajustar o limite de multipart do servidor.
- Tudo ou nada: se um arquivo for inválido, rejeitar a requisição inteira → 400 `EXAM_INVALID_FILE` ("O arquivo 'x.docx' não é permitido. Envie apenas imagens ou PDF.") ou 413/400 `EXAM_FILE_TOO_LARGE`.
- Armazenamento: **não** salvar o binário no banco. Salvar em disco/bucket (S3/MinIO ou pasta configurável) com nome gerado (UUID) e guardar a chave no banco. Nunca usar o nome original no caminho.
- Resposta: `{ data: ApiExam[] }` com os exames criados.
- Atenção: o `api` do frontend envia `Content-Type: application/json` por padrão; o frontend vai sobrescrever para multipart nesta chamada.

### 5.3 `GET /exam/{id}/file`
- Devolve o **binário** (sem envelope) com `Content-Type` correto e `Content-Disposition: inline; filename="<nome original>"`.
- Exige sessão (cookie). Exame inexistente/removido → 404 (pode ser JSON no envelope padrão).
- O frontend vai baixar via axios (`responseType: 'blob'`) e criar um `blob:` URL para miniatura e para abrir em nova aba — por isso o CORS precisa permitir `credentials` e expor `Content-Disposition` (`Access-Control-Expose-Headers`).
- Opcional: `GET /exam/{id}/thumbnail` para imagens grandes. Não obrigatório agora.

### 5.4 `DELETE /exam/delete/{id}`
- Soft delete (`deleted_at = agora`). O arquivo físico pode ser mantido (decidir política de retenção — seção 10).
- Já removido / inexistente → 404 `EXAM_NOT_FOUND`.
- Resposta: `{ data: true }`.

### 5.5 Tabela `exam`
| coluna | tipo | regra |
|---|---|---|
| id | bigint PK | |
| patient_id | FK patient | índice |
| type | enum (5.1) | |
| exam_date | date | |
| notes | varchar(500) | |
| file_name | varchar(255) | nome original (só para exibição/download) |
| file_type | varchar(100) | MIME validado |
| size_bytes | bigint | |
| storage_key | varchar(255) | caminho/chave interna, nunca exposto |
| created_at / created_by | auditoria | |
| deleted_at | timestamp null | soft delete |

---

## 6. Histórico de atendimentos (aba "Dados pessoais")

Hoje é uma lista fixa no código. Deve vir dos **atendimentos (appointments)** já existentes no backend.

**Alteração em `GET /appointment/list`:** aceitar `patientId` como filtro. Quando `patientId` for informado, `start` e `end` passam a ser **opcionais** (sem eles, traz todos os atendimentos do paciente). Ordenar por `start` desc.

```
GET /appointment/list?patientId=7
```

Resposta: o mesmo `ApiAppointment[]` já existente, **acrescido de `professionalName`** (hoje só vem `professionalUserId`, e a tela mostra o nome do profissional):

```json
{
  "id": 33, "code": "AGD-000033", "status": "REALIZADO",
  "start": "2026-08-18T09:00:00", "end": "2026-08-18T10:00:00",
  "title": null, "patientId": 7, "patientName": "Maria Oliveira", "patientCpf": "55566677788",
  "professionalUserId": 3, "professionalName": "Dra. Ana Paula",
  "notes": "Profilaxia concluída sem intercorrências.",
  "procedures": [ { "id": 1, "procedureId": 4, "procedureCode": "PRC-0004", "description": "Limpeza Simples", "value": 150.00, "classification": "..." } ]
}
```

- A tela usa: `start` (data/hora), `status`, `procedures[].description`, `notes`, `professionalName`.
- Status: `PENDENTE`, `CONFIRMADO`, `CANCELADO`, `REALIZADO` (o frontend ajusta o mapeamento de cores).
- Se preferir não mexer na rota existente, alternativa equivalente: `GET /patient/{id}/appointments` com o mesmo formato. **Avise qual foi escolhida.**

---

## 7. Cadastro de paciente — novo campo **cidade** (obrigatório)

O endereço do paciente hoje tem apenas `address` (logradouro completo) e `addressesNumber`. **Precisa ter a cidade.**

### 7.1 O que mudar
- Adicionar coluna `city` (`varchar(100)`) na tabela de paciente.
- Adicionar `city` no DTO `ApiPatient`, nas rotas:
  - `POST /patient/register` (entrada e saída)
  - `POST /patient/edit` (entrada e saída)
  - `GET /patient/list` (saída)
- **Obrigatório** em register/edit: vazio ou só espaços → 400 `VALIDATION_ERROR` ("A cidade é obrigatória."). Fazer `trim()` antes de salvar. Máx. 100 caracteres.
- Migration: pacientes já existentes ficam com `city = NULL` (coluna nullable no banco, obrigatoriedade validada na API) **ou** preencher com `''` — não inventar valor. Na próxima edição o usuário será obrigado a informar.

Contrato atualizado (campos de endereço):

```json
{
  "id": 7,
  "name": "Maria Oliveira",
  "address": "Rua das Flores",
  "addressesNumber": "123",
  "city": "Joinville",
  "...": "demais campos sem alteração"
}
```

### 7.2 Recomendado junto (confirmar com o time)
- **`state`** (UF, `char(2)`, ex.: `SC`) — cidade sem UF é ambígua (existem várias cidades homônimas no Brasil).
- **`zipCode`** (CEP, 8 dígitos sem máscara) — o frontend já tem o campo CEP no formulário e valida via ViaCEP, **mas hoje ele não é enviado nem salvo** no backend, então o CEP se perde ao recarregar.

Se implementar, seguir as mesmas regras de `city` (opcionais por enquanto). O frontend vai preencher `city`/`state` automaticamente pelo ViaCEP (`localidade`/`uf`) e mostrar o endereço no prontuário como `Rua das Flores, 123 - Joinville/SC`.

---

## 8. Códigos de erro

| HTTP | code | quando |
|---|---|---|
| 400 | `VALIDATION_ERROR` | body inválido (chave de pergunta desconhecida, resposta fora das opções, cidade vazia, data futura...) |
| 400 | `EXAM_INVALID_FILE` | arquivo que não é imagem/PDF |
| 400/413 | `EXAM_FILE_TOO_LARGE` | arquivo acima do limite |
| 401 | — | sem sessão |
| 403 | — | sem permissão |
| 404 | `PATIENT_NOT_FOUND` | paciente inexistente |
| 404 | `EXAM_NOT_FOUND` | exame inexistente ou removido |
| 409 | `PATIENT_INACTIVE` | tentativa de alterar prontuário de paciente inativo |

Sempre com `error.message` em português pronto para exibir.

---

## 9. Checklist de implementação

- [ ] Migration: coluna `city` em paciente (+ `state`/`zip_code` se aprovado).
- [ ] `ApiPatient` com `city` em register/edit/list + validação obrigatória.
- [ ] Migrations `anamnesis`, `anamnesis_response`, `exam` (FKs, uniques, índice em `exam.patient_id`).
- [ ] Enums: `AnamnesisType`, `HealthAnswer`, `ExamType`; catálogo de perguntas (chave → modelo → opções permitidas).
- [ ] `GET /anamnesis/details/{patientId}` devolvendo anamnese vazia quando não existir.
- [ ] `POST /anamnesis/save` (upsert transacional, valida chaves e opções).
- [ ] Serviço de armazenamento de arquivos (pasta/bucket configurável) + `exam` list/upload/file/delete.
- [ ] Limite de upload configurado no servidor; validação por magic bytes.
- [ ] CORS: `credentials` + `Access-Control-Expose-Headers: Content-Disposition`.
- [ ] `/appointment/list` com `patientId` (start/end opcionais) + `professionalName` no retorno.
- [ ] Testes:
  - anamnese: GET sem registro → vazia (200); save cria; save de novo atualiza (não duplica); chave inválida → 400; `answer: "POUCO"` em `diabetes` → 400; `answer: "POUCO"` em `fruitsAndVegetables` → ok; paciente inativo → 409;
  - exames: upload de 2 imagens → 2 registros; upload com `.docx` → 400 e nada salvo; arquivo > limite → erro; GET file devolve bytes e content-type corretos; delete → `true` e some da lista; delete de novo → 404;
  - appointment: list por `patientId` sem datas traz só os do paciente, ordenado desc, com `professionalName`;
  - paciente: register sem `city` → 400; com `city` → salvo e devolvido no list.

---

## 10. Pontos em aberto (confirmar com o time antes de decidir sozinho)

1. **Permissões**: qualquer usuário autenticado pode ver/editar prontuário, ou só profissionais de saúde? (Dados de saúde são sensíveis — LGPD.)
2. **Histórico de versões da anamnese**: basta guardar a última versão (proposta atual) ou é preciso manter histórico de alterações?
3. **Retenção de exames removidos**: apagar arquivo físico depois de X dias ou manter para sempre?
4. `state` e `zipCode` no paciente: implementar agora junto com `city`?
5. Limite de tamanho/quantidade de arquivos (proposto: 10 MB, 10 por envio).

---

## 11. Referência — como o frontend vai consumir (não implementar no backend)

Hoje a tela é `src/presentation/views/PatientRecordView.vue`. Após o backend ficar pronto, serão criados `AnamnesisService.ts` e `ExamService.ts` em `src/infrastructure/services/`, no padrão de `AppointmentService.ts`:

| ação na tela | chamada |
|---|---|
| abrir tela / diálogo "Selecionar paciente" | `GET /patient/list` (já existe) |
| selecionar paciente | `GET /anamnesis/details/{patientId}` + `GET /exam/list?patientId=` + `GET /appointment/list?patientId=` |
| botão "Salvar" (aba Anamnese) | `POST /anamnesis/save` |
| botão "Anexar" (aba Exames) | `POST /exam/upload` |
| miniatura / botão olho | `GET /exam/{id}/file` (blob) |
| botão lixeira | `DELETE /exam/delete/{id}` |
| cadastro de paciente (campo Cidade) | `POST /patient/register` / `POST /patient/edit` com `city` |

Mapeamentos no frontend: `SIM→Sim`, `NAO→Não`, `NAO_SEI→Não sei`, `POUCO→Pouco`, `PEITO→Peito`, `MAMADEIRA→Mamadeira`, `null→''`; `ADULTO→adult`, `PEDIATRICO→pediatric`.
