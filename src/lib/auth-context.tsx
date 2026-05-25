import type { ReactNode } from "react";

// Auth is disabled. These stubs keep the existing API surface so the rest
// of the app compiles and renders as an anonymous/guest experience.
export type AuthUser = { id: string; email?: string } | null;

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function useAuth() {
  return {
    user: null as AuthUser,
    session: null,
    loading: false,
    signOut: async () => {},
  };
}

export function getInitials(_user: AuthUser): string {
  return "?";
}