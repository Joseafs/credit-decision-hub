# Project Tasks

## 1. Propósito

Este documento é o router operacional do **Credit Decision Hub**. Ele informa o que está ativo, o que vem depois e quais entregas foram confirmadas.

As decisões de produto pertencem ao [`README.md`](./README.md). As decisões técnicas pertencem ao [`SDD.md`](./SDD.md).

## 2. Regras operacionais

1. Deve existir no máximo uma tarefa `ACTIVE`.
2. A expressão “próximo” significa continuar a tarefa `ACTIVE`; se ela estiver concluída, promover a primeira tarefa `NEXT`.
3. Executar uma tarefa por commit.
4. Usar Conventional Commits em PT-BR, com corpo que explique as mudanças relevantes.
5. Não implementar itens `PLANNED` enquanto houver uma tarefa anterior ativa.
6. Não promover tarefa bloqueada sem registrar a decisão ou dependência que a desbloqueia.
7. Marcar como `DONE` somente com evidência confirmada por comandos, testes ou inspeção do comportamento.
8. Atualizar este router no mesmo commit que conclui ou reorganiza uma tarefa.
9. Não fazer push sem solicitação explícita.
10. Preservar o escopo das fases definido no `README.md`.

## 3. Estados

| Estado | Significado |
| --- | --- |
| `ACTIVE` | Única tarefa autorizada para implementação |
| `NEXT` | Próxima tarefa após a conclusão da ativa |
| `PLANNED` | Trabalho futuro, ainda fora do escopo |
| `BLOCKED` | Depende de decisão ou condição externa registrada |
| `DONE` | Concluída e acompanhada de evidência |

## 4. Router atual

| Ordem | ID | Fase | Estado | Entrega |
| --- | --- | --- | --- | --- |
| 1 | `CDH-011` | 3 | `ACTIVE` | Implementar filtros e estados de navegação |
| 2 | `CDH-012` | 4 | `NEXT` | Definir e implementar autenticação e permissões |
| 3 | `CDH-013` | 4 | `PLANNED` | Implementar dashboard e auditoria |
| 4 | `CDH-014` | 5 | `PLANNED` | Implementar etapa analítica com Databricks |
| 5 | `CDH-015` | 6 | `PLANNED` | Implementar infraestrutura, CI/CD e deploy |

Os itens de fases posteriores são marcos de planejamento. Devem ser detalhados somente quando se tornarem próximos, evitando especificação prematura.

## 5. Tarefa ativa

### `CDH-011` — Filtros e estados de navegação

Objetivo: permitir navegar pelos dados fictícios com filtros explícitos e previsíveis, reutilizando somente os parâmetros já suportados pela API.

Entregas:

- mapear os filtros de clientes e propostas já disponíveis nos contratos;
- refletir filtros e página na URL quando isso melhorar navegação e compartilhamento;
- preservar filtros ao paginar;
- diferenciar ausência total de dados de resultado vazio por filtro;
- oferecer ação clara para limpar filtros;
- manter consultas e serialização de parâmetros fora dos componentes visuais.

Critérios de aceite:

- parâmetros validados pelos contratos compartilhados;
- URL, controles e requisição permanecem coerentes;
- paginação retorna à primeira página quando um filtro altera a consulta;
- estados e controles funcionam nos dois idiomas e temas;
- comportamento coberto com React Testing Library;
- `lint`, `typecheck`, `test` e `build` aprovados.

Fora do escopo:

- criar filtros não suportados pela API;
- adicionar biblioteca de estado global;
- implementar dashboard, autenticação ou decisões manuais;
- alterar regras de domínio.

## 6. Próxima tarefa

### `CDH-012` — Autenticação e permissões

- detalhar identidade, papéis e transições autorizadas somente após a conclusão da Fase 3;
- definir o contrato de autenticação antes de escolher sua implementação;
- não antecipar dashboard, auditoria ou infraestrutura.

## 7. Entregas concluídas

| ID | Entrega | Commit | Evidência |
| --- | --- | --- | --- |
| `CDH-001` | Fundação do monorepo | `723929e` | `lint`, `typecheck`, `test`, `build` e execução conjunta pelo Turborepo |
| `CDH-002` | Conexão com MongoDB Atlas | `eeaae88` | configuração validada, testes automatizados e conexão real confirmada |
| `CDH-003` | Módulo de clientes | `25a797d` | contratos, service, repository, rotas, 28 testes e smoke test de listagem no Atlas |
| `CDH-004` | Regras objetivas de propostas | `docs: definir regras de decisão de propostas` | limites, precedência, fronteiras, histórico e evolução de juros aprovados |
| `CDH-005` | Contratos e persistência de propostas | `feat(api): criar contratos e persistência de propostas` | 43 testes, contratos estritos, histórico coerente, model validado e gates aprovados |
| `CDH-006` | Motor e endpoints de propostas | `feat(api): implementar fluxo automático de propostas (CDH-006)` | 75 testes, precedência completa, `Fastify.inject()`, gates e smoke test read-only no Atlas |
| `CDH-007` | Seed fictício | `feat(api): criar seed fictício e seguro (CDH-007)` | 88 testes, 500 clientes, 1.000 propostas, cinco cenários, reexecução idempotente e validação real no Atlas |
| `CDH-008` | Swagger / OpenAPI | `feat(api): documentar endpoints com OpenAPI (CDH-008)` | 94 testes, sete operações documentadas, Swagger UI validado no navegador e gates aprovados |
| `CDH-009` | Fluxo front-end de clientes | `feat(web): implementar fluxo de clientes (CDH-009)` | 108 testes, cadastro, listagem, detalhe, paginação, temas, dois idiomas, acesso direto e integração real validados |
| `CDH-010` | Fluxo front-end de propostas | `feat(web): implementar fluxo de propostas (CDH-010)` | 122 testes, criação, listagem, detalhe, histórico, paginação, dois idiomas, temas e integração read-only com o Atlas validados |

## 8. Handoff atual

- branch: `main`;
- última tarefa concluída: `CDH-010`;
- tarefa ativa: `CDH-011`;
- próxima implementação: filtros e estados de navegação;
- bloqueios: nenhum;
- push: não realizado nesta entrega.

Ao encerrar uma tarefa, registrar:

- commit;
- comandos executados;
- testes adicionados ou alterados;
- evidência relevante;
- decisão técnica;
- bloqueio restante, quando existir.
