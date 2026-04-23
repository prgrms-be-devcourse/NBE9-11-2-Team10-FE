import { ProblemDetailError } from "@/types/common";

export class OrderApiError extends Error {
  constructor(
    public readonly problemDetail: ProblemDetailError,
  ) {
    super(problemDetail.detail);
    this.name = "OrderApiError";
  }

  static fromProblemDetail(detail: ProblemDetailError): OrderApiError {
    return new OrderApiError(detail);
  }

  get statusCode(): number {
    return this.problemDetail.status;
  }

  get errorCode(): string {
    return this.problemDetail.errorCode || "UNKNOWN_ERROR";
  }
}

// ============================================================================
// 🔹 비즈니스 로직 에러 (선택적 사용)
// ============================================================================
export class OrderValidationError extends OrderApiError {
  constructor(message: string, field?: string) {
    const problemDetail: ProblemDetailError = {
      type: "https://api.example.com/errors/VALIDATION_FAILED",
      title: "입력값 검증 실패",
      status: 400,
      detail: message,
      errorCode: "VALIDATION_FAILED",
      validationErrors: field ? [{ field, message }] : undefined,
    };
    super(problemDetail);
    this.name = "OrderValidationError";
  }
}

export class OrderNotFoundError extends OrderApiError {
  constructor(resource: "ORDER" | "USER" | "PRODUCT" | "PAYMENT", id?: string) {
    const messages: Record<string, string> = {
      ORDER: "주문 내역을 찾을 수 없습니다.",
      USER: "해당 유저 정보를 찾을 수 없습니다.",
      PRODUCT: `상품을 찾을 수 없습니다. ID: ${id}`,
      PAYMENT: "결제 정보가 존재하지 않습니다.",
    };
    const problemDetail: ProblemDetailError = {
      type: "https://api.example.com/errors/NOT_FOUND",
      title: "리소스를 찾을 수 없습니다.",
      status: 404,
      detail: messages[resource],
      errorCode: `${resource}_NOT_FOUND`,
    };
    super(problemDetail);
    this.name = "OrderNotFoundError";
  }
}

export class OrderAccessDeniedError extends OrderApiError {
  constructor(message = "해당 리소스에 대한 접근 권한이 없습니다.") {
    const problemDetail: ProblemDetailError = {
      type: "https://api.example.com/errors/ACCESS_DENIED",
      title: "접근 권한 오류",
      status: 403,
      detail: message,
      errorCode: "ACCESS_DENIED",
    };
    super(problemDetail);
    this.name = "OrderAccessDeniedError";
  }
}