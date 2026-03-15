const TOKEN_KEY = "app_jwt";

export async function apiFetch(url, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.dispatchEvent(new Event("auth:logout"));
    }

    return response;
}