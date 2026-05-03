import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DemoRole = "admin" | "owner" | "customer";

export type AuthUser = {
  userId: string;
  email: string;
  name: string;
  role: DemoRole;
  token: string;
};

export const DEMO_ACCOUNTS: AuthUser[] = [
  { userId: "admin-001", email: "admin@goodeats.test", name: "Avery Admin", role: "admin", token: "token-admin-001" },
  { userId: "owner-001", email: "maria@copperkettle.test", name: "Maria Santos", role: "owner", token: "token-owner-001" },
  { userId: "owner-002", email: "kenji@noodleworks.test", name: "Kenji Tanaka", role: "owner", token: "token-owner-002" },
  { userId: "customer-001", email: "jordan@example.test", name: "Jordan Lee", role: "customer", token: "token-customer-001" },
  { userId: "customer-002", email: "priya@example.test", name: "Priya Shah", role: "customer", token: "token-customer-002" },
  { userId: "customer-003", email: "sam@example.test", name: "Sam Rivera", role: "customer", token: "token-customer-003" },
];

type AuthState = {
  activeUserId: string | null;
  accounts: AuthUser[];
  loginAs: (userId: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      activeUserId: null,
      accounts: DEMO_ACCOUNTS,
      loginAs: (userId) => set({ activeUserId: userId }),
      logout: () => set({ activeUserId: null }),
    }),
    {
      name: "goodeats-demo-user",
      partialize: (state) => ({ activeUserId: state.activeUserId }),
    }
  )
);
