import {
  apiErrorResponseSchema,
  createProposalSchema,
  listProposalsQuerySchema,
  manualProposalDecisionSchema,
  proposalIdParamsSchema,
  proposalListResponseSchema,
  proposalSchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsyncZod } from "fastify-type-provider-zod";

import {
  proposalExample,
  proposalInputExample,
  proposalListExample,
  proposalNotFoundExample,
} from "../../shared/openapi/examples.js";
import {
  documentedCustomerNotFoundSchema,
  documentedValidationErrorSchema,
} from "../../shared/openapi/http-error.schemas.js";
import {
  InvalidProposalTransitionError,
  ProposalCustomerNotFoundError,
  ProposalNotFoundError,
} from "./proposal.errors.js";
import type { ProposalService } from "./proposal.service.js";

type ProposalRoutesOptions = {
  proposalService: ProposalService;
  protectedRoutes?: boolean;
};

const documentedCreateProposalSchema = createProposalSchema.meta({
  description: "Dados usados pela avaliação automática",
  examples: [proposalInputExample],
});
const documentedProposalSchema = proposalSchema.meta({
  description: "Proposta avaliada e seu histórico",
  examples: [proposalExample],
});
const documentedProposalListSchema = proposalListResponseSchema.meta({
  description: "Página de propostas",
  examples: [proposalListExample],
});
const documentedProposalNotFoundSchema = apiErrorResponseSchema.meta({
  description: "Proposta não encontrada",
  examples: [proposalNotFoundExample],
});

export const proposalRoutes: FastifyPluginAsyncZod<
  ProposalRoutesOptions
> = async (app, { proposalService, protectedRoutes = false }) => {
  app.post(
    "/proposals",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Propostas"],
        summary: "Criar e avaliar proposta",
        description:
          "Cria uma proposta e aplica imediatamente as regras automáticas de decisão.",
        operationId: "createProposal",
        body: documentedCreateProposalSchema,
        response: {
          201: documentedProposalSchema,
          400: documentedValidationErrorSchema,
          404: documentedCustomerNotFoundSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const proposal = await proposalService.create(request.body);

        return reply.status(201).send(proposal);
      } catch (error) {
        if (error instanceof ProposalCustomerNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.get(
    "/proposals",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Propostas"],
        summary: "Listar propostas",
        description:
          "Retorna propostas paginadas e permite filtrar por cliente, status, risco, período e valor.",
        operationId: "listProposals",
        querystring: listProposalsQuerySchema.meta({
          examples: [
            {
              page: 1,
              limit: 20,
              status: "approved",
              riskLevel: "low",
            },
          ],
        }),
        response: {
          200: documentedProposalListSchema,
          400: documentedValidationErrorSchema,
        },
      },
    },
    async (request, reply) =>
      reply.status(200).send(await proposalService.list(request.query)),
  );

  app.get(
    "/proposals/:id",
    {
      ...(protectedRoutes ? { onRequest: app.authenticate } : {}),
      schema: {
        tags: ["Propostas"],
        summary: "Consultar proposta",
        description: "Retorna uma proposta e sua trilha de decisão.",
        operationId: "getProposalById",
        params: proposalIdParamsSchema.meta({
          examples: [{ id: proposalExample.id }],
        }),
        response: {
          200: documentedProposalSchema,
          400: documentedValidationErrorSchema,
          404: documentedProposalNotFoundSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const proposal = await proposalService.getById(request.params.id);

        return reply.status(200).send(proposal);
      } catch (error) {
        if (error instanceof ProposalNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }

        throw error;
      }
    },
  );

  app.patch(
    "/proposals/:id/decision",
    {
      ...(protectedRoutes
        ? { onRequest: app.authorize(["admin", "analyst"]) }
        : {}),
      schema: {
        tags: ["Propostas"],
        summary: "Registrar decisão manual",
        operationId: "decideProposal",
        params: proposalIdParamsSchema,
        body: manualProposalDecisionSchema,
        response: {
          200: documentedProposalSchema,
          400: documentedValidationErrorSchema,
          404: documentedProposalNotFoundSchema,
          409: apiErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        return reply
          .status(200)
          .send(
            await proposalService.decide(
              request.params.id,
              request.body,
              request.currentUser.id,
            ),
          );
      } catch (error) {
        if (error instanceof ProposalNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof InvalidProposalTransitionError) {
          return reply.status(409).send({ message: error.message });
        }
        throw error;
      }
    },
  );
};
