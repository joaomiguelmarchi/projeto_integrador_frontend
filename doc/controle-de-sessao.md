# Controle de sessão — frontend e contrato do backend

## Implementado no frontend

- Inatividade de 30 minutos por padrão. Configure VITE_SESSION_IDLE_MINUTES no ambiente do Vite e reinicie/recompile a aplicação.
- Cliques, movimento do ponteiro, teclado, rolagem e toque contam como atividade real quando a aba está visível. Requisições automáticas não renovam o contador local.
- A verificação ocorre a cada segundo, ao retornar à aba, ao recuperar foco, ao restaurar a página e antes de requisições protegidas. Usa timestamps, portanto suspender o computador não reinicia a contagem.
- Atividade e logout são compartilhados entre abas da mesma origem. Recarregar não reinicia o prazo. Trocar de sessão em outra aba recarrega a interface para descartar dados do usuário anterior.
- Sair do sistema limpa imediatamente a sessão local e solicita POST /user/logout. Falha de rede é informada no login; não é apresentada como revogação confirmada.
- Navegação protegida valida GET /user/me. Falha de rede impede acesso à nova tela protegida. HTTP 401 de requisições autenticadas encerra a sessão; 403 não é tratado como expiração.
- Respostas de sucesso pertencentes a uma sessão encerrada são descartadas. Um 401 antigo não encerra uma sessão nova.
- localStorage guarda somente identificador local aleatório, último horário de atividade e expiração absoluta. O token não é armazenado ali. O marcador antigo usuario_logado é removido.
- O cookie continua HttpOnly e é enviado com withCredentials. O prazo absoluto local usa data.expiration do login, em segundos.
- Novo login aguarda o logout em andamento (inclusive o marcador compartilhado entre abas). Isso reduz a corrida entre revogação e emissão de cookie; a atomicidade final depende do servidor.

## O que já existe no backend inspecionado

Projeto: C:/dev/projeto_integrador_backend. Nenhum arquivo desse projeto foi alterado.

| Arquivo | Comportamento atual |
| --- | --- |
| src/main/kotlin/org/pi/controller/UserController.kt | POST /user/login, GET /user/me e POST /user/logout já existem. |
| src/main/kotlin/org/pi/service/TokenService.kt | JWT com subject=email, sessionVersion e expiração fixa de sete dias. |
| src/main/kotlin/org/pi/service/CookieService.kt | Cookie HttpOnly, SameSite=Strict, Path=/ e Max-Age igual ao prazo do token; secure configurável, atualmente false. |
| src/main/kotlin/org/pi/service/IdentityService.kt | Valida usuário ativo e sessionVersion na autenticação. |
| src/main/kotlin/org/pi/usecase/UserUseCase.kt | Logout incrementa sessionVersion; alteração e recuperação de senha também invalidam tokens anteriores. |
| src/main/resources/application.properties | Política autenticada para rotas não públicas. |
| src/test/kotlin/org/pi/BackendFlowTest.kt | Já verifica rejeição de cookie após logout e troca de senha. |

Não há registro persistente de última atividade por sessão. Assim, o timeout do frontend melhora o fluxo, mas ainda não garante a expiração por inatividade contra acesso direto à API, alteração do armazenamento ou navegador desconectado.

## Modelo de sessão necessário

Criar uma entidade/tabela de sessões, por exemplo UserSessionJPA, e seu repositório, com:

- id: UUID criptograficamente aleatório, único por login; incluir como claim sid no JWT.
- userId: relacionamento com usuário.
- createdAt, lastActivityAt, expiresAt: instantes UTC definidos pelo servidor.
- revokedAt: nulo enquanto válida.
- version: coluna de controle otimista ou estratégia equivalente para atualização concorrente.

Não persistir o JWT completo. Indexar id, userId e expiresAt. Usar banco compartilhado ou Redis com persistência/política apropriada em aplicações com várias instâncias; mapa em memória por instância não garante revogação consistente.

## Login e expiração absoluta

Em UserUseCase.login, após verificar senha e status, criar a sessão em transação e emitir JWT com sid e a sessionVersion atual. TokenService deve receber a expiração calculada, em vez de fixar Duration.ofDays(7).

Introduzir configurações de servidor, por exemplo app.session.idle-timeout=PT30M e app.session.absolute-timeout=PT8H. Oito horas é uma proposta configurável; o frontend respeita a duração retornada. Atividade nunca pode estender expiresAt nem o exp do JWT.

Preservar o contrato atualmente consumido:

POST /user/login → HTTP 200, Set-Cookie e corpo:

    { "data": { "expiration": 28800 }, "error": null }

expiration é duração em segundos. O campo token pode ser removido do JSON: o frontend não o usa. Para evitar desvio de relógio/rede, pode-se evoluir o contrato com expiresAt e serverTime, mas isso exige adaptar o cálculo no frontend; hoje ele usa expiration a partir do recebimento do login.

## Validação em toda requisição protegida

Estender IdentityService (ou um serviço de sessão invocado por ele), preservando a validação criptográfica do JWT, do usuário ativo e da sessionVersion:

