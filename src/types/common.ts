// ============================================================================
// 📦 공통 에러 응답 (RFC 7807 ProblemDetail)
// ============================================================================
export interface ProblemDetailError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  errorCode: string;
  traceId?: string;
  validationErrors?: Array<{ field: string; message: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface ValidationError {
  field: string;
  message: string;
}
