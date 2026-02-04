import { API_BASE_URL } from "@/lib/constants";

/**
 * Get auth token from sessionStorage/localStorage (client-side)
 */
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null; // Server-side

    // Try sessionStorage first
    let token = sessionStorage.getItem("auth_token");
    if (token) {
        console.log("Token found in sessionStorage");
        return token;
    }

    // Try localStorage as fallback
    token = localStorage.getItem("auth_token");
    if (token) {
        console.log("Token found in localStorage");
        return token;
    }

    console.warn("No auth token found in sessionStorage or localStorage");
    return null;
}

export interface Vehicle {
    id: number;
    plate: string;
    owner: number;
    status: number;
    groups: number;
    brand: string;
    model: string;
    type: string;
    vehicle_type: number;
    year: number;
    color: string;
    stnk: string;
    valid: string;
    fueltype: string;
    fueltank: number;
    engine: number;
    tire: number;
    capacity: number;
    gsmvalid: string | null;
    speed_limit: number;
    kirvalid: string | null;
    last_service: string;
    last_mileage: number;
    registered: string;
    gpsid: string;
    [key: string]: any;
}

export interface VehicleResponse {
    success: boolean;
    message?: string;
    data?: Vehicle[];
    error?: string;
}

export interface CreateVehiclePayload {
    plate: string;
    brand: string;
    model: string;
    type: string;
    year: number;
    color: string;
    stnk: string;
    fueltype: string;
    gpsid?: string;
    status?: number;
    owner?: number;
    groups?: number;
    vehicle_type?: number;
    fueltank?: number;
    engine?: number;
    tire?: number;
    capacity?: number;
    speed_limit?: number;
}

/**
 * Vehicle Service - handles all vehicle related API calls
 */
export class VehicleService {
    /**
     * Get all vehicles
     */
    static async getVehicles(): Promise<VehicleResponse> {
        try {
            const url = `${API_BASE_URL}/fleet/vehicle`;
            const token = getAuthToken();

            console.log("Fetching vehicles from:", url);
            console.log("Auth token available:", !!token);

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };

            // Add Authorization header if token exists
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
                console.log("Added Authorization header with token");
            } else {
                console.warn("No auth token found in cookies");
            }

            const response = await fetch(url, {
                method: "GET",
                headers,
            });

            console.log("Response status:", response.status, response.statusText);

            const responseText = await response.text();
            console.log("Response text:", responseText);

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch {
                console.error("Failed to parse response as JSON");
                responseData = null;
            }

            console.log("Response data:", responseData);

