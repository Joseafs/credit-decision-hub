# Contexto compartilhado

Este arquivo centraliza o contexto funcional, técnico e metodológico do **Credit Decision Hub**.

Pessoas e agentes devem lê-lo antes de implementar, alterar arquitetura ou criar novas regras.

## Documentos canônicos

O contexto do projeto é dividido apenas quando cada documento possui uma responsabilidade clara:

- este `README.md` define produto, domínio, stack, princípios e fases;
- o [`SDD.md`](./SDD.md) registra o desenho técnico, as fronteiras e as decisões de arquitetura;
- o [`PROJECT-TASKS.md`](./PROJECT-TASKS.md) é a fonte operacional do estado atual, da próxima tarefa e das evidências de conclusão.

Ordem de leitura obrigatória: `README.md`, `SDD.md` e `PROJECT-TASKS.md`.

Evitar novos arquivos Markdown em `context/`. Uma nova separação exige uma responsabilidade duradoura que não pertença a nenhum dos três documentos canônicos.

## 1. Objetivo

O Credit Decision Hub é uma plataforma full-stack para acompanhamento e análise de propostas de crédito.

O projeto tem dois objetivos:

1. servir como aplicação funcional de portfólio;
2. aprofundar conhecimentos práticos em React, Node.js, MongoDB, Databricks, Terraform e arquitetura de monorepo.

Todos os dados devem ser fictícios. O sistema não deve ser apresentado como um motor real de concessão de crédito.

## 2. Visão do produto

Analistas poderão:

- autenticar-se na plataforma;
- visualizar propostas de crédito;
- cadastrar clientes;
- criar propostas;
- consultar detalhes e histórico;
- aprovar, reprovar ou encaminhar propostas para análise manual;
- filtrar propostas por status, risco, período e faixa de valor;
- acompanhar indicadores em dashboard;
- importar dados fictícios por CSV;
- consultar resultados analíticos processados pelo Databricks.

## 3. Stack definida

### Front-end — `apps/web`

- React
- React Router
- TypeScript
- Tailwind CSS
- Vite
- Formik
- Zod
- Vitest
- React Testing Library

Responsabilidades:

- interface utilizada pelos analistas;
- navegação entre páginas;
- formulários e feedback visual;
- integração com a API;
- apresentação de propostas, clientes e indicadores.

O front-end não deve acessar o banco de dados diretamente.

### Back-end — `apps/api`

- Node.js
- TypeScript
- Fastify
- Zod
- MongoDB
- Mongoose
- Vitest
- Swagger / OpenAPI

Responsabilidades:

- expor endpoints HTTP;
- validar entradas e saídas;
- aplicar regras de negócio;
- acessar o MongoDB;
- controlar autenticação e autorização quando essa etapa for implementada;
- integrar futuramente com o Databricks.

### Contratos compartilhados — `packages/contracts`

O Zod será usado no front-end, no back-end e nos contratos compartilhados.

Os contratos definem:

- payloads de entrada;
- respostas da API;
- parâmetros de rota e query;
- enums;
- mensagens e formatos de erro;
- tipos TypeScript inferidos dos schemas.

Princípio principal:

> O contrato deve ser definido uma vez e reutilizado pelo front-end e pelo back-end.

Formik controla o estado dos formulários. Zod valida os dados.

### Banco de dados

MongoDB será o banco operacional da aplicação.

Mongoose será responsável pela modelagem e persistência dos documentos.

Separação de responsabilidades:

- Zod valida o contrato da aplicação;
- Mongoose define como o dado é salvo e consultado no MongoDB.

### Monorepo

- pnpm workspaces
- Turborepo

O monorepo é a organização de várias aplicações e pacotes em um único repositório.

O Turborepo gerencia tarefas, dependências, cache e execução dos comandos.

### Tecnologias posteriores

Estas tecnologias fazem parte da evolução do projeto, mas não são requisito da fundação inicial:

- Databricks;
- Apache Spark / PySpark;
- Databricks SQL;
- Terraform;
- Docker;
- Docker Compose;
- GitHub Actions;
- autenticação com JWT e hash de senha.

Não adicionar essas tecnologias antes de existir uma necessidade concreta na fase correspondente.

## 4. Estrutura esperada

