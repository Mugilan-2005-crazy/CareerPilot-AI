import apiClient from './apiClient';

const AUTH_ROOT = '/api/v1/auth';

export async function login(email: string, password: string) {
  const resp = await apiClient.post(`${AUTH_ROOT}/login`, { email, password });
  if (resp && resp.token) {
    apiClient.setTokens(resp.token, resp.refreshToken);
  }
  return resp;
}

export async function register(name: string, email: string, password: string) {
  const resp = await apiClient.post(`${AUTH_ROOT}/register`, { name, email, password });
  if (resp && resp.token) apiClient.setTokens(resp.token, resp.refreshToken);
  return resp;
}

export async function logout() {
  const refreshToken = localStorage.getItem('cp_refresh_token');
  if (refreshToken) {
    try {
      await apiClient.post(`${AUTH_ROOT}/logout`, { refreshToken });
    } finally {
      apiClient.clearTokens();
    }
  } else {
    apiClient.clearTokens();
  }
}

export async function forgotPassword(email: string) {
  return apiClient.post(`${AUTH_ROOT}/forgot-password`, { email });
}

export function getCurrentTokens() {
  return {
    token: localStorage.getItem('cp_access_token'),
    refreshToken: localStorage.getItem('cp_refresh_token'),
  };
}
