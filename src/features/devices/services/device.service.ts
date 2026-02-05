import { API_BASE_URL } from "@/lib/constants";

/**
 * Get auth token from sessionStorage/localStorage (client-side)
 */
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    let token = sessionStorage.getItem("auth_token");
    if (token) {
        return token;
    }

    token = localStorage.getItem("auth_token");
    if (token) {
        return token;
    }

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

export interface Device {
    id: string;
    owner?: string;
    gsm?: string;
    plate?: string;
    timezone?: string;
    registered?: string;
    [key: string]: any;
}

export interface DeviceResponse {
    success: boolean;
    message?: string;
    data?: Device[];
    error?: string;
}

export interface CreateDevicePayload {
    id: string;
    owner?: string;
    gsm?: string;
    plate?: string;
    timezone?: string;
    registered?: string;
}

export class DeviceService {
    static async getDevices(): Promise<DeviceResponse> {
        try {
            const url = `${API_BASE_URL}/device`;
            const headers = buildAuthHeaders(true);

            const response = await fetch(url, {
                method: "GET",
                headers,
            });

            const responseText = await response.text();
            let responseData: any = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch {
                responseData = null;
            }

            if (!response.ok) {
                return {
                    success: false,
                    message:
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal mengambil data device.`,
                };
            }

            let devices: Device[] = [];
            if (Array.isArray(responseData)) {
                devices = responseData;
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                devices = responseData.data;
            } else if (responseData?.result && Array.isArray(responseData.result)) {
                devices = responseData.result;
            } else {
                return {
                    success: false,
                    message: "Format response device tidak sesuai",
                };
            }

            return {
                success: true,
                data: devices,
                message: "Data device berhasil diambil.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data device.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    static async getDeviceById(id: string): Promise<DeviceResponse> {
        try {
            const url = `${API_BASE_URL}/device?id=${encodeURIComponent(id)}`;
            const headers = buildAuthHeaders(true);

            const response = await fetch(url, {
                method: "GET",
                headers,
            });

            const responseText = await response.text();
            let responseData: any = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch {
                responseData = null;
            }

            if (!response.ok) {
                return {
                    success: false,
                    message:
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal mengambil data device.`,
                };
            }

            let devices: Device[] = [];
            if (Array.isArray(responseData)) {
                devices = responseData;
            } else if (Array.isArray(responseData?.data)) {
                devices = responseData.data;
            } else if (responseData?.data) {
                devices = [responseData.data];
            } else if (Array.isArray(responseData?.result)) {
                devices = responseData.result;
            } else if (responseData?.result) {
                devices = [responseData.result];
            }

            return {
                success: true,
                data: devices,
                message: devices.length ? "Data device berhasil diambil." : "Data device kosong.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data device.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    static async createDevice(payload: CreateDevicePayload): Promise<DeviceResponse> {
        try {
            const url = `${API_BASE_URL}/device`;

            const cleanedPayload: any = {};
            Object.keys(payload).forEach((key) => {
                const value = (payload as any)[key];
                if (value !== "" && value !== undefined && value !== null) {
                    cleanedPayload[key] = value;
                }
            });

            const headers = buildAuthHeaders(true);

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(cleanedPayload),
            });

            const responseText = await response.text();
            let responseData: any = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch {
                responseData = null;
            }

            if (!response.ok) {
                return {
                    success: false,
                    message:
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal membuat data device.`,
                };
            }

            return {
                success: true,
                message: "Data device berhasil dibuat.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat membuat data device.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    static async updateDevice(id: string, payload: CreateDevicePayload): Promise<DeviceResponse> {
        try {
            const url = `${API_BASE_URL}/device/${encodeURIComponent(id)}`;

            const cleanedPayload: any = {};
            Object.keys(payload).forEach((key) => {
                const value = (payload as any)[key];
                if (value !== "" && value !== undefined && value !== null) {
                    cleanedPayload[key] = value;
                }
            });

            const headers = buildAuthHeaders(true);

            let response = await fetch(url, {
                method: "PATCH",
                headers,
                body: JSON.stringify(cleanedPayload),
            });

            if (response.status === 404 || response.status === 405) {
                response = await fetch(url, {
                    method: "PUT",
                    headers,
                    body: JSON.stringify(cleanedPayload),
                });
            }

            const responseText = await response.text();
            let responseData: any = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch {
                responseData = null;
            }

            if (!response.ok) {
                return {
                    success: false,
                    message:
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal memperbarui data device.`,
                };
            }

            return {
                success: true,
                message: "Data device berhasil diperbarui.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat memperbarui data device.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    static async deleteDevice(id: string): Promise<DeviceResponse> {
        try {
            const url = `${API_BASE_URL}/device/${encodeURIComponent(id)}`;
            const headers = buildAuthHeaders(false);

            const response = await fetch(url, {
                method: "DELETE",
                headers,
            });

            const responseText = await response.text();
            let responseData: any = null;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch {
                responseData = null;
            }

            if (!response.ok) {
                return {
                    success: false,
                    message:
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal menghapus data device.`,
                };
            }

            return {
                success: true,
                message: "Data device berhasil dihapus.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat menghapus data device.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