```txt
credit-decision-hub/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   └── contracts/
├── databricks/
├── infrastructure/
│   └── terraform/
├── context/
│   ├── README.md
│   ├── SDD.md
│   └── PROJECT-TASKS.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

Os diretórios de tecnologias futuras só devem ser criados na fase correspondente.

## 5. Conceitos principais

### React

Interface da aplicação.

### Node.js

Ambiente de execução do back-end.

### Fastify

Framework usado para criar a API, rotas, plugins e tratamento HTTP.

### Zod

Validação de dados e fonte dos tipos compartilhados.

### MongoDB

Banco de dados operacional.

### Mongoose

Camada de modelagem e acesso ao MongoDB.

### Databricks

Plataforma de processamento e análise de dados.

No projeto, será usada futuramente para processar conjuntos maiores de propostas e gerar indicadores como:

- taxa de aprovação;
- ticket médio;
- distribuição de risco;
- motivos de reprovação;
- evolução mensal;
- agrupamentos por perfil.

Databricks não substitui o MongoDB.

### Terraform

Infraestrutura como código.

Descreve os recursos necessários para executar a aplicação, como serviços, ambientes, permissões e configurações.

Terraform não contém regras de negócio.

## 6. Domínio inicial

### Usuários

Perfis iniciais:

- administrador;
- analista.

### Cliente

Campos iniciais:

- id;
- nome;
- documento fictício;
- e-mail;
- telefone;
- renda mensal;
- ocupação;
- data de criação.

### Proposta

Campos iniciais:

- id;
- cliente;
- valor solicitado;
- quantidade de parcelas;
- score fictício;
- comprometimento de renda;
- nível de risco;
- status;
- motivo da decisão;
- responsável pela análise;
- data de criação;
- data da última atualização.

### Status

- `pending`
- `approved`
- `rejected`
- `manual_review`
- `pending_documents`
- `fraud_suspected`

### Nível de risco

- `low`
- `medium`
- `high`

## 7. Regras iniciais

Estas regras são apenas uma simulação didática:

- score alto e baixo comprometimento de renda aumentam a chance de aprovação;
- score baixo e comprometimento elevado aumentam a chance de reprovação;
- propostas de valor elevado podem exigir análise manual;
- documentação incompleta gera `pending_documents`;
- inconsistências específicas podem gerar `fraud_suspected`;
- toda mudança de status deve gerar histórico;
- decisões manuais devem registrar o usuário responsável;
- nenhuma regra deve ser tratada como modelo financeiro real.

Os critérios objetivos, a precedência e os casos de fronteira aprovados estão registrados na seção de propostas do [`SDD.md`](./SDD.md).

Não alterar regras do domínio silenciosamente.

## 8. População inicial

Usar `@faker-js/faker` com locale `pt_BR`.

Carga sugerida:

- 1 administrador;
- 5 analistas;
- 500 clientes;
- 1.000 propostas;
- histórico distribuído pelos últimos 12 meses.

Os dados devem ser coerentes entre score, renda, valor solicitado, risco e status.

Também devem existir cenários determinísticos:

- proposta aprovada;
- proposta reprovada por score baixo;
- proposta em análise manual;
- proposta com suspeita de fraude;
- proposta aguardando documentos.

## 9. Arquitetura do back-end

Estrutura inicial simples, organizada por domínio:

```txt
apps/api/src/
├── app.ts
├── server.ts
├── config/
├── database/
├── shared/
└── modules/
    ├── customers/
    ├── proposals/
    └── users/
