export const API_BASE_URL = "https://promptops-vocq.onrender.com";

export function apiFetch(path: string, options?: RequestInit) {
  return fetch(`${API_BASE_URL}${path}`, options)
}
