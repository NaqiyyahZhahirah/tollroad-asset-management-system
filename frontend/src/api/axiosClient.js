import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL
});

axiosClient.interceptors.request.use((config) => {
    const state = useAuthStore.getState();
    const token = state.token;

    if (token && state.isSessionValid()) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
        state.logout();
    }

    return config;
});

axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;

        if (status === 401 || status === 403) {
            useAuthStore.getState().logout();
            if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;