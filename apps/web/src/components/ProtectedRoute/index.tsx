import { FeedbackState } from "@credit-decision-hub/ui";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useAppPreferences } from "../../contexts/AppPreferencesContext";

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { status } = useAuth();
  const { translate } = useAppPreferences();
  const location = useLocation();

  if (status === "loading") {
    return (
      <main className="mx-auto max-w-xl p-8">
        <FeedbackState title={translate("auth.sessionLoading")} />
      </main>
    );
  }
  if (status === "anonymous") {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }
  return children;
};
