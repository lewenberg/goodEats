import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  isMenuOpen: boolean;
  setMenuOpen: (isMenuOpen: boolean) => void;
  toggleMenu: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      isMenuOpen: true,
      setMenuOpen: (isMenuOpen) => set({ isMenuOpen }),
      toggleMenu: () => set((state) => ({ isMenuOpen: !state.isMenuOpen })),
    }),
    {
      name: "goodeats-ui",
      partialize: (state) => ({ isMenuOpen: state.isMenuOpen }),
    }
  )
);
