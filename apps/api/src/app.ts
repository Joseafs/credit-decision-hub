import Fastify, {
  type FastifyInstance,
  type FastifyServerOptions,
} from "fastify";

import { healthRoute } from "./routes/health/health.route.js";

export const buildApp = (
  options: FastifyServerOptions = {},
): FastifyInstance => {
  const app = Fastify(options);

  app.register(healthRoute);

  return app;
};