1. Exigir sid válido e localizar a sessão correspondente ao usuário autenticado.
2. Rejeitar sessão inexistente, revogada, com now >= expiresAt ou now - lastActivityAt >= idleTimeout.
3. Rejeitar antes de atualizar lastActivityAt: uma sessão vencida nunca pode ser reativada por uma nova requisição.
4. Fazer validação/atualização de forma atômica; concorrência com logout não pode desfazer revokedAt.
5. Responder HTTP 401 real, não HTTP 200 contendo somente error. O corpo pode usar códigos SESSION_EXPIRED, SESSION_IDLE_TIMEOUT e SESSION_REVOKED.
6. Usar HTTP 403 para falta de permissão de uma sessão válida.

Não atualizar atividade em GET /user/me nem em polling automático. Isso impediria a expiração de uma aba abandonada. Definir explicitamente quais operações de negócio representam atividade; o endpoint abaixo cobre o usuário que está preenchendo formulários sem salvar.

## Sincronização da atividade humana

Implementar POST /user/session/activity, autenticado, sem necessidade de body:

- Identificar a sessão pelo cookie/JWT e sid; não aceitar userId ou horário fornecido pelo cliente como autoridade.
- Validar primeiro todas as condições de expiração e revogação.
- Atualizar lastActivityAt com o relógio do servidor e retornar 204 ou 200 com data=true.
- Em sessão vencida/revogada, retornar 401, sem renovar ou criar sessão.
- Aplicar limitação de frequência; a atualização em armazenamento pode ser consolidada, preservando o prazo correto.

A integração frontend já está preparada, desativada por compatibilidade com o backend atual. Após publicar o endpoint, configurar VITE_SESSION_ACTIVITY_SYNC=true e recompilar. Ela envia no máximo uma solicitação por minuto, somente após eventos humanos em aba visível, nunca a partir do timer de inatividade. Deixar VITE_SESSION_IDLE_MINUTES igual ou menor que o timeout do servidor; este sempre é a autoridade. Para testes com prazos inferiores a um minuto, ajustar também o intervalo de sincronização.

## Logout e revogação

O logout atual invalida todos os tokens do usuário ao incrementar sessionVersion. Isso funciona, mas encerra também outras sessões/dispositivos. Com sid, POST /user/logout deve revogar apenas a sessão corrente; preservar o incremento de sessionVersion para sair de todos os dispositivos, mudança de senha e bloqueio do usuário.

- Revogar a sessão em transação antes de responder.
- Limpar o cookie usando exatamente nome, Path e Domain usados na criação, Max-Age=0, HttpOnly e atributos equivalentes.
- Tornar logout idempotente: sessão já expirada/ausente também deve resultar em limpeza de cookie. Como hoje a rota é protegida pela política geral, ajustar o tratamento de autenticação dessa rota para permitir a limpeza sem autorizar nenhuma outra operação. Não revogar sessões arbitrárias a partir de identificador enviado pelo cliente.
- Se o navegador não tiver conexão, o frontend só consegue sair localmente. A expiração de servidor é necessária para limitar a validade restante do cookie.
- Revogação por sid evita que uma solicitação de logout atrasada invalide uma sessão nova por incremento global de sessionVersion. Ainda considerar a ordem de respostas Set-Cookie no navegador e impedir processamento concorrente indevido.

## Cookie, CORS e cache

Em produção HTTPS, configurar app.cookie.secure=true. Manter HttpOnly. SameSite=Strict funciona com frontend/API no mesmo site; se a implantação exigir sites distintos, revisar SameSite=None com Secure, CORS com origens explícitas e proteção CSRF/validação de Origin para métodos que alteram estado. Não usar origem wildcard com credenciais.

Adicionar Cache-Control: no-store a login, /user/me, logout e respostas sensíveis. Não registrar cookies, tokens ou senhas nos logs. Garantir que somente os endpoints realmente públicos estejam liberados pela política de autenticação.

## Testes necessários no backend

Usar relógio injetável para testar sem esperar minutos reais:

1. Login cria sid único, devolve expiration em segundos e cookie com atributos corretos.
2. /user/me com cookie válido retorna data.id; sem cookie retorna 401.
3. Aos 30 minutos exatos sem atividade, qualquer rota protegida retorna 401.
4. Atividade antes do limite renova lastActivityAt, mas não expiresAt; atividade após o limite não ressuscita sessão.
5. /user/me e polling não renovam inatividade.
6. Logout revoga o sid e limpar cookie é idempotente. Reutilizar o cookie anterior resulta em 401.
7. Duas sessões do mesmo usuário: logout comum invalida somente uma; troca de senha invalida ambas por sessionVersion.
8. Concorrência entre logout, atividade e requisições de negócio nunca restaura sessão revogada.
9. Instâncias diferentes do backend observam a mesma revogação.
10. Expiração absoluta rejeita a sessão mesmo com atividade contínua.

## Validação do frontend

Executar node --test tests/session.test.cjs e npm run build. Os testes locais cobrem marcador legado, armazenamento sem token, limite exato de inatividade, impossibilidade de reativar sessão vencida, expiração absoluta e logout. A validação integrada com navegador/backend continua necessária para cookie/CORS, múltiplas abas, falha de rede e revogação real; não foi executado login ou logout em conta real nesta implementação.
