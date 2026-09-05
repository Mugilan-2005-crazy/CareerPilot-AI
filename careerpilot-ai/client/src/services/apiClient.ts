import axios from 'axios';

// import.meta.env typing can vary; coerce to any for portability
const meta: any = (import.meta as any) || {};
const BASE_URL = (meta.env && meta.env.VITE_API_BASE_URL) || window.location.origin;

class APIClient {
  client: any;
  isRefreshing = false;
  refreshPromise: Promise<void> | null = null;

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL, timeout: 20000 });

    this.client.interceptors.request.use((config: any) => {
      const token = localStorage.getItem('cp_access_token');
      if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
      return config;
    });

    this.client.interceptors.response.use(
      (resp: any) => resp,
      async (error: any) => {
        const originalRequest = error.config as any;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshToken();
            return this.client(originalRequest);
          } catch (e) {
            this.clearTokens();
            return Promise.reject(e);
          }
        }
        return Promise.reject(error);
      },
    );
  }

  async refreshToken() {
    if (this.isRefreshing && this.refreshPromise) return this.refreshPromise;
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem('cp_refresh_token');
        if (!refreshToken) throw new Error('No refresh token');
        const resp = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const { token, refreshToken: newRefresh } = resp.data;
        if (token) localStorage.setItem('cp_access_token', token);
        if (newRefresh) localStorage.setItem('cp_refresh_token', newRefresh);
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();
    return this.refreshPromise;
  }

  setTokens(token: string, refreshToken: string) {
    localStorage.setItem('cp_access_token', token);
    localStorage.setItem('cp_refresh_token', refreshToken);
  }

  clearTokens() {
    localStorage.removeItem('cp_access_token');
    localStorage.removeItem('cp_refresh_token');
  }

  async get<T = any>(url: string, config?: any) {
    const r = await this.client.get(url, config);
    return r.data as T;
  }

  async post<T = any>(url: string, data?: any, config?: any) {
    const r = await this.client.post(url, data, config);
    return r.data as T;
  }

  async delete<T = any>(url: string, config?: any) {
    const r = await this.client.delete(url, config);
    return r.data as T;
  }
}

const apiClient = new APIClient();
export default apiClient;
