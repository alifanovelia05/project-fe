import { API_BASE_URL, API_ENDPOINTS } from "@/lib/constants";

function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    let token = sessionStorage.getItem("auth_token");
    if (token) return token;

    token = localStorage.getItem("auth_token");
    if (token) return token;

    return null;
}

function buildAuthHeaders(): HeadersInit {
    const token = getAuthToken();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-access-token"] = token;
    }

    return headers;
}

export interface MonitoringItem {
    id: string;
    waktu: string;
    longitude: number;
    latitude: number;
    satelit?: number;
    speed?: number;
    heading?: number;
    alert?: number;
    mileage?: number;
    input?: string;
    lokasi?: string;
    additional?: {
        gsm?: {
            cid?: number;
            lac?: number;
            mcc?: number;
            mnc?: number;
            name?: string;
        };
        batt?: string;
        sock?: string;
        accel?: number;
        device?: string;
        output?: string;
        signal?: number;
    };
    received?: string;
    plate?: string;
    type?: string;
    owner?: number;
    [key: string]: any;
}

export interface MonitoringResponse {
    success: boolean;
    message?: string;
    data?: MonitoringItem[];
    error?: string;
}

export class MonitoringService {
    static async getMonitoring(): Promise<MonitoringResponse> {
        const urls = [API_ENDPOINTS.MONITORING, `${API_BASE_URL}/monitoring`];
        const headers = buildAuthHeaders();

        try {
            let lastError: string | undefined;

            for (const url of urls) {
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
                    lastError =
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal mengambil data monitoring.`;
                    continue;
                }

                let items: MonitoringItem[] = [];
                if (Array.isArray(responseData)) {
                    items = responseData;
                } else if (Array.isArray(responseData?.data)) {
                    items = responseData.data;
                } else if (Array.isArray(responseData?.result)) {
                    items = responseData.result;
                } else {
                    lastError = "Format response monitoring tidak sesuai";
                    continue;
                }

                return {
                    success: true,
                    data: items,
                    message: "Data monitoring berhasil diambil.",
                };
            }

            return {
                success: false,
                message: lastError || "Gagal mengambil data monitoring.",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data monitoring.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
