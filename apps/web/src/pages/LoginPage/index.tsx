import { Button } from "@credit-decision-hub/ui";
import { useFormik } from "formik";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";

export const LoginPage = () => {
  const { signIn, status } = useAuth();
  const { locale, setLocale, theme, toggleTheme, translate } =
    useAppPreferences();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasError, setHasError] = useState(false);
  const formik = useFormik({
    initialValues: { email: "", password: "" },
    onSubmit: async (values) => {
      setHasError(false);
      try {
        await signIn(values.email, values.password);
        const target =
          typeof location.state === "object" &&
          location.state !== null &&
          "from" in location.state &&
          typeof location.state.from === "string"
            ? location.state.from
            : "/";
        navigate(target, { replace: true });
      } catch {
        setHasError(true);
      }
    },
  });

  if (status === "authenticated") return <Navigate replace to="/" />;

  return (
    <main className="grid min-h-screen place-items-center bg-canvas p-6">
      <section className="w-full max-w-md rounded-3xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 flex justify-end gap-2">
          <button
            className="rounded-lg border border-border px-3 py-2 text-sm"
            onClick={() => setLocale(locale === "pt-BR" ? "en" : "pt-BR")}
            type="button"
          >
            {locale === "pt-BR" ? "EN" : "PT"}
          </button>
          <button
            aria-label={
              theme === "dark"
                ? translate("preferences.light")
                : translate("preferences.dark")
            }
            className="rounded-lg border border-border px-3 py-2"
            onClick={toggleTheme}
            type="button"
          >
            <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
          </button>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Credit Decision Hub
        </p>
        <h1 className="mt-3 text-3xl font-bold text-heading">
          {translate("auth.login.title")}
        </h1>
        <p className="mt-2 text-muted">{translate("auth.login.description")}</p>
        <form className="mt-7 space-y-5" onSubmit={formik.handleSubmit}>
          <label className="block text-sm font-medium text-heading">
            {translate("auth.login.email")}
            <input
              className="mt-2 w-full rounded-xl border border-border bg-canvas px-4 py-3"
              name="email"
              onChange={formik.handleChange}
              required
              type="email"
              value={formik.values.email}
            />
          </label>
          <label className="block text-sm font-medium text-heading">
            {translate("auth.login.password")}
            <input
              className="mt-2 w-full rounded-xl border border-border bg-canvas px-4 py-3"
              name="password"
              onChange={formik.handleChange}
              required
              type="password"
              value={formik.values.password}
            />
          </label>
          {hasError && (
            <p className="text-sm font-medium text-danger" role="alert">
              {translate("auth.login.error")}
            </p>
          )}
          <Button disabled={formik.isSubmitting} type="submit">
            {formik.isSubmitting
              ? translate("auth.login.submitting")
              : translate("auth.login.submit")}
          </Button>
        </form>
      </section>
    </main>
  );
};
