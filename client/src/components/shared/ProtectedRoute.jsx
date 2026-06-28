/**
 * Protected Route — Redirects unauthenticated users to login
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ roles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role?.name)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
