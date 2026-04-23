import { ProductType, ProductStatus, PublicStatus } from '@/schemas/product.schema';
import { ValidationError } from './common';

// ============================================================================
// 📦 상품 데이터 타입
// ============================================================================
export interface Product {
  productId: number;
  productName: string;
  description?: string;
  price: number;
  stock: number;
  nickname: string;
  sellerId?: number;
  type: ProductType;
  imageUrl?: string | null;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
}

// 🔹 목록 조회용 (상세 필드 제외)
export interface ProductSummary {
  productId: number;
  productName: string;
  price: number;
  nickname: string;
  sellerId: number;
  imageUrl?: string | null;
  type: ProductType;
  status: PublicStatus;
}

// ============================================================================
// 🔹 GET /api/v1/products - 목록 조회 응답
// ============================================================================
export interface ProductListResponse {
  success: true;
  data: {
    content: ProductSummary[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface ProductListErrorResponse {
  success: false;
  detail: string;
  errorCode: string;
  status: number;
  validationErrors?: ValidationError[];
}

export type ProductListResult = ProductListResponse | ProductListErrorResponse;

// ============================================================================
// 🔹 GET /api/v1/products/:id - 상세 조회 응답
// ============================================================================
export interface ProductDetailResponse {
  success: true;
  data: Product;
}

export interface ProductDetailErrorResponse {
  success: false;
  detail: string;
  errorCode: string;
  status: number;
}

export type ProductDetailResult = ProductDetailResponse | ProductDetailErrorResponse;

// ============================================================================
// 🔹 POST /api/v1/stores/me/products - 등록 응답
// ============================================================================
export interface ProductCreateResponse {
  success: true;
  data: Product;
}

export interface ProductCreateErrorResponse {
  success: false;
  detail: string;
  errorCode: string;
  status: number;
  validationErrors?: ValidationError[];
}

export type ProductCreateResult = ProductCreateResponse | ProductCreateErrorResponse;

// ============================================================================
// 🔹 PUT /api/v1/stores/me/products/:id - 수정 응답
// ============================================================================
export interface ProductUpdateResponse {
  success: true;
  data: Product;
}

export interface ProductUpdateErrorResponse {
  success: false;
  detail: string;
  errorCode: string;
  status: number;
  validationErrors?: ValidationError[];
}

export type ProductUpdateResult = ProductUpdateResponse | ProductUpdateErrorResponse;

// ============================================================================
// 🔹 PATCH /api/v1/stores/me/products/:id/inactive - 비활성화 응답
// ============================================================================
export interface ProductDeactivateResponse {
  success: true;
  data: {
    productId: number;
    status: 'INACTIVE';
    message: string;
  };
}

export interface ProductDeactivateErrorResponse {
  success: false;
  detail: string;
  errorCode: string;
  status: number;
}

export type ProductDeactivateResult = ProductDeactivateResponse | ProductDeactivateErrorResponse;

// ============================================================================
// 🎯 Server Action 반환 타입 (useActionState 연동용)
// ============================================================================
export interface ProductActionState<T = unknown> {
  success: boolean;
  message?: string;
  errorCode?: string;
  data?: T;
  errors?: Record<string, string>;
}

export const initialProductState: ProductActionState = {
  success: false,
  message: '',
  errors: {},
};
