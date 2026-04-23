// e2e/mock-server/lib/mock-product-data.ts
import { MOCK_USERS } from "./mock-user-data";

// ============================================================================
// 📦 상품 타입 정의
// ============================================================================
export type ProductType = "BOOK" | "EBOOK";
export type ProductStatus = "SELLING" | "SOLD_OUT" | "INACTIVE";

export interface Product {
  productId: number;
  productName: string;
  description?: string;
  price: number;
  stock: number;
  nickname: string;
  type: ProductType;
  imageUrl?: string | null;
  status: ProductStatus;
  sellerId: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 🗄️ In-Memory Store
// ============================================================================
export const VALID_TYPES: readonly ProductType[] = ["BOOK", "EBOOK"];
export const VALID_STATUSES: readonly ProductStatus[] = [
  "SELLING",
  "SOLD_OUT",
  "INACTIVE",
];
export const PUBLIC_STATUSES: readonly ProductStatus[] = [
  "SELLING",
  "SOLD_OUT",
]; // INACTIVE 는 공개되지 않음

// 초기 목 데이터
let products: Product[] = [
  {
    productId: 1,
    productName: "스프링 입문",
    description: "자바 스프링 프레임워크 기초 가이드",
    price: 18000,
    stock: 50,
    type: "BOOK",
    imageUrl: "https://example.com/images/spring-intro.jpg",
    status: "SELLING",
    nickname: MOCK_USERS.SELLER.nickname,
    sellerId: MOCK_USERS.SELLER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 2,
    productName: "ABC",
    description: "책 설명입니다.",
    price: 10000,
    stock: 100,
    type: "EBOOK",
    imageUrl: "https://example.com/images/book1.jpg",
    status: "SELLING",
    nickname: MOCK_USERS.SELLER.nickname,
    sellerId: MOCK_USERS.SELLER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 3,
    productName: "품절된 상품",
    description: "재고가 없는 상품입니다.",
    price: 25000,
    stock: 0,
    type: "EBOOK",
    imageUrl: null,
    status: "SOLD_OUT",
    nickname: MOCK_USERS.SELLER.nickname,
    sellerId: MOCK_USERS.SELLER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // ✅ [E2E 전용] 결제 테스트용 상품
  {
    productId: 999, // 충돌 방지를 위해 높은 값 사용
    productName: "[E2E-TEST] 결제 테스트 상품",
    description: "자동화된 결제 테스트를 위한 전용 상품입니다. 실제 판매되지 않습니다.",
    price: 1000, // 테스트용 소액
    stock: 9999, // 재고 무한
    type: "EBOOK",
    imageUrl: null,
    status: "SELLING",
    nickname: MOCK_USERS.SELLER.nickname,
    sellerId: MOCK_USERS.SELLER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let nextId = Math.max(...products.map((p) => p.productId)) + 1;

// ============================================================================
// 🛠️ CRUD 헬퍼 함수
// ============================================================================
export const ProductStore = {
  // 🔍 전체 조회 (필터링 포함)
  findAll: (filters?: {
    type?: ProductType;
    status?: ProductStatus;
  }): Product[] => {
    // ✅ INACTIVE 는 항상 제외 (사실상의 삭제 처리)
    let result = products.filter((p) => p.status !== "INACTIVE");

    if (filters?.type) {
      result = result.filter((p) => p.type === filters.type);
    }
    if (filters?.status) {
      result = result.filter((p) => p.status === filters.status);
    }

    return result;
  },

  // 🔍 ID 로 단일 조회
  findById: (id: number): Product | undefined => {
    const product = products.find((p) => p.productId === id);
    // ✅ 상품이 없거나 INACTIVE 상태이면 undefined 반환 (→ 404 처리)
    return product?.status !== "INACTIVE" ? product : undefined;
  },

  // ➕ 신규 상품 생성
  create: (
    data: Omit<Product, "productId" | "createdAt" | "updatedAt">,
  ): Product => {
    const newProduct: Product = {
      ...data,
      productId: nextId++,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    return newProduct;
  },

  // ✏️ 상품 수정
  update: (id: number, updates: Partial<Product>): Product | null => {
    const index = products.findIndex((p) => p.productId === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return products[index];
  },

  // ❌ 상품 비활성화 (소프트 삭제)
  // → 실제 배열에서는 삭제하지 않지만, API 조회 시 자동으로 제외됨
  deactivate: (id: number): Product | null => {
    return ProductStore.update(id, { status: "INACTIVE" });
  },

  // 🔄 데이터 초기화 (E2E 테스트용)
  reset: () => {
    products = [
      {
        productId: 1,
        productName: "스프링 입문",
        description: "자바 스프링 프레임워크 기초 가이드",
        price: 18000,
        stock: 50,
        type: "BOOK",
        imageUrl: "https://example.com/images/spring-intro.jpg",
        status: "SELLING",
        nickname: MOCK_USERS.SELLER.nickname,
        sellerId: MOCK_USERS.SELLER.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 2,
        productName: "ABC",
        description: "책 설명입니다.",
        price: 10000,
        stock: 100,
        type: "EBOOK",
        imageUrl: "https://example.com/images/book1.jpg",
        status: "SELLING",
        nickname: MOCK_USERS.SELLER.nickname,
        sellerId: MOCK_USERS.SELLER.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 3,
        productName: "품절된 상품",
        description: "재고가 없는 상품입니다.",
        price: 25000,
        stock: 0,
        type: "EBOOK",
        imageUrl: null,
        status: "SOLD_OUT",
        nickname: MOCK_USERS.SELLER.nickname,
        sellerId: MOCK_USERS.SELLER.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      // ✅ [E2E 전용] 결제 테스트용 상품
      {
        productId: 999, // 충돌 방지를 위해 높은 값 사용
        productName: "[E2E-TEST] 결제 테스트 상품",
        description: "자동화된 결제 테스트를 위한 전용 상품입니다. 실제 판매되지 않습니다.",
        price: 1000, // 테스트용 소액
        stock: 9999, // 재고 무한
        type: "EBOOK",
        imageUrl: null,
        status: "SELLING",
        nickname: MOCK_USERS.SELLER.nickname,
        sellerId: MOCK_USERS.SELLER.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    nextId = 4;
  },

  // 📊 통계 (테스트/디버깅용)
  getCount: () => products.length,
};
