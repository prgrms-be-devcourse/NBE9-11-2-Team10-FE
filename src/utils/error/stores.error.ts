import { ProblemDetailError } from "@/types/common";

export class ApiError extends Error {
  public readonly type: string;
  public readonly title: string;
  public readonly status: number;
  public readonly detail: string;
  public readonly errorCode: string;
  public readonly instance?: string;
  public readonly traceId?: string;
  public readonly validationErrors?: Array<{ field: string; message: string }>;

  constructor(problem: ProblemDetailError) {
    super(problem.detail || "API 요청 중 오류가 발생했습니다.");
    this.name = "ApiError";
    this.type = problem.type;
    this.title = problem.title;
    this.status = problem.status;
    this.detail = problem.detail;
    this.errorCode = problem.errorCode;
    this.instance = problem.instance;
    this.traceId = problem.traceId;
    this.validationErrors = problem.validationErrors;
  }

  static fromProblemDetail(problem: ProblemDetailError): ApiError {
    return new ApiError(problem);
  }

  toString(): string {
    return `[${this.errorCode}] ${this.detail} (status: ${this.status})`;
  }
}

export class ValidationError extends Error {
  public readonly fields: Array<{ field: string; message: string }>;
  constructor(fields: Array<{ field: string; message: string }>) {
    super("입력값 검증에 실패했습니다.");
    this.name = "ValidationError";
    this.fields = fields;
  }
}
