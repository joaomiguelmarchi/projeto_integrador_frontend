# Guia de Implementação do Backend Kotlin - SmileHub

Este documento descreve o que o backend ainda precisa implementar para atender ao frontend atual do SmileHub. A análise foi feita a partir da estrutura Vue 3 + TypeScript existente, dos serviços HTTP em `src/infrastructure/services`, das telas em `src/presentation/views` e do manual funcional em `doc/Manual de acesso ao sistema.pdf`.

## 1. Visão Geral do Frontend Atual

O frontend está organizado em camadas simples:

- `src/infrastructure/http/api.ts`: configura o cliente HTTP Axios.
- `src/infrastructure/services`: concentra os serviços que falam com o backend.
- `src/presentation/router/index.ts`: define as rotas e proteção de telas autenticadas.
- `src/presentation/views`: telas de login, início, procedimentos, pacientes, prontuário, orçamento e agenda.
- `src/presentation/components`: layout, menu lateral, marca e toast.

O backend esperado pelo frontend deve ficar disponível em:

```text
http://localhost:9090
```

Também pode ser configurado pelo frontend por meio da variável:

```text
VITE_API_URL
```

O cliente Axios já envia:

```ts
withCredentials: true
Content-Type: application/json
```

Isso significa que o backend deve liberar CORS com credenciais e, se usar autenticação por cookie/sessão, deve enviar cookies compatíveis com requisições vindas do frontend.

## 2. Contrato Geral de Resposta

Pacientes e procedimentos já esperam um envelope padrão:

```json
{
  "data": {},
  "error": null
}
```

Em caso de erro:

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensagem legível para o usuário."
  }
}
```

O frontend também aceita, em alguns pontos, erros como string ou `{ "message": "..." }`, mas a recomendação é padronizar tudo com `{ data, error }`.

Exemplo Kotlin:

```kotlin
data class DefaultResponse<T>(
    val data: T? = null,
    val error: DefaultError? = null
)

data class DefaultError(
    val code: String,
    val message: String
)
```

Regras gerais:

- Respostas de sucesso devem retornar HTTP 200 ou 201 e `error: null`.
- Validações devem retornar HTTP 400.
- Login inválido deve retornar HTTP 401.
- Registros não encontrados devem retornar HTTP 404.
- Conflitos de unicidade, como CPF ou e-mail já cadastrado, devem retornar HTTP 409.
- O campo `message` deve ser claro, porque é exibido diretamente em toast no frontend.

## 3. Configuração Técnica Necessária

### 3.1. Porta

Rodar o backend na porta 9090, pois o frontend usa `http://localhost:9090` por padrão.

Em Spring Boot:

```properties
server.port=9090
```

### 3.2. CORS

Durante desenvolvimento, liberar pelo menos:

```text
http://localhost:5173
```

Como o Axios usa `withCredentials: true`, o backend não pode usar `allowedOrigins("*")` junto com credenciais.

Exemplo Spring Boot:

```kotlin
@Configuration
class CorsConfig {
    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val config = CorsConfiguration()
        config.allowedOrigins = listOf("http://localhost:5173")
        config.allowedMethods = listOf("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        config.allowedHeaders = listOf("Content-Type", "Authorization")
        config.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", config)
        return source
    }
}
```

### 3.3. Autenticação das Rotas

O frontend protege as telas apenas com `localStorage`, pela chave `usuario_logado`. Isso evita navegação visual sem login, mas não protege dados no servidor.

O backend deve proteger todos os endpoints funcionais, exceto:

- `POST /user/login`
- endpoint de solicitação de recuperação de senha
- endpoint de redefinição de senha por token

Como o frontend não envia `Authorization: Bearer` hoje, a opção mais compatível é o backend criar uma sessão/cookie HTTP-only no login. Se for decidido usar JWT no corpo da resposta, o frontend precisará ganhar um interceptor para enviar o token em todas as chamadas.

## 4. Autenticação e Usuários

### 4.1. Login

Endpoint já chamado pelo frontend:

```http
POST /user/login
```

Body enviado:

```json
{
  "email": "usuario@email.com",
  "password": "senha"
}
```

Resposta recomendada:

```json
{
  "data": {
    "id": 1,
    "name": "Nome do usuário",
    "email": "usuario@email.com",
    "token": "opcional-se-usar-jwt"
  },
  "error": null
}
```

Implementação:

