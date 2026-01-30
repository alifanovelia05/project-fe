// API Configuration
export const API_BASE_URL = "http://149.28.151.39:3000";
export const API_VERSION = "v2";

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: `${API_BASE_URL}/auth`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  PROFILE: (userId: number) => `${API_BASE_URL}/${API_VERSION}/users/${userId}`,
  MONITORING: `${API_BASE_URL}/${API_VERSION}/monitoring`,
} as const;

// Auth Cookie Names
export const AUTH_COOKIE_NAME = "auth_token";
export const USER_COOKIE_NAME = "user_data";

// Cookie Options
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: "/",
};

// Routes
export const ROUTES = {
  HOME: "/",
  SIGNIN: "/signin",
  SIGNUP: "/signup",
  DASHBOARD: "/",
} as const;

// Protected Routes (routes that require authentication)
export const PROTECTED_ROUTES = [
  "/",
  "/profile",
  "/calendar",
  "/forms",
  "/tables",
  "/charts",
] as const;

// Public Routes (routes that don't require authentication)
export const PUBLIC_ROUTES = ["/signin", "/signup", "/reset-password"] as const;
