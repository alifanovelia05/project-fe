// User types
export interface User {
  id: number;
  username: string;
  email?: string;
  realname: string;
  usergroup: number;
  usertype: number;
  userstatus: number;
  menu?: string;
  isAdmin?: boolean;
}

// Auth types
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  password2: string;
  realname: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

// API Response types
export interface ApiResponse<T = unknown> {
  meta: {
    status: number;
    version: string;
    copyright: string;
  };
  data: T;
}

// Action Result types
export interface ActionResult {
  success: boolean;
  errorTitle?: string;
  errorDesc?: string;
  successTitle?: string;
  successDesc?: string;
  redirectTo?: string;
  token?: string;
  user?: User;
}
