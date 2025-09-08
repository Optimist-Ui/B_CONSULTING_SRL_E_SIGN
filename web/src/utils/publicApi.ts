// src/utils/publicApi.ts
import axios from 'axios';
import type { AxiosInstance } from 'axios';

const publicApi: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default publicApi;