- Buscar usuário pelo e-mail normalizado.
- Verificar se o usuário está ativo.
- Comparar senha com hash seguro, preferencialmente BCrypt.
- Em caso de sucesso, criar sessão ou emitir cookie/JWT.
- Retornar dados mínimos do usuário.
- Nunca retornar `passwordHash`.

Tabela sugerida:

```text
users
- id
- name
- email unique
- password_hash
- status_code
- created_at
- updated_at
```

### 4.2. Logout

O frontend atual apenas remove `usuario_logado` do `localStorage`. Para encerrar sessão no servidor, o backend deve oferecer:

```http
POST /user/logout
```

Esse endpoint ainda não é chamado pelo frontend, mas deve ser previsto para a próxima integração. Ele deve invalidar a sessão ou expirar o cookie.

### 4.3. Recuperação de Senha

Na tela de login, o fluxo "Esqueci minha senha" ainda está simulado. O backend precisa implementar:

```http
POST /user/password-recovery/request
```

Body:

```json
{
  "email": "usuario@email.com"
}
```

Comportamento:

- Receber o e-mail informado.
- Se o e-mail existir, gerar token seguro, salvar hash do token e vencimento.
- Enviar e-mail com link para:

```text
http://localhost:5173/redefinirSenha?token=<token>
```

- Retornar sucesso genérico mesmo se o e-mail não existir, para evitar enumeração de usuários.

Resposta:

```json
{
  "data": true,
  "error": null
}
```

Tabela sugerida:

```text
password_reset_tokens
- id
- user_id
- token_hash
- expires_at
- used_at
- created_at
```

### 4.4. Redefinição de Senha

A tela `ResetPasswordView.vue` já lê `token` da URL, mas ainda simula a requisição. O backend deve implementar:

```http
POST /user/password-recovery/reset
```

Body:

```json
{
  "token": "token-recebido-na-url",
  "password": "novaSenha"
}
```

Regras:

- Validar token existente, não expirado e não usado.
- Exigir senha com no mínimo 6 caracteres, pois o frontend já valida esse mínimo.
- Atualizar `password_hash`.
- Marcar token como usado.
- Encerrar sessões antigas do usuário, se houver controle de sessão.

## 5. Pacientes

O módulo de pacientes já está integrado a um serviço HTTP real. Portanto, estes endpoints são obrigatórios.

### 5.1. DTO Esperado Pelo Frontend

```kotlin
data class PatientDto(
    val id: Long? = null,
    val statusCode: Int? = null,
    val name: String? = null,
    val email: String? = null,
    val birthday: LocalDate? = null,
    val age: Int? = null,
    val sex: String? = null,
    val responsible: String? = null,
    val document: String? = null,
    val address: String? = null,
    val addressesNumber: String? = null,
    val homePhoneNumber: String? = null,
    val commercialPhoneNumber: String? = null,
    val phoneNumber: String? = null,
    val occupation: String? = null
)
```

Mapeamento usado pelo frontend:

| Campo API | Uso no frontend |
| --- | --- |
| `id` | ID numérico, exibido como `#0000001` |
| `statusCode` | `0` ou `null` = Ativo, `1` = Inativo |
| `name` | Nome completo |
| `email` | E-mail do paciente |
| `birthday` | Data de nascimento, formato `YYYY-MM-DD` |
| `age` | Idade; se não vier, o frontend consegue calcular |
| `sex` | Masculino, Feminino ou Outro |
| `responsible` | Nome do responsável |
| `document` | CPF, preferencialmente apenas dígitos |
| `address` | Endereço |
| `addressesNumber` | Número |
| `homePhoneNumber` | Telefone residencial |
| `commercialPhoneNumber` | Celular comercial |
| `phoneNumber` | Celular pessoal |
| `occupation` | Profissão |

Observação importante: o frontend valida CEP via ViaCEP, mas atualmente não envia `zipCode` para o backend. Se o backend precisar armazenar CEP, será necessário adicionar esse campo também no frontend.

### 5.2. Listagem

```http
GET /patient/list
```

Resposta:

```json
{
  "data": [
    {
      "id": 1,
      "statusCode": 0,
      "name": "Maria Santos Souza",
      "email": "maria@email.com",
      "birthday": "1990-05-10",
      "age": 36,
      "sex": "Feminino",
      "responsible": "Nome do responsável",
      "document": "55566677788",
      "address": "Rua Exemplo",
      "addressesNumber": "123",
      "homePhoneNumber": "4733334444",
      "commercialPhoneNumber": "47988887777",
      "phoneNumber": "47999998888",
      "occupation": "Professora"
    }
  ],
  "error": null
}
```

