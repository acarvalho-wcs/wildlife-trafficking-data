# Solicitações de acesso — implantação segura

A interface (PT/EN/ES) coleta instituição/organização e justificativa na opção **Solicitar acesso**. A senha permanece no Firebase Authentication. O usuário deve verificar o e-mail antes da criação de `access_requests/{uid}`, cujo estado inicial é `pending`.

## Notificação administrativa

O backend `functions/index.js` inclui `notifyAccessRequest`, disparado pela criação do pedido no Firestore. O destinatário fixo é `inteligencia@wcs.org`. O aviso apresenta e-mail confirmado, instituição, justificativa e link de revisão `https://acarvalho-wcs.github.io/nimf-site/secure.html?request=<uid>`.

O link **não aprova** o pedido. Ao abri-lo, é necessário estar autenticado com a conta administrativa e confirmar a ação no botão **Aprovar acesso**. Isso evita aprovações provocadas por pré-visualizações e verificadores automáticos de links de e-mail. Não há suporte seguro e universal para aprovar diretamente com um clique dentro de qualquer cliente de e-mail sem confirmação.

## Aprovação

O endpoint `approveAccessRequest` valida o ID token Firebase, exige a conta administrativa institucional, confere `access/{adminUid}.admin == true`, verifica a confirmação de e-mail do solicitante e aprova por transação. A gravação de `access/{uid}` permanece bloqueada a clientes e não confere privilégios de administrador nem acesso a Relatórios de Inteligência.

## Ativação pendente

Este código não está implantado em Cloud Functions. É necessário, por administrador habilitado no projeto Firebase:

1. Configurar cobrança/plano compatível com Firebase Functions e habilitar as APIs pertinentes, quando necessário.
2. Configurar um aplicativo no Microsoft Entra ID com permissão Microsoft Graph `Mail.Send` de **aplicativo** e consentimento administrativo. Restringir a permissão à caixa remetente autorizada no Exchange Online (RBAC for Applications, aplicado pela equipe de TI). Guardar em Firebase Secrets, jamais no GitHub: `NIMF_MS_TENANT_ID`, `NIMF_MS_CLIENT_ID`, `NIMF_MS_CLIENT_SECRET`, `NIMF_MS_SENDER`. A caixa remetente deve existir no Microsoft 365; pode ser `inteligencia@wcs.org` se a equipe de TI autorizar. O destinatário é `inteligencia@wcs.org`.
3. Na máquina ou ambiente de deploy autorizado, executar `npm --prefix functions install` e `firebase deploy --only functions,firestore:rules --project <project-id>` **após verificar o project ID e conferir a configuração de permissões de cada função**. Não colocar credenciais administrativas no navegador.
4. Testar as regras com o emulador, criar uma conta de teste e verificar que e-mail de administração chega ao destino, que links apenas abrem a página, que a decisão pede confirmação e que a aprovação do painel **não concede** acesso a relatórios.
5. A equipe de TI deve revisar políticas de envio, auditoria, Exchange Online RBAC e SPF/DKIM/DMARC. Uma resposta HTTP 202 do Graph indica apenas aceitação da solicitação de envio, não entrega efetiva.

A coleção `access_requests` só poderá ser escrita uma vez pelo próprio solicitante com e-mail verificado. Para evitar mensagens repetidas, a notificação dispara apenas na criação do documento. O administrador deve revisar pedidos manualmente; nunca aprovar automaticamente pedidos com base apenas no domínio do e-mail.

**Nunca enviar segredos, anexos de relatórios ou tokens de aprovação por e-mail.**

## Configuração Microsoft 365

O transporte está em `functions/graph-mail.js`: autenticação OAuth 2.0 client credentials via `login.microsoftonline.com/{tenant}/oauth2/v2.0/token`, escopo `https://graph.microsoft.com/.default`, seguida de `POST /v1.0/users/{sender}/sendMail`. Não utiliza senha de caixa de correio. A equipe de TI deve criar a aplicação, conceder apenas as permissões necessárias e restringir o remetente no Exchange Online; **não habilitar Mail.Send com acesso irrestrito a todas as caixas**. Aprovações requerem autenticação independente no Firebase e não ocorrem pela simples abertura do e-mail.

Para ativar, um administrador com acesso de implantação deve configurar os quatro segredos e publicar funções e regras. Até esse procedimento, notificações por e-mail e aprovação online não estarão ativas.
