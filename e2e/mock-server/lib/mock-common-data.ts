// ============================================================================
// 📦 RFC 7807 ProblemDetail 응답 생성 유틸
// ============================================================================
export interface ProblemDetailResponse {
    type: string;
    title: string;
    status: number;
    detail: string;
    instance?: string;
    errorCode: string;
    traceId?: string;
    validationErrors?: Array<{ field: string; message: string }>;
    [key: string]: any;
  }
  
  export const createErrorResponse = (
    status: number,
    errorCode: string,
    detail: string,
    instance: string,
    extra?: Record<string, any>
  ): ProblemDetailResponse => {
    const statusTitle: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      409: 'Conflict',
      500: 'Internal Server Error',
    };
  
    return {
      type: `https://api.example.com/errors/${errorCode}`,
      title: statusTitle[status] || 'Error',
      status,
      detail,
      instance,
      errorCode,
      traceId: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...extra,
    };
  };