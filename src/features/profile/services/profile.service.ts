import { API_BASE_URL } from "@/lib/constants";

/**
 * Get auth token from sessionStorage/localStorage (client-side)
 */
function getAuthToken(): string | null {
    if (typeof window === "undefined") return null;

    let token = sessionStorage.getItem("auth_token");
    if (token) return token;

    token = localStorage.getItem("auth_token");
    if (token) return token;

    return null;
}

export interface ProfileUser {
    id: number;
    username: string;
    email: string;
    name: string;
    status: number;
    type: number;
    parent: number;
    group: number;
    menu: string;
    lastlogin: string;
    registered: string;
}

export interface ProfileResponse {
    success: boolean;
    data?: ProfileUser;
    message?: string;
    error?: string;
}

export class ProfileService {
    /**
     * Get current logged in user for profile page
     */
    static async getCurrentUser(): Promise<ProfileResponse> {
        try {
            const token = getAuthToken();
            const url = `${API_BASE_URL}/users/me`;

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };

            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

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
                    message: responseData?.message || "Gagal mengambil data profil",
                };
            }

            let user: ProfileUser | undefined;
            if (responseData?.data && !Array.isArray(responseData.data)) {
                user = responseData.data as ProfileUser;
            } else if (responseData && !Array.isArray(responseData)) {
                user = responseData as ProfileUser;
            }

            if (!user) {
                return {
                    success: false,
                    message: "User tidak ditemukan",
                };
            }

            return {
                success: true,
                data: user,
                message: "Data profil berhasil diambil",
            };
        } catch (error) {
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data profil",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}
