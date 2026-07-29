# Contexto compartilhado

Este arquivo concentra o contexto funcional, técnico e metodológico do **Credit Decision Hub**.

Agentes e pessoas devem lê-lo antes de implementar, alterar arquitetura ou criar novas regras.

---

## 1. Objetivo do projeto

O Credit Decision Hub é uma plataforma full-stack para acompanhamento e análise de propostas de crédito.

O projeto tem dois objetivos:

1. servir como aplicação funcional de portfólio;
2. aprofundar conhecimentos práticos em React, Node.js, MongoDB, Databricks, Terraform e arquitetura de monorepo.

A solução deve demonstrar organização, qualidade de código, contratos bem definidos, testes, documentação objetiva e decisões técnicas justificáveis.

Todos os dados devem ser fictícios. O sistema não deve ser apresentado como motor real de concessão de crédito.

---

## 2. Visão do produto

Analistas poderão:

- autenticar-se na plataforma;
- visualizar propostas de crédito;
- cadastrar clientes;
- criar propostas;
- consultar detalhes e histórico;
- aprovar, reprovar ou encaminhar propostas para análise manual;
- filtrar propostas por status, risco, período e faixa de valor;
- acompanhar indicadores em um dashboard;
- importar dados fictícios por CSV;
- consultar resultados analíticos processados pelo Databricks.

---

## 3. Stack principal

### Front-end

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Material UI
- Recharts
- Vitest ou Jest
- React Testing Library
- Storybook

### Back-end

- Node.js
- TypeScript
- Fastify
- MongoDB
- Mongoose
- Zod
- JWT
- Swagger / OpenAPI
- Vitest ou Jest

### Dados e infraestrutura

- Databricks
- Apache Spark / PySpark
- Databricks SQL
- Terraform
- Docker
- Docker Compose
- GitHub Actions

### Monorepo

- pnpm workspaces
- Turborepo

---

## 4. Conceitos e responsabilidades

### React

Responsável pela interface utilizada pelos analistas.

Não deve acessar banco de dados diretamente.

### Node.js

Responsável pela API, autenticação, validações, regras de negócio, persistência e integrações.

### Contratos de API

Definem a comunicação entre front-end e back-end:

- payloads de entrada;
- respostas;
- validações;
- erros;
- status HTTP;
- enums e tipos compartilhados.

Os contratos compartilhados devem ficar em `packages/contracts`.

### MongoDB

Banco operacional da aplicação.

Armazena usuários, clientes, propostas, decisões e histórico de auditoria.

### Databricks

Plataforma de processamento analítico.

Será usada para transformar e analisar conjuntos maiores de propostas, gerando indicadores como:

- taxa de aprovação;
- ticket médio;
- distribuição de risco;
- motivos de reprovação;
- evolução mensal;
- agrupamentos por perfil.

O Databricks não substitui o MongoDB.

### Terraform

Infraestrutura como código.

Responsável por descrever recursos de infraestrutura, ambientes, permissões e configurações necessárias para executar a aplicação.

Terraform não contém regras de negócio.

### Turborepo

Ferramenta de gerenciamento do monorepo.

Deve organizar tarefas, dependências, cache e execução de comandos entre aplicações e pacotes.

---

## 5. Estrutura inicial esperada

