import { create } from 'zustand';
import { persist } from 'zustand/middleware';

function parseExpiry(value) {
    if (!value) return null;

    const numericValue = Number(value);
    if (!Number.isNaN(numericValue)) {
        return numericValue > 1e12 ? numericValue : numericValue * 1000;
    }

    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? null : dateValue.getTime();
}

export const useAuthStore = create(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            expiresAt: null,
            login: (token, user, expiresAt = null) => set({ token, user, expiresAt: parseExpiry(expiresAt) }),
            logout: () => set({ token: null, user: null, expiresAt: null }),
            isSessionValid: () => {
                const { token, expiresAt } = get();
                if (!token) return false;
                if (!expiresAt) return true;
                return Date.now() < expiresAt;
            }
        }),
        { name: 'jmtm-ams-auth' }
    )
);