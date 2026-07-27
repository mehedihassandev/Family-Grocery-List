import { AxiosError } from "axios";
import { IHTTPValidationError } from "../../models/common";

export const isAxiosApiError = (error: unknown): error is AxiosError<IHTTPValidationError> => {
  return error instanceof AxiosError;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallback = "An unexpected error occurred",
): string => {
  if (isAxiosApiError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (typeof data.detail === "string") {
      return data.detail;
    }
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      const firstError = data.detail[0] as { msg?: string };
      if (firstError?.msg) {
        return firstError.msg;
      }
    }
    if (typeof data.message === "string") {
      return data.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