Regras:

- Retornar pacientes ativos e inativos, pois a tabela permite filtrar por status.
- Ordenar por mais recentes primeiro ou por nome; se seguir a experiência atual, mais recentes primeiro combina com a inserção no topo da tabela.
- Não paginar obrigatoriamente agora, porque o DataTable pagina no cliente. Paginação pode ser adicionada depois com novo contrato.

### 5.3. Cadastro

```http
POST /patient/register
```

Body esperado:

```json
{
  "id": null,
  "statusCode": 0,
  "name": "Maria Santos Souza",
  "email": "maria@email.com",
  "birthday": "1990-05-10",
  "age": 36,
  "sex": "Feminino",
  "responsible": "Nome do responsável",
  "document": "55566677788",
  "address": "Rua Exemplo",
  "addressesNumber": "123",
  "homePhoneNumber": "4733334444",
  "commercialPhoneNumber": "47988887777",
  "phoneNumber": "47999998888",
  "occupation": "Professora"
}
```

Regras:

- Gerar `id`.
- Forçar `statusCode = 0` no cadastro, mesmo que o frontend envie outro valor.
- Validar campos obrigatórios: `name`, `email`, `birthday`, `sex`, `responsible`, `document`, `address`, `addressesNumber`.
- Validar CPF no backend, não apenas no frontend.
- Normalizar CPF para apenas dígitos.
- Impedir CPF duplicado.
- Validar formato de e-mail.
- Calcular idade no backend a partir de `birthday`; o campo `age` vindo do frontend pode ser ignorado ou recalculado.
- Retornar o paciente salvo.

### 5.4. Edição

```http
POST /patient/edit
```

Body: mesmo DTO do cadastro, com `id` obrigatório.

Regras:

- Exigir `id`.
- Retornar 404 se não existir.
- Permitir edição de pacientes ativos e inativos, porque a reativação usa o mesmo endpoint.
- Validar CPF único desconsiderando o próprio paciente.
- Atualizar `statusCode` conforme enviado:
  - `0`: ativo
  - `1`: inativo
- Retornar paciente atualizado.

### 5.5. Exclusão/Inativação

O serviço já possui:

```http
DELETE /patient/delete/{id}
```

Hoje a tela não chama esse endpoint; ela usa `/patient/edit` enviando `statusCode = 1`. Mesmo assim, o backend deve implementar o `DELETE` como soft delete, não exclusão física.

Resposta:

```json
{
  "data": true,
  "error": null
}
```

Regra:

- Alterar `statusCode` para `1`.
- Não remover do banco, pois o manual e a UI indicam que registros podem ser consultados e reativados.

## 6. Procedimentos

O módulo de procedimentos também já está integrado a um serviço HTTP real.

### 6.1. DTO Esperado Pelo Frontend

```kotlin
data class ProcedureDto(
    val id: Long? = null,
    val statusCode: Int? = null,
    val name: String? = null,
    val value: BigDecimal? = null,
    val type: String? = null
)
```

Mapeamento:

| Campo API | Uso no frontend |
| --- | --- |
| `id` | ID numérico, exibido como `#0000001` |
| `statusCode` | `0` ou `null` = Ativo, `1` = Inativo |
| `name` | Descrição do procedimento |
| `value` | Valor em reais |
| `type` | Classificação |

Classificações exibidas no frontend:

- Prevenção
- Dentística
- Clareamento
- Endodontia
- Periodontia
- Cirurgia
- Prótese
- Radiologia
- Ortodontia
- Implantes

### 6.2. Listagem

```http
GET /procedure/list
```

Regras:

- Retornar ativos e inativos.
- A tabela inicia filtrando "Ativo", mas o usuário pode consultar inativos.
- Orçamento e agenda usam essa listagem e filtram `statusCode != 1`, então procedimentos inativos não devem aparecer nos seletores dessas telas.

### 6.3. Cadastro

```http
POST /procedure/register
```

Body:

```json
{
  "id": null,
  "statusCode": 0,
  "name": "Limpeza Simples",
  "value": 150.00,
  "type": "Prevenção"
}
```

Regras:

- Gerar `id`.
- Forçar `statusCode = 0`.
- Validar `name`, `value` e `type`.
- Impedir valor menor ou igual a zero.
- Opcional: impedir nomes duplicados ativos com mesma classificação.
- Retornar procedimento salvo.