```txt
credit-decision-hub/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── contracts/
│   ├── ui/
│   ├── eslint-config/
│   └── tsconfig/
├── databricks/
├── infrastructure/
│   └── terraform/
├── context/
│   └── README.md
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

A estrutura pode evoluir, mas alterações relevantes devem preservar separação de responsabilidades e simplicidade.

---

## 6. Domínio inicial

### Usuário

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

### Status da proposta

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

---

## 7. Regras iniciais do domínio

Estas regras são apenas uma simulação didática e podem evoluir.

- score alto e baixo comprometimento de renda aumentam a chance de aprovação;
- score baixo e comprometimento elevado aumentam a chance de reprovação;
- propostas de valor elevado podem exigir análise manual;
- propostas recentes podem permanecer pendentes;
- documentação incompleta gera `pending_documents`;
- inconsistências específicas podem gerar `fraud_suspected`;
- toda mudança de status deve gerar histórico;
- decisões manuais devem registrar o usuário responsável;
- nenhuma regra deve ser tratada como modelo financeiro real.

Não alterar regras do domínio silenciosamente. Mudanças devem ser explícitas no código, nos testes e neste contexto quando necessário.

---

## 8. População inicial da base

Usar `@faker-js/faker` com locale `pt_BR`.

Carga inicial sugerida:

- 1 administrador;
- 5 analistas;
- 500 clientes;
- 1.000 propostas;
- histórico distribuído pelos últimos 12 meses.

Os dados devem ser coerentes entre si. Evitar valores totalmente aleatórios sem relação entre score, renda, valor solicitado, risco e status.

Também criar cenários determinísticos para testes e demonstração:

- proposta aprovada;
- proposta reprovada por score baixo;
- proposta em análise manual;
- proposta com suspeita de fraude;
- proposta aguardando documentos.

---

## 9. Arquitetura do back-end

Preferir organização por domínio e responsabilidade.

Estrutura sugerida por módulo:

```txt
src/modules/proposals/
├── controllers/
├── services/
├── repositories/
├── schemas/
├── mappers/
├── types.ts
├── routes.ts
└── tests/
```

Princípios:

- controller recebe e responde HTTP;
- service aplica regras de negócio;
- repository acessa persistência;
- schema valida entrada e saída;
- mapper converte estruturas quando necessário;
- regras não devem ficar espalhadas em rotas ou controllers;
- dependências externas devem ser isoladas;
- evitar abstrações prematuras.

---

## 10. Arquitetura do front-end

Preferir componentes pequenos e responsabilidades claras.

Estrutura sugerida:

```txt
src/components/ProposalCard/
├── index.tsx
├── types.ts
├── styles.ts
└── tests.tsx
```

Princípios:

- separar apresentação, estado e integração quando fizer sentido;
- reutilizar contratos compartilhados;
- chamadas HTTP devem ficar fora dos componentes visuais;
- formulários devem usar React Hook Form e Zod;
- dados remotos devem usar TanStack Query;
- evitar componentes grandes e altamente acoplados;
- priorizar legibilidade sobre abstrações complexas.

---

## 11. Testes

### Convenções gerais

- usar `test` em vez de `it`;
- descrições devem começar com `should`;
- usar `screen` nas consultas do React Testing Library;
- usar Faker quando a aleatoriedade não comprometer previsibilidade;
- criar helpers de renderização reutilizáveis;
- testar comportamento, não detalhes internos;
- evitar snapshots extensos.

Exemplo:

```tsx
const componentRender = (props: ProposalCardProps) =>
  render(withThemeProvider(<ProposalCard {...props} />));

test('should display proposal status', () => {
  componentRender(props);

  expect(screen.getByText('Aprovada')).toBeInTheDocument();
});
```

### Back-end

Testar:

- validações;
- regras do domínio;
- transições de status;
- erros esperados;
- autorização;
- contratos principais.

---

## 12. Qualidade e estilo de código

- TypeScript estrito;
- nomes claros e descritivos;
- funções pequenas;
- responsabilidades únicas;
- composição sobre herança;
- evitar `any`;
- evitar comentários que apenas repetem o código;
- evitar duplicação real, sem criar abstrações prematuras;
- aplicar SOLID com pragmatismo;
- priorizar código fácil de entender e manter;
- não adicionar dependências sem necessidade justificável.

---

## 13. Segurança e privacidade

- todos os dados são fictícios;
- não usar CPFs, e-mails, telefones ou documentos reais;
- não versionar segredos;
- usar variáveis de ambiente;
- não registrar senhas ou tokens em logs;
- validar todas as entradas;
- armazenar senhas com hash;
- limitar permissões por perfil;
- manter trilha de auditoria das decisões.

---

## 14. Entrega incremental

### Fase 1 — Fundação

- configurar pnpm workspace;
- configurar Turborepo;
- criar `apps/web`;
- criar `apps/api`;
- criar `packages/contracts`;
- configurar lint, format e TypeScript.

### Fase 2 — API e banco

- conectar MongoDB;
- criar autenticação;
- criar módulos de clientes e propostas;
- criar seed inicial;
- documentar endpoints com Swagger.

### Fase 3 — Front-end

- criar login;
- criar listagem de propostas;
- criar detalhes;
- criar formulário;
- criar filtros;
- integrar com a API.

### Fase 4 — Dashboard

- criar indicadores operacionais;
- adicionar gráficos;
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

---

## 15. Regras para agentes

Antes de implementar:

1. leia este arquivo;
2. verifique a estrutura existente;
3. preserve decisões já adotadas;
4. não invente novas tecnologias sem necessidade;
5. não altere contratos silenciosamente;
6. implemente apenas o escopo solicitado;
7. mantenha mudanças pequenas e revisáveis;
8. atualize este contexto apenas quando houver mudança arquitetural, funcional ou metodológica relevante.

Ao concluir uma tarefa:

- execute lint;
- execute testes relacionados;
- execute typecheck;
- informe arquivos alterados;
- informe decisões tomadas;
- informe pendências reais;
- não declare sucesso se comandos não foram executados.

---

## 16. Convenção de commits

Usar Conventional Commits:

```txt
feat: add proposal creation
fix: validate income commitment
refactor: isolate proposal repository
test: cover manual review rule
docs: update shared project context
chore: configure turborepo
```

Commits devem ser objetivos e representar uma unidade lógica de mudança.
