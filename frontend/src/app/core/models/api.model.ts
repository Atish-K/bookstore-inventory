// success responses from the backend are wrapped in { data: ... }
export interface ApiResponse<T> {
  data: T;
}

// error body from the backend: { error: { message, field } }
export interface ApiErrorBody {
  error: {
    message: string;
    field?: string;
  };
}

// the interceptor converts every failed http call into this
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message);
  }
}
