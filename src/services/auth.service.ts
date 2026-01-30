import { API_ENDPOINTS } from "@/lib/constants";
import {
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
  User,
} from "@/types";
import { decodeJWT } from "@/lib/utils";

/**
 * Auth Service - handles all authentication related API calls
 */
export class AuthService {
  /**
   * Register new user
   */
  static async register(
    credentials: RegisterCredentials,
  ): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          message:
            responseData?.message || "Registrasi gagal. Silakan coba lagi.",
        };
      }

      return {
        success: true,
        message: "Registrasi berhasil! Silakan login.",
      };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat registrasi. Silakan coba lagi.",
      };
    }
  }

  /**
   * Login with username and password
   */
  static async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      // Get the token from response headers or body
      const responseData = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          message:
            responseData?.message ||
            "Login gagal. Periksa username dan password Anda.",
        };
      }

      // The API returns token in Authorization header or in response body
      let token = response.headers.get("Authorization")?.replace("Bearer ", "");

      // If not in header, check body
      if (!token && responseData?.token) {
        token = responseData.token;
      }

      // If still no token but response is ok, check if token is in data
      if (!token && responseData?.data?.token) {
        token = responseData.data.token;
      }

      // If response ok but no token, the token might be the response itself
      if (!token && typeof responseData === "string") {
        token = responseData;
      }

      if (!token) {
        return {
          success: false,
          message: "Token tidak ditemukan dalam response.",
        };
      }

      // Decode token to get user info
      const payload = decodeJWT(token);
      const user: User = {
        id: payload?.id as number,
        username: (payload?.username as string) || credentials.username,
        realname: (payload?.realname as string) || credentials.username,
        email: payload?.email as string,
        usergroup: payload?.usergroup as number,
        usertype: payload?.usertype as number,
        userstatus: payload?.userstatus as number,
        isAdmin: payload?.isAdmin as boolean,
      };

      return {
        success: true,
        token,
        user,
        message: "Login berhasil!",
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: "Terjadi kesalahan saat login. Silakan coba lagi.",
      };
    }
  }

  /**
   * Get user profile
   */
  static async getProfile(token: string, userId: number): Promise<User | null> {
    try {
      const response = await fetch(API_ENDPOINTS.PROFILE(userId), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error("Get profile error:", error);
      return null;
    }
  }
}
