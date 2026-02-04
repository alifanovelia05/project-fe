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

export interface User {
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

export interface UserResponse {
    success: boolean;
    data?: User[];
    message?: string;
    error?: string;
}

export interface CurrentUserResponse {
    success: boolean;
    data?: User;
    message?: string;
    error?: string;
}

export class UserService {
    /**
     * Get all users
     */
    static async getUsers(): Promise<UserResponse> {
        try {
            const url = `${API_BASE_URL}/users`;
            const token = getAuthToken();

            console.log("Fetching users from:", url);

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

            console.log("Response status:", response.status);

            const responseText = await response.text();
            console.log("Response text:", responseText);

            let responseData;
            try {
                responseData = responseText ? JSON.parse(responseText) : null;
            } catch (e) {
                console.error("Failed to parse response:", e);
                responseData = null;
            }

            if (!response.ok) {
                return {
                    success: false,
                    message: responseData?.message || "Gagal mengambil data user",
                };
            }

            // Handle response format
            let users = [];
            if (Array.isArray(responseData)) {
                users = responseData;
            } else if (responseData?.data && Array.isArray(responseData.data)) {
                users = responseData.data;
            }

            return {
                success: true,
                data: users,
                message: "Data user berhasil diambil",
            };
        } catch (error) {
            console.error("Get users error:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data user",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }

    /**
     * Get current logged in user
     */
    static async getCurrentUser(): Promise<CurrentUserResponse> {
        try {
            const username = sessionStorage.getItem("username") || localStorage.getItem("username");

            if (!username) {
                return {
                    success: false,
                    message: "Username tidak ditemukan",
                };
            }

            const response = await this.getUsers();

            if (!response.success || !response.data) {
                return {
                    success: false,
                    message: "Gagal mengambil data user",
                };
            }

            // Cari user berdasarkan username yang login
            const currentUser = response.data.find((user) => user.username === username);

            if (!currentUser) {
                return {
                    success: false,
                    message: "User tidak ditemukan",
                };
            }

            return {
                success: true,
                data: currentUser,
                message: "Data user berhasil diambil",
            };
        } catch (error) {
            console.error("Get current user error:", error);
            return {
                success: false,
                message: "Terjadi kesalahan saat mengambil data user",
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
}

