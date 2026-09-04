import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getCurrentTokens } from '../services/authService';

/**
 * Client-side route guard. Redirecting is only a UX convenience: the SERVER
 * remains the authority — every protected call validates the JWT and refreshes
 * or rejects. This guard simply prevents rendering protected UI when no token
 * exists locally.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { token } = getCurrentTokens();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}