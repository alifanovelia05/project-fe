"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AuthService } from "@/services/auth.service";
import {
  AUTH_COOKIE_NAME,
  USER_COOKIE_NAME,
  COOKIE_OPTIONS,
  ROUTES,
} from "@/lib/constants";
import {
  ActionResult,
  User,
  LoginCredentials,
  RegisterCredentials,
} from "@/types";

/**
 * Server Action: Login
 * Handles login logic, sets cookies, and returns result.
 */
export async function loginAction(
  credentials: LoginCredentials,
): Promise<ActionResult> {
  const { username, password } = credentials;

  if (!username || !password) {
    return {
      success: false,
      errorTitle: "Validasi Gagal",
      errorDesc: "Username dan password harus diisi.",
    };
  }

  const result = await AuthService.login({ username, password });

  if (!result.success || !result.token) {
    return {
      success: false,
      errorTitle: "Login Gagal",
      errorDesc: result.message || "Username atau password salah.",
    };
  }
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, result.token, COOKIE_OPTIONS);
  if (result.user) {
    cookieStore.set(USER_COOKIE_NAME, JSON.stringify(result.user), {
      ...COOKIE_OPTIONS,
      httpOnly: false,
    });
  }

  return {
    success: true,
    successTitle: "Login Berhasil",
    successDesc: `Selamat datang, ${result.user?.realname || result.user?.username}!`,
    redirectTo: ROUTES.DASHBOARD,
    token: result.token, // Return token untuk disimpan di client-side
    user: result.user,
  };
}

/**
 * Server Action: Register
 */
export async function registerAction(
  credentials: RegisterCredentials,
): Promise<ActionResult> {
  // Call auth service
  const result = await AuthService.register(credentials);

  if (!result.success) {
    return {
      success: false,
      errorTitle: "Registrasi Gagal",
      errorDesc: result.message || "Terjadi kesalahan saat registrasi.",
    };
  }

  return {
    success: true,
    successTitle: "Registrasi Berhasil",
    successDesc: "Akun Anda telah berhasil dibuat. Silakan login.",
    redirectTo: ROUTES.SIGNIN,
  };
}

/**
 * Server Action: Logout
 */
export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(AUTH_COOKIE_NAME);
  cookieStore.delete(USER_COOKIE_NAME);

  redirect(ROUTES.SIGNIN);
}

/**
 * Server Action: Get current user from cookies
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(USER_COOKIE_NAME);

  if (!userCookie?.value) {
    return null;
  }

  try {
    return JSON.parse(userCookie.value) as User;
  } catch {
    return null;
  }
}

/**
 * Server Action: Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME);

  return !!token?.value;
}
