import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";
import {
  hasZodFastifySchemaValidationErrors,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";

import { customerRepository } from "./modules/customers/customer.repository.js";
import { customerRoutes } from "./modules/customers/customer.routes.js";
import {
  createCustomerService,
  type CustomerService,
} from "./modules/customers/customer.service.js";
import { proposalRepository } from "./modules/proposals/proposal.repository.js";
import { proposalRoutes } from "./modules/proposals/proposal.routes.js";
import {
  createProposalService,
  type ProposalService,
} from "./modules/proposals/proposal.service.js";
import { authRoutes } from "./modules/users/auth.routes.js";
import { userRepository } from "./modules/users/user.repository.js";
import { userRoutes } from "./modules/users/user.routes.js";
import {
  createUserService,
  type UserService,
} from "./modules/users/user.service.js";
import { healthRoute } from "./routes/health/health.route.js";
import { registerAuthentication } from "./shared/auth/auth.plugin.js";
import { toValidationErrorResponse } from "./shared/http/validation-error.js";
import { registerOpenApi } from "./shared/openapi/openapi.js";

type BuildAppOptions = FastifyServerOptions & {
  customerService?: CustomerService;
  proposalService?: ProposalService;
  authentication?: {
    secret: string;
    secureCookie: boolean;
    userService?: UserService;
  };
};

export const buildApp = ({
  customerService = createCustomerService(customerRepository),
  proposalService = createProposalService({
    customerReader: customerRepository,
    repository: proposalRepository,
  }),
  authentication,
  ...fastifyOptions
}: BuildAppOptions = {}): FastifyInstance => {
  const app = Fastify(fastifyOptions);

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.setErrorHandler((error, _request, reply) => {
    if (hasZodFastifySchemaValidationErrors(error)) {
      return reply
        .status(400)
        .send(toValidationErrorResponse(error.validation));
    }

    return reply.send(error);
  });

  registerOpenApi(app);
  app.register(healthRoute);

  if (authentication) {
    const userService =
      authentication.userService ?? createUserService(userRepository);
    app.register(async (scope) => {
      await registerAuthentication(scope, {
        secret: authentication.secret,
        userService,
      });
      scope.register(authRoutes, {
        secureCookie: authentication.secureCookie,
        userService,
      });
      scope.register(userRoutes, { userService });
      scope.register(customerRoutes, {
        customerService,
        protectedRoutes: true,
      });
      scope.register(proposalRoutes, {
        proposalService,
        protectedRoutes: true,
      });
    });
  } else {
    app.register(customerRoutes, { customerService });
    app.register(proposalRoutes, { proposalService });
  }

  return app;
};
