import { API_BASE_URL, API_ENDPOINTS } from "@/lib/constants";

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    let token = sessionStorage.getItem("auth_token");
    if (token) return token;

    token = localStorage.getItem("auth_token");
    if (token) return token;

    return null;
}

function buildAuthHeaders(includeContentType = true): HeadersInit {
    const token = getAuthToken();
    const headers: HeadersInit = {};

    if (includeContentType) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-access-token"] = token;
    }

    return headers;
}

export interface MenuItem {
    id: string;
    name: string;
    url: string;
}

export interface MenuMeta {
    status?: number;
    version?: string;
    copyright?: string;
}

export interface MenuResponse {
    success: boolean;
    data?: MenuItem[];
    meta?: MenuMeta;
    message?: string;
    error?: string;
}

export interface CreateMenuPayload {
    id: string;
    name: string;
    url: string;
}

export interface UpdateMenuPayload {
    name?: string;
    url?: string;
}

export interface MenuMutationResponse {
    success: boolean;
    data?: MenuItem;
    message?: string;
    error?: string;
}

const parseJson = async (response: Response) => {
    const responseText = await response.text();
    if (!responseText) return null;
    try {
        return JSON.parse(responseText);
    } catch {
        return null;
    }
};

const extractMenuItem = (payload: any): MenuItem | undefined => {
    if (!payload) return undefined;
    if (payload?.data && !Array.isArray(payload.data)) return payload.data as MenuItem;
    if (payload?.result && !Array.isArray(payload.result)) return payload.result as MenuItem;
    if (Array.isArray(payload?.data) && payload.data.length > 0) return payload.data[0] as MenuItem;
    if (Array.isArray(payload?.result) && payload.result.length > 0) return payload.result[0] as MenuItem;
    if (Array.isArray(payload) && payload.length > 0) return payload[0] as MenuItem;
    return undefined;
};

const requestWithFallback = async (
    urls: string[],
    options: RequestInit,
    defaultError: string
): Promise<MenuMutationResponse> => {
    let lastMessage: string | undefined;
    let lastError: string | undefined;

    for (const url of urls) {
        const response = await fetch(url, options);
        const responseData = await parseJson(response);

        if (response.ok) {
            return {
                success: true,
                data: extractMenuItem(responseData),
                message: responseData?.message,
            };
        }

        lastMessage =
            responseData?.message ||
            responseData?.error?.message ||
            responseData?.error ||
            `HTTP ${response.status}: ${defaultError}`;
        lastError = responseData?.error || lastMessage;

        if (response.status !== 404) {
            break;
        }
    }

    return {
        success: false,
        message: lastMessage || defaultError,
        error: lastError,
    };
};

export class MenuService {
    static async getMenu(kategori = "menu", limit = 1): Promise<MenuResponse> {
        const url = API_ENDPOINTS.KLASIFIKASI(kategori, limit);
        const headers = buildAuthHeaders(true);

        try {
            const response = await fetch(url, {
                method: "GET",
                headers,
            });

            const responseData = await parseJson(response);

            if (!response.ok) {
                return {
                    success: false,
                    message:
                        responseData?.message ||
                        responseData?.error ||
                        `HTTP ${response.status}: Gagal mengambil data menu.`,
                };
            }

            const items = Array.isArray(responseData)
                ? responseData
                : Array.isArray(responseData?.data)
                    ? responseData.data
                    : [];

            return {
                success: true,
                data: items,
                meta: responseData?.meta,
                message: "Data menu berhasil diambil.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data menu.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    static async createMenu(payload: CreateMenuPayload): Promise<MenuMutationResponse> {
        try {
            const url = `${API_BASE_URL}/klasifikasi`;
            const headers = buildAuthHeaders(true);

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            const responseData = await parseJson(response);

            if (!response.ok) {
                return {
                    success: false,
                    message:
                        responseData?.message ||
                        responseData?.error ||
                        `HTTP ${response.status}: Gagal menambah data menu.`,
                };
            }

            return {
                success: true,
                data: extractMenuItem(responseData),
                message: responseData?.message || "Menu berhasil ditambahkan.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat menambah data menu.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    static async updateMenu(id: string, payload: UpdateMenuPayload): Promise<MenuMutationResponse> {
        const headers = buildAuthHeaders(true);
        const urls = [
            `${API_BASE_URL}/klasifikasi/${encodeURIComponent(id)}`,
            `${API_BASE_URL}/klasifikasi?id=${encodeURIComponent(id)}`,
        ];

        return requestWithFallback(urls, {
            method: "PUT",
            headers,
            body: JSON.stringify(payload),
        }, "Gagal memperbarui data menu.");
    }

    static async deleteMenu(id: string): Promise<MenuMutationResponse> {
        const headers = buildAuthHeaders(true);
        const urls = [
            `${API_BASE_URL}/klasifikasi/${encodeURIComponent(id)}`,
            `${API_BASE_URL}/klasifikasi?id=${encodeURIComponent(id)}`,
        ];

        return requestWithFallback(urls, {
            method: "DELETE",
            headers,
        }, "Gagal menghapus data menu.");
    }
}