### 6.4. Edição/Reativação/Inativação

```http
POST /procedure/edit
```

Regras:

- Exigir `id`.
- Permitir alteração de `statusCode`.
- A inativação e a reativação do frontend usam esse endpoint.
- Retornar procedimento atualizado.

### 6.5. Exclusão/Inativação por DELETE

```http
DELETE /procedure/delete/{id}
```

O frontend ainda não usa diretamente, mas o serviço já existe. Implementar como soft delete:

```json
{
  "data": true,
  "error": null
}
```

## 7. Orçamentos

A tela de orçamentos ainda usa dados mockados em memória (`quotationsMock`). O backend precisa criar a persistência e os endpoints para substituir esse estado local.

### 7.1. Comportamento Atual da Tela

A tela permite:

- Listar orçamentos.
- Filtrar por status, ID, data, paciente e valor.
- Criar orçamento.
- Selecionar paciente cadastrado por CPF ou nome.
- Permitir paciente não cadastrado, preenchendo nome manualmente.
- Adicionar procedimentos já cadastrados.
- Calcular total pela soma dos procedimentos.
- Permitir alteração manual do valor total.
- Editar orçamento.
- Inativar orçamento.
- Aprovar ou rejeitar orçamento pendente por menu de contexto.
- Reativar orçamento inativo como pendente.
- Gerar PDF no navegador.

### 7.2. Modelo Sugerido

```kotlin
enum class QuotationStatus {
    PENDENTE,
    APROVADO,
    REJEITADO,
    INATIVO
}

data class QuotationDto(
    val id: Long? = null,
    val code: String? = null,
    val patientId: Long? = null,
    val status: String,
    val generationDate: LocalDate,
    val patientName: String,
    val patientCpf: String? = null,
    val totalValue: BigDecimal,
    val procedures: List<QuotationProcedureDto>
)

data class QuotationProcedureDto(
    val id: Long? = null,
    val procedureId: Long? = null,
    val procedureCode: String? = null,
    val description: String,
    val value: BigDecimal,
    val classification: String
)
```

Para manter compatibilidade visual, o backend pode retornar `code` como `#0000001`. Internamente, deve manter `id` numérico. Se o frontend for ajustado, pode formatar o `id` da mesma forma que pacientes e procedimentos.

Tabelas sugeridas:

```text
quotations
- id
- code
- patient_id nullable
- patient_name
- patient_cpf
- status
- generation_date
- total_value
- created_by_user_id
- created_at
- updated_at

quotation_items
- id
- quotation_id
- procedure_id nullable
- procedure_code
- description
- value
- classification
- sort_order
```

Guardar `description`, `value` e `classification` também no item é importante. Assim, se o valor do procedimento mudar depois, o orçamento antigo continua fiel ao que foi aprovado ou enviado.

### 7.3. Endpoints Necessários

Listagem:

```http
GET /quotation/list
```

Cadastro:

```http
POST /quotation/register
```

Edição:

```http
POST /quotation/edit
```

Inativação:

```http
DELETE /quotation/delete/{id}
```

Alteração rápida de status:

```http
PATCH /quotation/{id}/status
```

Body:

```json
{
  "status": "APROVADO"
}
```

PDF, se a geração sair do frontend:

```http
GET /quotation/{id}/pdf
```

### 7.4. Regras de Negócio

- Orçamento novo deve iniciar como `PENDENTE`, salvo se o usuário selecionar outro status no formulário.
- `patientName` é obrigatório.
- `patientId` é opcional, porque o manual permite orçamento para paciente ainda não cadastrado.
- Se `patientId` for informado, validar se o paciente existe.
- Se `patientCpf` vier preenchido, normalizar para apenas dígitos.
- Itens de procedimento podem ser vazios no frontend atual, mas a melhor regra de backend é:
  - permitir orçamento sem itens se `totalValue > 0`;
  - se houver itens, cada item deve ter `description` e `value >= 0`;
  - se `procedureId` for informado, validar se existe e está ativo.
- O backend pode recalcular `totalValue` pela soma dos itens quando o frontend enviar `totalValue = 0`.
- Se o usuário alterar manualmente `totalValue`, o backend deve aceitar o valor enviado.
- `DELETE` deve marcar como `INATIVO`, não excluir fisicamente.
- Reativar um orçamento inativo deve colocá-lo como `PENDENTE`.
- Aprovar/rejeitar deve ser permitido principalmente quando o status atual for `PENDENTE`.

