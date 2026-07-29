import type { User } from "@credit-decision-hub/contracts";
import { Button, FeedbackState } from "@credit-decision-hub/ui";
import { useFormik } from "formik";
import { useEffect, useState } from "react";

import { createAnalyst, listUsers } from "../../api/users";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";

export const UsersPage = () => {
  const { translate } = useAppPreferences();
  const [users, setUsers] = useState<User[] | null>(null);
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch(() => setHasError(true));
  }, []);
  const formik = useFormik({
    initialValues: { name: "", email: "", password: "" },
    onSubmit: async (values, helpers) => {
      setHasError(false);
      try {
        const user = await createAnalyst({ ...values, role: "analyst" });
        setUsers((current) => [...(current ?? []), user]);
        helpers.resetForm();
      } catch {
        setHasError(true);
      }
    },
  });

  return (
    <section>
      <h1 className="text-3xl font-bold text-heading">
        {translate("users.title")}
      </h1>
      <p className="mt-2 text-muted">{translate("users.description")}</p>
      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <form
          className="space-y-4 rounded-2xl border border-border bg-surface p-6"
          onSubmit={formik.handleSubmit}
        >
          <h2 className="text-xl font-semibold text-heading">
            {translate("users.create")}
          </h2>
          {(["name", "email", "password"] as const).map((field) => (
            <label
              className="block text-sm font-medium text-heading"
              key={field}
            >
              {translate(`users.${field}`)}
              <input
                className="mt-2 w-full rounded-xl border border-border bg-canvas px-4 py-3"
                minLength={field === "password" ? 12 : undefined}
                name={field}
                onChange={formik.handleChange}
                required
                type={
                  field === "password"
                    ? "password"
                    : field === "email"
                      ? "email"
                      : "text"
                }
                value={formik.values[field]}
              />
            </label>
          ))}
          {hasError && (
            <p className="text-sm text-danger">{translate("users.error")}</p>
          )}
          <Button disabled={formik.isSubmitting} type="submit">
            {translate("users.submit")}
          </Button>
        </form>
        <div>
          {users === null && !hasError && (
            <FeedbackState title={translate("users.loading")} />
          )}
          {users && (
            <ul className="space-y-3">
              {users.map((user) => (
                <li
                  className="rounded-2xl border border-border bg-surface p-5"
                  key={user.id}
                >
                  <p className="font-semibold text-heading">{user.name}</p>
                  <p className="text-sm text-muted">{user.email}</p>
                  <p className="mt-2 text-xs font-semibold uppercase text-primary">
                    {translate(
                      user.role === "admin"
                        ? "auth.role.admin"
                        : "auth.role.analyst",
                    )}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
