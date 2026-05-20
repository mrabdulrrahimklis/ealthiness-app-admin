import { clientTokens } from "~/lib/auth/client-cookies";

const API_BASE_URL =
  "https://elathiness-backend-app-company-idea-production.up.railway.app";

export interface ApiError {
  message: string;
  status: number;
  statusCode?: number;
  errors?: string;
  type?: string;
  code?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = clientTokens.getAccessToken();

    const config: RequestInit = {
      ...options,
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.message || errorData.errors || `HTTP ${response.status}`,
          status: response.status,
          statusCode: errorData.statusCode || response.status,
          errors: errorData.errors,
          type: errorData.type,
          code: errorData.code,
          ...errorData
        } as ApiError;
      }

      // Handle empty response bodies (common for 201, 204 responses)
      const text = await response.text();
      if (!text) {
        return {} as T;
      }
      
      try {
        return JSON.parse(text);
      } catch {
        return text as T;
      }
    } catch (error) {
      if (error && typeof error === "object" && "status" in error) {
        throw error;
      }

      throw {
        message: error instanceof Error ? error.message : "Network error",
        status: 0,
      } as ApiError;
    }
  }

  async post<T>(
    endpoint: string,
    data?: any,
    options?: RequestInit,
  ): Promise<T> {
    const body =
      data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;
    
    const defaultHeaders: Record<string, string> = data instanceof FormData 
      ? {} 
      : { "Content-Type": "application/json" };

    return this.request<T>(endpoint, {
      method: "POST",
      body,
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "GET",
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const body =
      data instanceof FormData ? data : data ? JSON.stringify(data) : undefined;
    
    const defaultHeaders: Record<string, string> = data instanceof FormData 
      ? {} 
      : data ? { "Content-Type": "application/json" } : {};

    return this.request<T>(endpoint, {
      method: "PUT",
      body,
      ...options,
      headers: {
        ...defaultHeaders,
        ...options?.headers,
      },
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
