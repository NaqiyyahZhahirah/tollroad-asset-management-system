import { create } from 'zustand';

const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

export const useUiStore = create((set) => ({
    isSidebarOpen: isDesktop,
    toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
    closeSidebar: () => set({ isSidebarOpen: false })
}));