            if (!response.ok) {
                console.error("API error response:", responseData);
                return {
                    success: false,
                    message:
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal mengambil data kendaraan.`,
                };
            }

            // Handle berbagai format response
            let vehicles = [];
            if (Array.isArray(responseData)) {
                vehicles = responseData;
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                vehicles = responseData.data;
            } else if (responseData?.result && Array.isArray(responseData.result)) {
                vehicles = responseData.result;
            } else {
                console.warn("Unexpected response format:", responseData);
                return {
                    success: false,
                    message: "Format response API tidak sesuai",
                };
            }

            console.log("Vehicles extracted:", vehicles);

            return {
                success: true,
                data: vehicles,
                message: "Data kendaraan berhasil diambil.",
            };
        } catch (error) {
            console.error("Get vehicles error:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data kendaraan.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Create new vehicle
     */
    static async createVehicle(payload: CreateVehiclePayload): Promise<VehicleResponse> {
        try {
            const url = `${API_BASE_URL}/fleet/vehicle`;
            const token = getAuthToken();

            // Bersihkan payload dari field kosong atau undefined
            const cleanedPayload: any = {};
            Object.keys(payload).forEach(key => {
                const value = (payload as any)[key];
                // Hanya tambahkan jika value bukan string kosong, undefined, atau null
                if (value !== "" && value !== undefined && value !== null) {
                    cleanedPayload[key] = value;
                }
            });

            console.log("Creating vehicle at:", url);
            console.log("Original Payload:", payload);
            console.log("Cleaned Payload:", cleanedPayload);
            console.log("Payload JSON:", JSON.stringify(cleanedPayload, null, 2));

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
                console.log("Added Authorization header");
            }

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(cleanedPayload),
            });

            console.log("Response status:", response.status, response.statusText);

            const responseText = await response.text();
            console.log("Response text:", responseText);

            let responseData;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch (e) {
                console.error("Failed to parse response as JSON:", e);
                responseData = null;
            }

            console.log("Response data:", responseData);

            if (!response.ok) {
                console.error("API error response:", {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData,
                    rawText: responseText
                });

                let errorMessage = "Gagal membuat data kendaraan.";

                // Handle berbagai status code
                switch (response.status) {
                    case 400:
                        errorMessage = responseData?.error?.message || responseData?.message || "Data tidak valid. Periksa kembali input Anda.";
                        break;
                    case 401:
                        errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
                        break;
                    case 403:
                        errorMessage = "Anda tidak memiliki izin untuk menambahkan kendaraan.";
                        break;
                    case 404:
                        errorMessage = "Endpoint API tidak ditemukan.";
                        break;
                    case 409:
                        errorMessage = responseData?.error?.message || responseData?.message || "Data kendaraan sudah ada.";
                        break;
                    case 422:
                        errorMessage = responseData?.error?.message || responseData?.message || "Data tidak dapat diproses. Periksa format input.";
                        break;
                    case 500:
                        errorMessage = "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
                        break;
                    default:
                        errorMessage = responseData?.error?.message ||
                            responseData?.message ||
                            `HTTP ${response.status}: Gagal membuat data kendaraan.`;
                }

                return {
                    success: false,
                    message: errorMessage,
                };
            }

            return {
                success: true,
                message: "Data kendaraan berhasil dibuat.",
            };
        } catch (error) {
            console.error("Create vehicle error:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat membuat data kendaraan.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Update an existing vehicle
     */
    static async updateVehicle(id: number, payload: CreateVehiclePayload): Promise<VehicleResponse> {
        const token = getAuthToken();
        const url = `${API_BASE_URL}/fleet/vehicle/${id}`;

        // Bersihkan payload dari field kosong atau undefined
        const cleanedPayload: any = {};
        Object.keys(payload).forEach(key => {
            const value = (payload as any)[key];
            // Hanya tambahkan jika value bukan string kosong, undefined, atau null
            if (value !== "" && value !== undefined && value !== null) {
                cleanedPayload[key] = value;
            }
        });

        console.log("Updating vehicle with ID:", id);
        console.log("Original Payload:", payload);
        console.log("Cleaned Payload:", cleanedPayload);
        console.log("Payload JSON:", JSON.stringify(cleanedPayload, null, 2));
        console.log("URL:", url);
        console.log("Token available:", !!token);

        if (!token) {
            console.error("No auth token found");
            return {
                success: false,
                message: "Token autentikasi tidak ditemukan. Silakan login kembali.",
            };
        }

        try {
            // Coba PATCH terlebih dahulu (biasanya untuk partial update)
            let response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(cleanedPayload),
            });

            console.log("PATCH Response status:", response.status, response.statusText);

            // Jika PATCH tidak berhasil (404/405), coba PUT
            if (response.status === 404 || response.status === 405) {
                console.log("PATCH failed, trying PUT method...");
                response = await fetch(url, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(cleanedPayload),
                });
                console.log("PUT Response status:", response.status, response.statusText);
            }

            console.log("Response status:", response.status, response.statusText);

            const responseText = await response.text();
            console.log("Response text:", responseText);

            let responseData;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch (e) {
                console.error("Failed to parse response as JSON:", e);
                responseData = null;
            }

            console.log("Response data:", responseData);

            if (!response.ok) {
                console.error("API error response:", {
                    status: response.status,
                    statusText: response.statusText,
                    data: responseData,
                    rawText: responseText
                });

                let errorMessage = "Gagal memperbarui data kendaraan.";

                // Handle berbagai status code
                switch (response.status) {
                    case 400:
                        errorMessage = responseData?.error?.message || responseData?.message || "Data tidak valid. Periksa kembali input Anda.";
                        break;
                    case 401:
                        errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
                        break;
                    case 403:
                        errorMessage = "Anda tidak memiliki izin untuk mengubah kendaraan ini.";
                        break;
                    case 404:
                        errorMessage = `Kendaraan dengan ID ${id} tidak ditemukan. Mungkin sudah dihapus.`;
                        break;
                    case 409:
                        errorMessage = responseData?.error?.message || responseData?.message || "Data kendaraan konflik.";
                        break;
                    case 422:
                        errorMessage = responseData?.error?.message || responseData?.message || "Data tidak dapat diproses. Periksa format input.";
                        break;
                    case 500:
                        errorMessage = "Terjadi kesalahan pada server. Silakan coba lagi nanti.";
                        break;
                    default:
                        errorMessage = responseData?.error?.message ||
                            responseData?.message ||
                            `HTTP ${response.status}: Gagal memperbarui data kendaraan.`;
                }

                return {
                    success: false,
                    message: errorMessage,
                };
            }

            return {
                success: true,
                message: "Data kendaraan berhasil diperbarui.",
            };
        } catch (error) {
            console.error("Update vehicle error:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat memperbarui data kendaraan.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Delete a vehicle
     */
    static async deleteVehicle(id: number): Promise<VehicleResponse> {
        const token = getAuthToken();
        const url = `${API_BASE_URL}/fleet/vehicle/${id}`;

        console.log("Deleting vehicle with ID:", id);
        console.log("URL:", url);
        console.log("Token available:", !!token);

        if (!token) {
            console.error("No auth token found");
            return {
                success: false,
                message: "Token autentikasi tidak ditemukan. Silakan login kembali.",
            };
        }

        try {
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("Response status:", response.status, response.statusText);

            const responseText = await response.text();
            console.log("Response text:", responseText);

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch {
                console.error("Failed to parse response as JSON");
                responseData = null;
            }

            console.log("Response data:", responseData);

            if (!response.ok) {
                console.error("API error response:", responseData);
                return {
                    success: false,
                    message:
                        responseData?.error?.message ||
                        responseData?.message ||
                        `HTTP ${response.status}: Gagal menghapus data kendaraan.`,
                };
            }

            return {
                success: true,
                message: "Data kendaraan berhasil dihapus.",
            };
        } catch (error) {
            console.error("Delete vehicle error:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat menghapus data kendaraan.",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
