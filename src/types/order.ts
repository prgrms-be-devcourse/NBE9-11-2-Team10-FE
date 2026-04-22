// ============================================================================
// 📦 공통 API 응답 래퍼
// ============================================================================
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  error: null;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    status: number;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// 📦 주문 생성/확인 응답 타입
// ============================================================================
export interface CreateOrderResponse {
  orderNumber: string;
  totalAmount: number;
  userId: number;
}

export interface ConfirmOrderResponse {
  paymentKey: string;
  orderId: string;
  status: "DONE" | "READY" | "CANCELLED";
}

// ============================================================================
// 📦 주문 아이템 타입
// ============================================================================
export interface OrderItemDto {
  productId: number;
  productName: string;
  quantity: number;
  orderPrice: number;
}

// ============================================================================
// 📦 배송 정보 타입
// ============================================================================
export interface OrderDeliveryDto {
  deliveryAddress: string;
  trackingNumber?: string;
}

// ============================================================================
// 📦 주문 상세 정보 타입
// ============================================================================
export interface OrderDetailResponse {
  orderNumber: string;
  totalAmount: number;
  paymentStatus: "READY" | "PAID" | "CANCELLED" | "REFUNDED";
  createdAt: string; // ISO 8601
  delivery: OrderDeliveryDto;
  orderItems: OrderItemDto[];
}

// 🔹 주문 상세 - 실제 데이터
export type OrderDetailData = OrderDetailResponse;

// 🔹 주문 상세 - 전체 응답 (래퍼 포함)
export type OrderDetailResponseWrapper = ApiResponse<OrderDetailData>;

// ============================================================================
// 📦 구매자 주문 목록 응답 타입
// ============================================================================
export interface BuyerOrderSummary {
  orderNumber: string;
  totalAmount: number;
  status: string;
  representativeProductName: string;
  totalQuantity: number;
  createdAt: string;
}

// 🔹 구매자 주문 목록 - 실제 데이터
export interface BuyerOrdersData {
  userId: number;
  userName: string;
  orders: BuyerOrderSummary[];
}

// 🔹 구매자 주문 목록 - 전체 응답 (래퍼 포함)
export type BuyerOrdersResponse = ApiResponse<BuyerOrdersData>;

// ============================================================================
// 📦 판매자 주문 목록 응답 타입
// ============================================================================
export interface SellerOrderSummary {
  orderNumber: string;
  buyerName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

// 🔹 판매자 주문 목록 - 실제 데이터
export interface SellerOrdersData {
  sellerId: number;
  sellerName: string;
  orders: SellerOrderSummary[];
}

// 🔹 판매자 주문 목록 - 전체 응답 (래퍼 포함)
export type SellerOrdersResponse = ApiResponse<SellerOrdersData>;