### 7.5. PDF de Orçamento

Hoje o PDF é criado no frontend com dados locais. Existem duas opções:

1. Manter PDF no frontend: backend só entrega dados completos do orçamento.
2. Gerar PDF no backend: criar `GET /quotation/{id}/pdf` retornando `application/pdf`.

Para o projeto, a segunda opção é mais robusta porque permite gerar o mesmo documento em qualquer computador e manter histórico. O PDF deve conter:

- Código do orçamento.
- Nome e CPF do paciente.
- Status.
- Data de geração.
- Lista de procedimentos.
- Classificação de cada procedimento.
- Valor individual.
- Valor total.

## 8. Agenda/Atendimentos

A tela de agenda ainda mantém atendimentos em memória dentro de `ScheduleView.vue`. O backend precisa implementar um módulo de atendimentos/agendamentos.

### 8.1. Comportamento Atual da Tela

A tela permite:

- Exibir agenda semanal/mensal/diária/lista.
- Criar atendimento clicando no botão "Adicionar atendimento".
- Criar atendimento selecionando um intervalo no calendário.
- Editar atendimento clicando no evento.
- Mover ou redimensionar evento no calendário.
- Selecionar paciente por CPF ou nome.
- Permitir nome de paciente manual, sem cadastro.
- Adicionar procedimentos ativos ao atendimento.
- Alterar status por menu de contexto.
- Excluir atendimento.

### 8.2. DTO Sugerido

```kotlin
enum class AppointmentStatus {
    PENDENTE,
    CONFIRMADO,
    REALIZADO,
    CANCELADO
}

data class AppointmentDto(
    val id: Long? = null,
    val code: String? = null,
    val status: String,
    val start: LocalDateTime,
    val end: LocalDateTime,
    val patientId: Long? = null,
    val patientName: String,
    val patientCpf: String? = null,
    val procedures: List<AppointmentProcedureDto>
)

data class AppointmentProcedureDto(
    val id: Long? = null,
    val procedureId: Long? = null,
    val procedureCode: String? = null,
    val description: String,
    val value: BigDecimal,
    val classification: String
)
```

O frontend da agenda hoje usa somente `Pendente` e `Confirmado`, mas o prontuário já exibe histórico com `Realizado`, `Pendente` e `Cancelado`. Por isso, o backend deve prever os quatro estados.

Tabelas sugeridas:

```text
appointments
- id
- code
- status
- start_at
- end_at
- patient_id nullable
- patient_name
- patient_cpf
- professional_user_id nullable
- notes nullable
- created_at
- updated_at

appointment_procedures
- id
- appointment_id
- procedure_id nullable
- procedure_code
- description
- value
- classification
- sort_order
```

### 8.3. Endpoints Necessários

Listagem:

```http
GET /appointment/list
```

Filtros recomendados:

```http
GET /appointment/list?start=2026-08-01T00:00:00&end=2026-08-31T23:59:59
```

Cadastro:

```http
POST /appointment/register
```

Edição:

```http
POST /appointment/edit
```

Alteração de status:

```http
PATCH /appointment/{id}/status
```

Alteração rápida de horário, usada por drag/drop e resize:

```http
PATCH /appointment/{id}/schedule
```

Body:

```json
{
  "start": "2026-08-18T09:00",
  "end": "2026-08-18T10:00"
}
```

Exclusão:

```http
DELETE /appointment/delete/{id}
```

### 8.4. Regras de Negócio

- `patientName`, `status`, `start`, `end` e pelo menos um procedimento válido são obrigatórios na tela atual.
- `end` deve ser posterior a `start`.
- `patientId` é opcional.
- Se `patientId` for informado, validar paciente existente e ativo.
- Se `procedureId` for informado, validar procedimento existente e ativo.
- Ao salvar itens, guardar snapshot de descrição, valor e classificação.
- O código exibido deve seguir o padrão `#0000001`.
- Excluir atendimento pode ser exclusão lógica com status `CANCELADO` ou remoção física. Como o prontuário precisa de histórico, a recomendação é não apagar fisicamente; usar `CANCELADO`.
- Alterações por arrastar/redimensionar no calendário devem persistir imediatamente.
- Recomenda-se impedir conflitos de horário para o mesmo profissional quando houver profissional vinculado.

## 9. Prontuário do Paciente

