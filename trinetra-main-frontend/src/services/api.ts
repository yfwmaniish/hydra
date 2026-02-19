/**
 * Trinetra API Client — handles all HTTP communication with the backend.
 * Manages authentication tokens, request interceptors, and error handling.
 */

const API_BASE_URL =
    (import.meta as unknown as { env: Record<string, string> }).env?.VITE_API_URL ||
    'http://localhost:8000/api';

/**
 * Get the stored auth token from localStorage.
 */
function getAuthToken(): string | null {
    return localStorage.getItem('trinetra_token');
}

/**
 * Core fetch wrapper with authentication and error handling.
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
            errorData.detail || `API Error: ${response.status} ${response.statusText}`
        );
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as unknown as T;
    }

    return response.json();
}

/**
 * API client methods organized by resource.
 */
export const api = {
    // ═══ Authentication ═══
    auth: {
        login: (email: string, password: string) =>
            apiFetch<{ token: string; email: string; uid: string }>('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            }),
        me: () => apiFetch<{ uid: string; email: string; display_name: string | null }>('/auth/me'),
    },

    // ═══ Threats ═══
    threats: {
        list: (severity?: string, status?: string) => {
            const params = new URLSearchParams();
            if (severity && severity !== 'All') params.set('severity', severity);
            if (status) params.set('status', status);
            const qs = params.toString();
            return apiFetch<any[]>(`/threats${qs ? `?${qs}` : ''}`);
        },
        get: (id: string) => apiFetch<any>(`/threats/${id}`),
        search: (query: string) => apiFetch<any[]>(`/threats/search?q=${encodeURIComponent(query)}`),
        timeline: () => apiFetch<any[]>('/threats/timeline'),
        escalate: (id: string) =>
            apiFetch<{ message: string; status: string }>(`/threats/${id}/escalate`, { method: 'POST' }),
        analyze: (id: string) =>
            apiFetch<{ analysis: string; model: string }>(`/threats/${id}/analyze`, { method: 'POST' }),
    },

    // ═══ Entities & Links ═══
    entities: {
        list: () => apiFetch<any[]>('/entities'),
        links: () => apiFetch<any[]>('/entities/links'),
    },

    // ═══ Sectors ═══
    sectors: {
        list: () => apiFetch<any[]>('/sectors'),
    },

    // ═══ Sources ═══
    sources: {
        list: () => apiFetch<any[]>('/sources'),
        create: (data: { name: string; type: string; url?: string }) =>
            apiFetch<any>('/sources', { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string | number, data: Partial<{ name: string; active: boolean; type: string; url: string }>) =>
            apiFetch<any>(`/sources/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string | number) =>
            apiFetch<void>(`/sources/${id}`, { method: 'DELETE' }),
    },

    // ═══ Keywords ═══
    keywords: {
        list: () => apiFetch<any[]>('/keywords'),
        create: (term: string) =>
            apiFetch<any>('/keywords', { method: 'POST', body: JSON.stringify({ term }) }),
        update: (id: string | number, data: Partial<{ term: string; active: boolean }>) =>
            apiFetch<any>(`/keywords/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
        delete: (id: string | number) =>
            apiFetch<void>(`/keywords/${id}`, { method: 'DELETE' }),
    },

    // ═══ Stats ═══
    stats: {
        dashboard: () => apiFetch<{
            active_threats: number;
            critical_incidents: number;
            monitored_sources: number;
            system_status: string;
        }>('/stats'),
    },

    // ═══ Health ═══
    health: () => apiFetch<{ status: string; service: string; version: string }>('/health'),
};
