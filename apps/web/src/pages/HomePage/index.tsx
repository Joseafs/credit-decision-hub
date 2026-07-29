import type { FormikErrors } from "formik";
import { useFormik } from "formik";
import { useCallback, useEffect, useState } from "react";

import { getHealth } from "../../api/health";
import type { HealthCheckValues, HealthRequestState } from "./types";
import { healthCheckSchema } from "./validation";

const validateHealthCheck = (
  values: HealthCheckValues,
): FormikErrors<HealthCheckValues> => {
  const result = healthCheckSchema.safeParse(values);

  if (result.success) {
    return {};
  }

  return {
    endpoint: result.error.issues[0]?.message ?? "Endpoint inválido",
  };
};

export const HomePage = () => {
  const [healthState, setHealthState] = useState<HealthRequestState>({
    status: "loading",
  });

  const checkHealth = useCallback(async (endpoint: string) => {
    setHealthState({ status: "loading" });

    try {
      const data = await getHealth(endpoint);
      setHealthState({ status: "success", data });
    } catch {
      setHealthState({ status: "error" });
    }
  }, []);

  const formik = useFormik<HealthCheckValues>({
    initialValues: {
      endpoint: "/health",
    },
    validate: validateHealthCheck,
    onSubmit: async ({ endpoint }) => {
      await checkHealth(endpoint);
    },
  });

  useEffect(() => {
    void checkHealth(formik.values.endpoint);
  }, [checkHealth, formik.values.endpoint]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-12 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.14),_transparent_32%),radial-gradient(circle_at_80%_70%,_rgba(99,102,241,0.18),_transparent_28%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
        <section className="grid w-full gap-12 lg:grid-cols-[1.35fr_0.65fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-medium text-cyan-200">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Fundação técnica ativa
            </span>

            <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Credit Decision Hub
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Uma plataforma full-stack para acompanhar e analisar propostas de
              crédito com contratos consistentes entre interface e API.
            </p>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/30 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Integração com a API
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">
                  Estado do serviço
                </h2>
              </div>

              <span
                aria-hidden="true"
                className={`mt-1 h-3 w-3 rounded-full ${
                  healthState.status === "success"
                    ? "bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.8)]"
                    : healthState.status === "error"
                      ? "bg-rose-400"
                      : "animate-pulse bg-amber-300"
                }`}
              />
            </div>

            <div className="mt-6 min-h-20" aria-live="polite">
              {healthState.status === "loading" && (
                <p className="text-amber-200">Consultando a API...</p>
              )}

              {healthState.status === "success" && (
                <div>
                  <p className="font-medium text-emerald-300">
                    Front-end e API conectados
                  </p>
                  <p className="mt-2 font-mono text-sm text-slate-400">
                    {healthState.data.service} · {healthState.data.status}
                  </p>
                </div>
              )}

              {healthState.status === "error" && (
                <div>
                  <p className="font-medium text-rose-300">
                    Não foi possível acessar a API
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Confirme se o back-end está em execução e tente novamente.
                  </p>
                </div>
              )}
            </div>

            <form className="mt-6" onSubmit={formik.handleSubmit}>
              <label
                className="text-xs font-semibold uppercase tracking-widest text-slate-500"
                htmlFor="endpoint"
              >
                Endpoint
              </label>
              <input
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 font-mono text-sm text-slate-300 outline-none"
                id="endpoint"
                name="endpoint"
                onBlur={formik.handleBlur}
                onChange={formik.handleChange}
                readOnly
                value={formik.values.endpoint}
              />
              {formik.touched.endpoint && formik.errors.endpoint && (
                <p className="mt-2 text-sm text-rose-300">
                  {formik.errors.endpoint}
                </p>
              )}

              <button
                className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
                disabled={healthState.status === "loading"}
                type="submit"
              >
                {healthState.status === "loading"
                  ? "Verificando..."
                  : "Verificar novamente"}
              </button>
            </form>
          </aside>
        </section>
      </div>
    </main>
  );
};
