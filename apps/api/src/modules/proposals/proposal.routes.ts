import {
  createProposalSchema,
  listProposalsQuerySchema,
  proposalIdParamsSchema,
} from "@credit-decision-hub/contracts";
import type { FastifyPluginAsync } from "fastify";

import { toValidationErrorResponse } from "../../shared/http/validation-error.js";
import {
  ProposalCustomerNotFoundError,
  ProposalNotFoundError,
} from "./proposal.errors.js";
import type { ProposalService } from "./proposal.service.js";

type ProposalRoutesOptions = {
  proposalService: ProposalService;
};

export const proposalRoutes: FastifyPluginAsync<ProposalRoutesOptions> = async (
  app,
  { proposalService },
) => {
  app.post("/proposals", async (request, reply) => {
    const input = createProposalSchema.safeParse(request.body);

    if (!input.success) {
      return reply.status(400).send(toValidationErrorResponse(input.error));
    }

    try {
      const proposal = await proposalService.create(input.data);

      return reply.status(201).send(proposal);
    } catch (error) {
      if (error instanceof ProposalCustomerNotFoundError) {
        return reply.status(404).send({ message: error.message });
      }

      throw error;
    }
  });

  app.get("/proposals", async (request, reply) => {
    const query = listProposalsQuerySchema.safeParse(request.query);

    if (!query.success) {
      return reply.status(400).send(toValidationErrorResponse(query.error));
    }

    return reply.status(200).send(await proposalService.list(query.data));
  });

  app.get("/proposals/:id", async (request, reply) => {
    const params = proposalIdParamsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send(toValidationErrorResponse(params.error));
    }

    try {
      const proposal = await proposalService.getById(params.data.id);

      return reply.status(200).send(proposal);
    } catch (error) {
      if (error instanceof ProposalNotFoundError) {
        return reply.status(404).send({ message: error.message });
      }

      throw error;
    }
  });
};
