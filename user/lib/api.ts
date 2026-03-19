import axios from "axios";

const baseURL =
  "http://localhost:4000";

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

let accessToken: string | null = null;

export function setApiAccessToken(token: string | null) {
  accessToken = token;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

export type ApiSuccessResponse<T> = {
  status: "success";
  message?: string;
  data: T;
};

export type ApiErrorResponse = {
  status: "error";
  message: string;
  details?: unknown;
};

export function extractApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
    if (typeof error.response?.data === "string") {
      return error.response.data;
    }
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