A tela de prontuário já consulta pacientes reais, mas todo o prontuário clínico ainda é local e se perde ao recarregar a página.

### 9.1. O Que Ainda Está Mockado ou Local

- `patientRecords`: objeto em memória com anamnese e exames.
- `attendanceHistory`: lista mockada de histórico de atendimentos.
- `saveAnamnesis`: apenas exibe toast de sucesso.
- Upload de exames: usa `URL.createObjectURL(file)`, sem enviar ao servidor.
- Remoção de exame: remove apenas da memória.

### 9.2. Modelo Geral

```kotlin
data class PatientRecordDto(
    val patientId: Long,
    val selectedAnamnesisType: String,
    val adultAnamnesis: AdultAnamnesisDto,
    val pediatricAnamnesis: PediatricAnamnesisDto,
    val exams: List<ExamAttachmentDto>,
    val attendances: List<AttendanceHistoryDto>
)
```

Tabela sugerida:

```text
clinical_records
- id
- patient_id unique
- selected_anamnesis_type
- adult_anamnesis_json
- pediatric_anamnesis_json
- created_at
- updated_at
```

Como a anamnese tem muitos campos e perguntas, armazenar JSON é uma boa solução para este projeto. Em PostgreSQL, usar `jsonb`. Em bancos mais simples, usar coluna `text` com JSON serializado.

### 9.3. Endpoints Necessários

Buscar prontuário:

```http
GET /patient-record/{patientId}
```

Salvar tipo de anamnese e respostas:

```http
POST /patient-record/{patientId}/anamnesis
```

Buscar histórico de atendimentos:

```http
GET /patient-record/{patientId}/attendances
```

Anexar exame:

```http
POST /patient-record/{patientId}/exams
Content-Type: multipart/form-data
```

Remover exame:

```http
DELETE /patient-record/{patientId}/exams/{examId}
```

Baixar/visualizar exame:

```http
GET /patient-record/{patientId}/exams/{examId}/file
```

### 9.4. Anamnese Adulto

DTO:

```kotlin
data class AdultAnamnesisDto(
    val mainComplaint: String? = null,
    val brushingFrequency: String? = null,
    val flossUse: String? = null,
    val responses: Map<String, AnamnesisQuestionResponseDto> = emptyMap()
)

data class AnamnesisQuestionResponseDto(
    val answer: String? = null,
    val details: String? = null
)
```

Chaves já usadas no frontend:

| Chave | Pergunta |
| --- | --- |
| `currentHealthProblem` | Apresenta-se com algum problema de saúde? |
| `medicalTreatment` | Está em tratamento médico atualmente? |
| `currentMedication` | Está tomando algum medicamento? |
| `seriousPastDisease` | Já teve alguma doença séria no passado? |
| `hospitalizedOrOperated` | Já foi hospitalizado e/ou operado? |
| `smoker` | Você é fumante? |
| `cardiovascularProblem` | Tem ou teve algum problema cardiovascular? |
| `breathOrChestPain` | Sente falta de ar ou dor no peito após esforços leves? |
| `hypertension` | É hipertenso? Tem pressão alta? |
| `frequentFainting` | Apresenta desmaios frequentes? |
| `epilepsy` | Tem disritmia/epilepsia? |
| `allergy` | Apresenta alergia a alguma medicação ou produto? |
| `dentalAnesthesia` | Já se submeteu a alguma anestesia dentária? |
| `asthmaOrRhinitis` | Tem asma ou rinite alérgica? |
| `diabetes` | É diabético? |
| `thirstOrHunger` | Sente sede ou fome na maior parte do tempo? |
| `slowHealing` | As feridas demoram para cicatrizar? |
| `abnormalBleeding` | Já teve sangramento anormal após extração dentária? |
| `bloodProblem` | Apresenta algum problema de sangue? |
| `mouthLesionTreatment` | Cirurgia/radioterapia por lesão na boca? |
| `nervous` | Considera-se excessivamente nervoso? |
| `swallowingDifficulty` | Tem dificuldade em engolir? |
| `skinDisease` | Tem alguma doença de pele? |
| `frequentSoreThroat` | Sente dores de garganta frequentemente? |
| `mouthBreathing` | Costuma respirar pela boca? |
| `toothAppearanceComplaint` | Queixa sobre aparência dos dentes? |
| `dentalTreatmentAnxiety` | Fica apreensivo em tratamento dentário? |
| `seriousDentalTreatmentProblem` | Problema sério em tratamento dentário? |
| `gumBleeding` | Gengiva sangra facilmente? |
| `bruxism` | Range ou aperta os dentes à noite? |
| `menstrualProblems` | Problemas associados ao período menstrual? |
| `contraceptiveUse` | Faz uso de contraceptivo? |
| `pregnant` | Está grávida? |

