import { DEMO_ACCOUNTS, useAuthStore, type AuthUser, type DemoRole } from "./authStore";

export type { AuthUser, DemoRole };
export { DEMO_ACCOUNTS };

export const useAuth = () => {
  const activeUserId = useAuthStore((state) => state.activeUserId);
  const accounts = useAuthStore((state) => state.accounts);
  const loginAs = useAuthStore((state) => state.loginAs);
  const logout = useAuthStore((state) => state.logout);
  const user = accounts.find((account) => account.userId === activeUserId) ?? null;

  return {
    user,
    accounts,
    isAuthenticated: Boolean(user),
    isLoading: false,
    getAccessToken: () => user?.token ?? "",
    loginAs,
    logout,
  };
};
