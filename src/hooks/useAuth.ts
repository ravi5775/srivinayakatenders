import { useAuthContext } from '@/contexts/AuthContext';

// This hook now consumes the global AuthContext, ensuring a single
// source of truth for auth state across the entire app.
export const useAuth = () => useAuthContext();