Respostas aceitas:

- `Sim`
- `Não`
- `Não sei`
- vazio

Algumas perguntas aceitam apenas `Sim`/`Não`; o backend pode ser flexível e validar apenas o conjunto geral para não travar evolução do formulário.

### 9.5. Anamnese Pediátrica

DTO:

```kotlin
data class PediatricAnamnesisDto(
    val mainComplaint: String? = null,
    val siblingsCount: String? = null,
    val mainCaregiver: String? = null,
    val preferredActivity: String? = null,
    val attends: PediatricAttendsDto = PediatricAttendsDto(),
    val schoolPeriod: String? = null,
    val brushing: String? = null,
    val brushingFrequency: String? = null,
    val flossUse: String? = null,
    val schoolServices: PediatricSchoolServicesDto = PediatricSchoolServicesDto(),
    val firstDentistVisit: String? = null,
    val lastDentistVisit: String? = null,
    val responses: Map<String, AnamnesisQuestionResponseDto> = emptyMap()
)

data class PediatricAttendsDto(
    val school: Boolean = false,
    val daycare: Boolean = false,
    val afterSchool: Boolean = false
)

data class PediatricSchoolServicesDto(
    val medicalCare: Boolean = false,
    val dentalCare: Boolean = false,
    val food: Boolean = false
)
```

Chaves já usadas:

| Chave | Pergunta |
| --- | --- |
| `prenatalCare` | Gravidez: pré-natal com médico |
| `congenitalAnomalies` | Anomalias congênitas? |
| `childHealthProblems` | Problemas com a saúde da criança? |
| `hospitalized` | Já esteve hospitalizado? |
| `surgery` | Já se submeteu a alguma cirurgia? |
| `currentMedication` | Faz uso de alguma medicação? |
| `anesthesia` | Já tomou anestesia? |
| `allergy` | Tem alguma alergia? |
| `initialFeeding` | Alimentação inicial |
| `accessoryDevices` | Uso de bico, mamadeira, dedo ou outro |
| `fruitsAndVegetables` | Alimenta-se de frutas e verduras? |

Respostas possíveis:

- `Sim`
- `Não`
- `Não sei`
- `Pouco`
- `Peito`
- `Mamadeira`
- vazio

### 9.6. Exames e Anexos

O frontend aceita:

- imagens (`image/*`)
- PDF (`application/pdf` ou arquivo `.pdf`)

DTO de retorno:

```kotlin
data class ExamAttachmentDto(
    val id: Long,
    val type: String,
    val date: LocalDate,
    val notes: String? = null,
    val fileName: String,
    val fileType: String,
    val size: Long,
    val url: String
)
```

Tabela sugerida:

```text
exam_attachments
- id
- patient_id
- clinical_record_id
- type
- exam_date
- notes
- original_file_name
- content_type
- file_size
- storage_path
- created_at
```

Regras:

- Validar tipo de arquivo no backend.
- Definir limite de tamanho, por exemplo 10 MB por arquivo.
- Gerar nome interno seguro, sem confiar no nome original.
- Salvar em disco local, storage privado ou banco, conforme estrutura do projeto.
- Retornar `url` apontando para endpoint protegido de download/visualização.
- Remover arquivo físico/storage ao excluir anexo ou marcar como removido.

### 9.7. Histórico de Atendimentos no Prontuário

O histórico mockado deve vir dos atendimentos reais. DTO:

```kotlin
data class AttendanceHistoryDto(
    val id: Long,
    val patientId: Long?,
    val patientCpf: String?,
    val date: LocalDateTime,
    val status: String,
    val professional: String?,
    val procedures: List<String>,
    val notes: String?
)
```

Regras:

- Buscar por `patientId`.
- Se existir atendimento antigo sem `patientId`, permitir associação por CPF normalizado.
- Ordenar do mais recente para o mais antigo.
- Incluir procedimentos vinculados ao atendimento.
- O campo `professional` pode vir do usuário logado que criou/realizou o atendimento.

## 10. Faturamento

