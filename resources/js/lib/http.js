import axios from 'axios';
import { getHotelSlug } from './hotel';

/**
 * Sdílený HTTP klient pro Laravel (session + CSRF).
 * Všechny mutace (POST/PUT/DELETE) musí jít přes tento modul, ne přímo z 'axios'.
 */
const http = axios.create({
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json',
    },
});

function applyCsrfHeader(config) {
    const token = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (token) {
        config.headers.set('X-CSRF-TOKEN', token);
    }
    const slug = getHotelSlug();
    if (slug) {
        config.headers.set('X-Hotel-Slug', slug);
    }
    return config;
}

http.interceptors.request.use(applyCsrfHeader);

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 419 && original && !original._csrfRetry) {
            original._csrfRetry = true;
            try {
                const { data } = await axios.get('/api/csrf', { withCredentials: true });
                const fresh = data?.token;
                if (fresh) {
                    const meta = document.head.querySelector('meta[name="csrf-token"]');
                    if (meta) {
                        meta.setAttribute('content', fresh);
                    }
                    original.headers.set('X-CSRF-TOKEN', fresh);
                    return http.request(original);
                }
            } catch {
                // fall through
            }
        }
        return Promise.reject(error);
    },
);

export default http;
