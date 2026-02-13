import axios, { AxiosError } from "axios";
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

/**
 * Axios instance dengan konfigurasi default
 */
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

/**
 * Axios interceptor untuk menambahkan token ke setiap request
 */
axiosInstance.interceptors.request.use(
    (config) => {
        const token = getAuthToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Disable caching untuk GET requests (selalu ambil data fresh)
        if (config.method?.toLowerCase() === "get") {
            config.headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
            config.headers["Pragma"] = "no-cache";
            config.headers["Expires"] = "0";
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    status: number;
    type: number;
    parent: number;
    group: number;
    usergroup?: number;
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

export interface CreateUserPayload {
    username: string;
    email: string;
    name: string;
    password: string;
    status: number;
    type: number;
    usergroup: number;
    parent: number;
    group: number; // HARUS number, bukan string!
    menu: string;
}

export interface UpdateUserPayload {
    username?: string;
    email?: string;
    name?: string;
    password?: string;
    password2?: string;
    status?: number;
    type?: number;
    usergroup?: number;
    parent?: number;
    group?: number; // HARUS number untuk consistency
    menu?: string;
}

export interface UserMutationResponse {
    success: boolean;
    data?: User;
    message?: string;
    error?: string;
}

export class UserService {
    /**
     * GET All Users
     * ATURAN BACKEND:
     * - JANGAN pakai query ?id=... karena middleware backend akan delete params.id
     * - Gunakan query ?username=... untuk mencari spesifik user
     * - Backend strict: TIDAK boleh ada parameter tambahan
     * - Cache bypass: Gunakan Cache-Control headers (sudah di interceptor)
     */
    static async getUsers(username?: string): Promise<UserResponse> {
        try {
            const token = getAuthToken();
            console.log("[UserService] Token exists:", !!token);
            console.log("[UserService] Base URL:", API_BASE_URL);

            // Hanya gunakan username untuk filter, JANGAN pakai id atau parameter lain
            const path = username
                ? `/users?username=${encodeURIComponent(username)}`
                : "/users?$limit=500";

            console.log("[UserService] GET", path);
            const response = await axiosInstance.get(path);
            console.log("[UserService] Response status:", response.status);
            console.log("[UserService] Response data:", response.data);

            // Handle berbagai format response dari backend
            let users: User[] = [];
            if (Array.isArray(response.data)) {
                users = response.data;
                console.log("[UserService] Data is array, users:", users.length);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                users = response.data.data;
                console.log("[UserService] Data in nested .data, users:", users.length);
            } else {
                console.warn("[UserService] Unexpected response format", response.data);
            }

            return {
                success: true,
                data: users,
                message: "Data user berhasil diambil",
            };
        } catch (error) {
            console.error("[UserService] Get users error:", error);
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error("[UserService] Error response:", axiosError.response?.data);
            console.error("[UserService] Error status:", axiosError.response?.status);
            return {
                success: false,
                message: axiosError.response?.data?.message || "Terjadi kesalahan saat mengambil data user",
                error: axiosError.message,
            };
        }
    }

    /**
     * GET User Detail by Username
     * ATURAN BACKEND:
     * - JANGAN gunakan /users/:id karena akan 404
     * - WAJIB gunakan /users?username=... untuk detail user
     */
    static async getUserByUsername(username: string): Promise<CurrentUserResponse> {
        try {
            if (!username) {
                return {
                    success: false,
                    message: "Username wajib diisi",
                };
            }

            const response = await axiosInstance.get("/users", {
                params: { username }
            });

            let user: User | undefined;

            // Handle response yang berupa array
            if (Array.isArray(response.data)) {
                user = response.data.find((u: User) => u.username === username);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                user = response.data.data.find((u: User) => u.username === username);
            } else if (response.data && !Array.isArray(response.data)) {
                user = response.data as User;
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
                message: "Data user berhasil diambil",
            };
        } catch (error) {
            console.error("Get user by username error:", error);
            const axiosError = error as AxiosError<{ message?: string }>;
            return {
                success: false,
                message: axiosError.response?.data?.message || "Terjadi kesalahan saat mengambil data user",
                error: axiosError.message,
            };
        }
    }

    /**
     * POST Create User
     * ATURAN BACKEND:
     * - Kirim sebagai OBJECT tunggal (bukan array)
     * - Field WAJIB: email, password, username (divalidasi ketat)
     */
    static async createUser(payload: CreateUserPayload): Promise<UserMutationResponse> {
        try {
            // Validasi field wajib
            if (!payload.email) {
                return {
                    success: false,
                    message: "Email wajib diisi",
                };
            }

            if (!payload.password) {
                return {
                    success: false,
                    message: "Password wajib diisi",
                };
            }

            if (!payload.username) {
                return {
                    success: false,
                    message: "Username wajib diisi",
                };
            }

            // Kirim sebagai OBJECT tunggal, BUKAN array
            console.log("[UserService] POST /users with payload:", payload);
            const response = await axiosInstance.post("/users", payload);
            console.log("[UserService] Create user response status:", response.status);
            console.log("[UserService] Create user response data:", JSON.stringify(response.data, null, 2));

            // Cek apakah backend return error meskipun status 200
            if (response.data?.error || response.data?.success === false) {
                console.error("[UserService] Backend returned error:", response.data);
                return {
                    success: false,
                    message: response.data?.message || response.data?.error || "Backend menolak request",
                    error: response.data?.error,
                };
            }

            return {
                success: true,
                data: response.data?.data || response.data,
                message: response.data?.message || "User berhasil ditambah",
            };
        } catch (error) {
            console.error("[UserService] Create user error:", error);
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error("[UserService] Error response:", axiosError.response?.data);
            return {
                success: false,
                message: axiosError.response?.data?.message || "Terjadi kesalahan saat menambah user",
                error: axiosError.message,
            };
        }
    }

    /**
     * PATCH Update User
     * ATURAN BACKEND KRUSIAL:
     * - Server WAJIB menerima data dalam bentuk ARRAY []
     * - Jika kirim Object tunggal, server akan return 400 Bad Request
     * - Fungsi ini OTOMATIS membungkus payload dalam array
     */
    static async updateUser(id: number, payload: UpdateUserPayload): Promise<UserMutationResponse> {
        try {
            if (!id) {
                return {
                    success: false,
                    message: "User ID wajib diisi",
                };
            }

            // KRUSIAL: Backend WAJIB terima array, bukan object tunggal
            // Bungkus payload dalam array dan sertakan id
            const arrayPayload = [
                {
                    id,
                    ...payload,
                }
            ];

            console.log(`[UserService] PATCH /users/${id} with payload:`, arrayPayload);
            const response = await axiosInstance.patch(`/users/${id}`, arrayPayload);
            console.log("[UserService] Update user response:", response.status, response.data);

            return {
                success: true,
                data: response.data?.data || response.data,
                message: response.data?.message || "User berhasil diperbarui",
            };
        } catch (error) {
            console.error("[UserService] Update user error:", error);
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error("[UserService] Error response:", axiosError.response?.data);
            return {
                success: false,
                message: axiosError.response?.data?.message || "Terjadi kesalahan saat memperbarui user",
                error: axiosError.message,
            };
        }
    }

    /**
     * DELETE User (hard delete)
     */
    static async deleteUser(id: number): Promise<UserMutationResponse> {
        try {
            if (!id) {
                return {
                    success: false,
                    message: "User ID wajib diisi",
                };
            }

            console.log(`[UserService] DELETE /users/${id}`);
            const response = await axiosInstance.delete(`/users/${id}`);
            console.log("[UserService] Delete user response:", response.status, response.data);

            return {
                success: true,
                data: response.data?.data || response.data,
                message: response.data?.message || "User berhasil dihapus",
            };
        } catch (error) {
            console.error("[UserService] Delete user error:", error);
            const axiosError = error as AxiosError<{ message?: string }>;
            console.error("[UserService] Error response:", axiosError.response?.data);
            return {
                success: false,
                message: axiosError.response?.data?.message || "Terjadi kesalahan saat menghapus user",
                error: axiosError.message,
            };
        }
    }

    /**
     * GET Current Logged In User
     * Menggunakan username dari session storage
     */
    static async getCurrentUser(): Promise<CurrentUserResponse> {
        try {
            const username = sessionStorage.getItem("username") || localStorage.getItem("username");

            if (!username) {
                return {
                    success: false,
                    message: "Username tidak ditemukan di session",
                };
            }

            // Gunakan getUserByUsername karena tidak ada endpoint /users/:id
            return await this.getUserByUsername(username);
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