O menu "Faturamento" aparece na home e no menu lateral, mas ainda não existe rota nem tela funcional. Portanto, ainda não há contrato de API fechado.

Recomendação:

- Não implementar regras detalhadas de faturamento antes da tela existir.
- Preparar apenas a base conceitual:
  - orçamentos aprovados podem gerar cobranças;
  - atendimentos realizados podem gerar receita;
  - pagamentos podem ter status `PENDENTE`, `PAGO`, `ATRASADO`, `CANCELADO`.

Quando o frontend for criado, os endpoints prováveis serão:

```http
GET /billing/list
POST /billing/register
POST /billing/edit
PATCH /billing/{id}/status
DELETE /billing/delete/{id}
```

## 11. Configurações

Há botão de configurações no topo e item no menu lateral, mas sem rota e sem ação. Ainda não existe contrato backend.

Possíveis implementações futuras:

- Dados da clínica.
- Dados do usuário.
- Alteração de senha autenticada.
- Preferências de agenda.
- Configuração de e-mail para recuperação de senha.

Por enquanto, implementar apenas o necessário para autenticação e recuperação de senha.

## 12. Banco de Dados Sugerido

Modelo mínimo para cobrir o frontend atual:

```text
users
password_reset_tokens
patients
procedures
quotations
quotation_items
appointments
appointment_procedures
clinical_records
exam_attachments
```

Enums/códigos:

```text
statusCode geral:
0 = Ativo
1 = Inativo

quotation_status:
PENDENTE
APROVADO
REJEITADO
INATIVO

appointment_status:
PENDENTE
CONFIRMADO
REALIZADO
CANCELADO

anamnesis_type:
adult
pediatric
```

## 13. Ordem Recomendada de Implementação

1. Configurar projeto Kotlin na porta 9090.
2. Implementar CORS com credenciais.
3. Criar envelope padrão `{ data, error }`.
4. Implementar autenticação: login, sessão/cookie e proteção dos endpoints.
5. Implementar pacientes, porque já há tela totalmente conectada.
6. Implementar procedimentos, porque pacientes, agenda e orçamento dependem deles.
7. Implementar recuperação e redefinição de senha, substituindo as simulações.
8. Implementar orçamentos com persistência.
9. Implementar agenda/atendimentos com persistência.
10. Implementar prontuário clínico, anamnese e anexos.
11. Integrar histórico do prontuário com atendimentos reais.
12. Deixar faturamento e configurações para depois da criação das telas.

## 14. Ajustes Necessários no Frontend Após o Backend Existir

Algumas telas ainda não possuem service próprio. Quando o backend estiver pronto, criar:

```text
src/infrastructure/services/QuotationService.ts
src/infrastructure/services/AppointmentService.ts
src/infrastructure/services/PatientRecordService.ts
```

Também será necessário:

- Trocar `quotationsMock` por chamada a `/quotation/list`.
- Trocar `appointments` mockado por chamada a `/appointment/list`.
- Fazer `saveAddedQuotation`, `saveEditedQuotation`, aprovação, rejeição, reativação e inativação chamarem o backend.
- Fazer `saveAppointment`, drag/drop, resize, alteração de status e exclusão chamarem o backend.
- Fazer `saveAnamnesis` persistir dados reais.
- Fazer upload/removal/visualização de exames usar endpoints multipart.
- Fazer recuperação/redefinição de senha chamar `AuthService`.
- Se a autenticação usar JWT no corpo, adicionar interceptor para `Authorization`.

## 15. Checklist Final Para o Backend

- O backend sobe em `localhost:9090`.
- O frontend em `localhost:5173` consegue chamar a API sem erro de CORS.
- `POST /user/login` autentica e retorna mensagem de erro clara em caso de falha.
- Pacientes podem ser listados, criados, editados, inativados e reativados.
- Procedimentos podem ser listados, criados, editados, inativados e reativados.
- Listagens retornam ativos e inativos quando a tela precisa filtrar status.
- Orçamentos são persistidos e deixam de depender de mock.
- PDF de orçamento pode ser gerado a partir de dados persistidos.
- Agenda é persistida e suporta criação, edição, movimentação, redimensionamento, status e cancelamento.
- Prontuário salva anamnese adulta/pediátrica.
- Exames são enviados ao servidor e recuperados por URL protegida.
- Histórico de atendimentos do prontuário vem da agenda real.
- Soft delete é usado onde a UI fala em inativação.
- Erros seguem `{ data: null, error: { code, message } }`.

