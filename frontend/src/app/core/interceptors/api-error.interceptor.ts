import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiError, ApiErrorBody } from '../models/api.model';

// converts every http error into ApiError, so components can just show err.message
export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => throwError(() => toApiError(err)))
  );
};

function toApiError(err: HttpErrorResponse): ApiError {
  const body = err.error as ApiErrorBody | null;
  if (body?.error?.message) {
    return new ApiError(body.error.message, err.status, body.error.field);
  }

  // no json error from our api means we never reached it
  // (status 0 = backend down or blocked by CORS, 5xx without body = a server/proxy in between failed)
  if (err.status === 0 || err.status >= 500) {
    return new ApiError('Cannot connect to the server. Please check the backend is running.', err.status);
  }

  return new ApiError(`Something went wrong (status ${err.status})`, err.status);
}
