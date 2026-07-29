import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate replace to="/" />;
};
