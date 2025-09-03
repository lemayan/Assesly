import axios from 'axios';

const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000/api';

export const http = axios.create({ baseURL, timeout: 8000 });

// Inject Authorization header from localStorage token on each request
http.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers = config.headers || {};
		(config.headers as any)['Authorization'] = `Bearer ${token}`;
	}
	return config;
});

// Optional: if unauthorized, clear and redirect to login
http.interceptors.response.use(
	(res) => res,
	(err) => {
		if (err?.response?.status === 401) {
			localStorage.removeItem('token');
			localStorage.removeItem('user');
			// Avoid infinite loops if already on login
			if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
				window.location.href = '/login';
			}
		}
		return Promise.reject(err);
	}
);

export default http;
