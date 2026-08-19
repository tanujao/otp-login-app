export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  code?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  user?: User;
  message?: string;
}

export interface RecognizeResponse {
  recognized: boolean;
  first_name?: string;
  last_name?: string;
}

export interface ResendResponse {
  success: boolean;
  message: string;
}

export interface CheckoutResponse {
  success: boolean;
  message: string;
}
