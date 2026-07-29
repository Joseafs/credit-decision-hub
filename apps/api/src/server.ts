import { buildApp } from "./app.js";

const startServer = async (): Promise<void> => {
  const app = buildApp({ logger: true });
  const port = Number(process.env.PORT ?? 3333);

  try {
    await app.listen({ host: "0.0.0.0", port });
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
};

void startServer();
