import type { ApiErrorCode } from '../../../shared/types';

export class ServiceError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly candidates?: { id: string; name: string }[],
  ) {
    super(message);
  }
}

export const HTTP_STATUS: Record<ApiErrorCode, number> = {
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  AMBIGUOUS_CLUB: 409,
  SOURCE_DISABLED: 503,
  UPSTREAM_UNAVAILABLE: 502,
  UPSTREAM_TIMEOUT: 504,
  UPSTREAM_INVALID: 502,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};