```

Estrutura sugerida por módulo:

```txt
proposals/
├── proposal.routes.ts
├── proposal.controller.ts
├── proposal.service.ts
├── proposal.repository.ts
├── proposal.model.ts
└── proposal.test.ts
```

Responsabilidades:

- route define endpoint e schemas HTTP;
- controller recebe a requisição e monta a resposta;
- service aplica regras de negócio;
- repository acessa persistência;
- model define a collection do MongoDB.

Evitar abstrações prematuras e camadas sem função real.

## 10. Arquitetura do front-end

Componentes devem ser pequenos e separados quando fizer sentido:

```txt
src/components/ProposalCard/
├── index.tsx
├── types.ts
├── styles.ts
└── tests.tsx
```

Princípios:

- separar apresentação, estado e integração;
- reutilizar contratos compartilhados;
- manter chamadas HTTP fora dos componentes visuais;
- usar Formik para controle dos formulários;
- usar Zod para validação;
- evitar estado global sem necessidade;
- priorizar legibilidade.

Context API deve ser usada somente para estado global simples, como sessão e permissões, quando necessário.

## 11. Testes

### Convenções

- usar `test` em vez de `it`;
- descrições devem começar com `should`;
- usar `screen` nas consultas do React Testing Library;
- usar Faker quando a aleatoriedade não comprometer a previsibilidade;
- criar helpers de renderização reutilizáveis;
- testar comportamento, não detalhes internos.

### Front-end

Usar Vitest e React Testing Library.

### Back-end

Usar Vitest e `Fastify.inject()`.

Testar:

- schemas Zod;
- regras de negócio;
- services;
- repositories quando necessário;
- endpoints;
- transições de status;
- erros esperados.

## 12. Qualidade de código

- TypeScript estrito;
- nomes claros;
- funções pequenas;
- responsabilidade única;
- composição sobre herança;
- evitar `any`;
- aplicar SOLID com pragmatismo;
- evitar duplicação real;
- não criar abstrações prematuras;
- não adicionar dependências sem justificativa.

## 13. Segurança

- usar somente dados fictícios;
- não versionar segredos;
- usar variáveis de ambiente;
- validar todas as entradas;
- não registrar senhas ou tokens em logs;
- armazenar senhas com hash quando autenticação for implementada;
- manter trilha de auditoria das decisões.

## 14. Arquitetura de hospedagem prevista

Esta seção registra somente a decisão arquitetural. Nenhum serviço de deploy deve ser configurado antes da Fase 6.

```txt
GitHub
├── Vercel        → front-end React (apps/web)
├── Render Free   → API Node.js/Fastify (apps/api)
└── MongoDB Atlas → banco de dados MongoDB
```

Responsabilidades:

- GitHub mantém o código-fonte e integra os provedores de deploy;
- Vercel hospeda os arquivos estáticos gerados pelo front-end Vite;
- Render executa a API Fastify como Web Service;
- MongoDB Atlas permanece como banco operacional e não depende do sistema de arquivos do Render.

### 14.1 Escolha do Render Free

O projeto é destinado exclusivamente a:

- estudo;
- testes;
- portfólio;
- demonstrações esporádicas;
- baixo volume de acessos.

O Render Free foi escolhido para a API por oferecer:

- instância gratuita de Web Service adequada a testes e projetos pessoais;
- integração com GitHub e deploy automático;
- suporte a aplicações Node.js e Fastify;
- logs acessíveis;
- HTTPS com certificado TLS gerenciado;
- suspensão automática quando o serviço fica sem uso;
- operação sem depender de um pequeno crédito financeiro mensal.

Essa escolha não qualifica o plano gratuito para produção. O próprio Render recomenda instâncias gratuitas para testes, projetos pessoais e avaliação da plataforma.

Limitações aceitas:

- o serviço gratuito entra em suspensão após 15 minutos sem tráfego de entrada;
- a primeira requisição seguinte inicia novamente o serviço e pode levar cerca de um minuto;
- o front-end deve distinguir esse tempo de inicialização de uma indisponibilidade definitiva;
- o workspace possui limites mensais de horas de instância, banda e minutos de build;
- o sistema de arquivos do serviço é efêmero e não deve armazenar dados persistentes.

Mensagem prevista para o estado de inicialização:

> A API de demonstração está iniciando. Isso pode levar alguns segundos.

Os limites e preços foram verificados em 29 de julho de 2026 e devem ser confirmados novamente antes do deploy.

### 14.2 Comparação com Railway

Railway também é compatível com Node.js, Fastify, monorepos, pnpm, Turborepo e deploy pelo GitHub.

Na data desta decisão, o plano Free do Railway oferece US$ 1 de crédito mensal após o período de avaliação. Esse crédito pode ser insuficiente para uma API que permaneça ativa por períodos maiores.

Para este projeto de demonstração, o Render Free foi escolhido por ser mais previsível sem custo para um serviço de uso intermitente e por não depender do consumo de um pequeno crédito monetário.

Para projetos maiores, aplicações contínuas ou ambientes com maior uso, Railway será a preferência inicial de avaliação por oferecer uma experiência integrada para:

- gerenciamento de serviços;
- variáveis de ambiente;
- logs;
- deploy de monorepos;
- serviços internos;
- bancos e workers;
- escalabilidade operacional;
- planos pagos baseados em consumo.

Essa preferência futura não significa que Render não suporte produção. É uma decisão de conveniência para projetos com maior escala e orçamento, que deverá ser reavaliada conforme os requisitos reais e os planos disponíveis.

### 14.3 Variáveis previstas

Front-end na Vercel:

```env
VITE_API_URL=https://credit-decision-api.onrender.com
```

`VITE_API_URL` é pública por ser incorporada ao bundle do Vite. Ela não deve conter segredos e deverá usar a URL efetivamente atribuída ao serviço no Render.

API no Render:

```env
MONGODB_URI=<configurar como segredo no Render>
MONGODB_DATABASE=credit-decision-hub
```

Regras:

- `MONGODB_URI` nunca deve ser enviada ao front-end ou versionada;
- `PORT` será fornecida pelo Render e a API continuará lendo essa variável;
- `MONGODB_DNS_SERVERS` permanece opcional e só deve ser configurada se o ambiente exigir;
- novas variáveis só devem ser adicionadas quando a implementação correspondente existir.

### 14.4 Pré-requisitos para o deploy futuro

Antes de configurar os serviços, será necessário:

- fazer o front-end consumir `VITE_API_URL` em produção;
- configurar CORS na API com a origem efetiva da Vercel;
- definir diretórios raiz, comandos de build e start para cada aplicação do monorepo;
- usar `GET /health` como health check da API;
- configurar no Atlas somente os intervalos de saída informados pelo serviço Render;
- validar a estratégia de rotas do React Router na Vercel;
- implementar no front-end o estado visual de inicialização da API;
- revisar novamente preços, cotas e limitações dos três provedores.

Não liberar `0.0.0.0/0` no Atlas como configuração padrão. O Atlas deve permitir somente as origens necessárias, usando os intervalos CIDR de saída exibidos no painel do serviço Render.

Referências oficiais consultadas:

- [Render — Free instances](https://render.com/docs/free);
- [Render — Outbound IP addresses](https://render.com/docs/outbound-ip-addresses);
- [Railway — Pricing plans](https://docs.railway.com/pricing/plans);
- [Vercel — Monorepos](https://vercel.com/docs/monorepos);
- [Vercel — Vite](https://vercel.com/docs/frameworks/frontend/vite);
- [MongoDB Atlas — IP access list](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/).

## 15. Entrega incremental

### Fase 1 — Fundação

- configurar pnpm workspaces;
- configurar Turborepo;
- criar `apps/web`;
- criar `apps/api`;
- criar `packages/contracts`;
- configurar TypeScript, lint e format.

### Fase 2 — API e banco

- conectar MongoDB;
- criar módulos de clientes e propostas;
- criar schemas compartilhados com Zod;
- criar seed inicial;
- documentar endpoints com Swagger.

### Fase 3 — Front-end

- criar listagem de propostas;
- criar detalhes;
- criar formulário com Formik e Zod;
- criar filtros;
- integrar com a API.

### Fase 4 — Autenticação e dashboard

- criar autenticação;
- criar permissões;
- criar indicadores operacionais;
- adicionar gráficos quando necessários;
- adicionar histórico e auditoria.

### Fase 5 — Databricks

- exportar dataset fictício;
- criar notebook de processamento;
- gerar indicadores analíticos;
- integrar resultados ao dashboard.

### Fase 6 — Infraestrutura

- adicionar Docker;
- configurar GitHub Actions;
- criar Terraform;
- preparar deploy gratuito ou demonstrativo.

## 16. Regras para agentes

Antes de implementar:

1. ler este arquivo;
2. ler o `SDD.md`;
3. consultar o `PROJECT-TASKS.md` e executar somente a tarefa ativa;
4. verificar a estrutura e o estado real do repositório;
5. preservar as decisões adotadas;
6. não adicionar bibliotecas ou camadas sem necessidade;
7. não implementar fases futuras antecipadamente;
8. não inventar requisitos de negócio;
9. manter alterações pequenas e revisáveis;
10. manter uma tarefa por commit;
11. registrar no router apenas resultados confirmados por comandos ou testes;
12. atualizar este arquivo apenas quando uma decisão compartilhada realmente mudar.
