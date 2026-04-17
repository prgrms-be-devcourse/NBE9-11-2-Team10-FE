// e2e/mock-server/lib/mock-product-data.ts
import { MOCK_USERS } from './mock-user-data';

// ============================================================================
// 📦 상품 타입 정의
// ============================================================================
export type ProductType = 'BOOK' | 'EBOOK';
export type ProductStatus = 'SELLING' | 'SOLD_OUT' | 'INACTIVE';

export interface Product {
  productId: number;
  productName: string;
  description?: string;
  price: number;
  stock: number;
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
export const VALID_TYPES: readonly ProductType[] = ['BOOK', 'EBOOK'];
export const VALID_STATUSES: readonly ProductStatus[] = ['SELLING', 'SOLD_OUT', 'INACTIVE'];
export const PUBLIC_STATUSES: readonly ProductStatus[] = ['SELLING', 'SOLD_OUT']; // INACTIVE 는 공개되지 않음

// 초기 목 데이터
let products: Product[] = [
  {
    productId: 1,
    productName: '스프링 입문',
    description: '자바 스프링 프레임워크 기초 가이드',
    price: 18000,
    stock: 50,
    type: 'BOOK',
    imageUrl: 'https://example.com/images/spring-intro.jpg',
    status: 'SELLING',
    sellerId: MOCK_USERS.SELLER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 2,
    productName: 'ABC',
    description: '책 설명입니다.',
    price: 10000,
    stock: 100,
    type: 'EBOOK',
    imageUrl: 'https://example.com/images/book1.jpg',
    status: 'SELLING',
    sellerId: MOCK_USERS.SELLER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    productId: 3,
    productName: '품절된 상품',
    description: '재고가 없는 상품입니다.',
    price: 25000,
    stock: 0,
    type: 'EBOOK',
    imageUrl: null,
    status: 'SOLD_OUT',
    sellerId: MOCK_USERS.SELLER.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

let nextId = Math.max(...products.map(p => p.productId)) + 1;

// ============================================================================
// 🛠️ CRUD 헬퍼 함수
// ============================================================================
export const ProductStore = {
  // 🔍 전체 조회 (필터링 포함)
  findAll: (filters?: {
    type?: ProductType;
    status?: ProductStatus;
    excludeInactive?: boolean;
  }): Product[] => {
    let result = [...products];

    if (filters?.excludeInactive !== false) {
      result = result.filter(p => PUBLIC_STATUSES.includes(p.status));
    }

    if (filters?.type) {
      result = result.filter(p => p.type === filters.type);
    }
    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }

    return result;
  },

  // 🔍 ID 로 단일 조회
  findById: (id: number): Product | undefined => {
    return products.find(p => p.productId === id);
  },

  // ➕ 신규 상품 생성
  create: (data: Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>): Product => {
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
    const index = products.findIndex(p => p.productId === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return products[index];
  },

  // ❌ 상품 삭제 (실제 삭제 대신 상태 변경)
  deactivate: (id: number): Product | null => {
    return ProductStore.update(id, { status: 'INACTIVE' });
  },

  // 🔄 데이터 초기화 (E2E 테스트용)
  reset: () => {
    products = [
      {
        productId: 1,
        productName: '스프링 입문',
        description: '자바 스프링 프레임워크 기초 가이드',
        price: 18000,
        stock: 50,
        type: 'BOOK',
        imageUrl: 'https://example.com/images/spring-intro.jpg',
        status: 'SELLING',
        sellerId: MOCK_USERS.SELLER.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 2,
        productName: 'ABC',
        description: '책 설명입니다.',
        price: 10000,
        stock: 100,
        type: 'BOOK',
        imageUrl: 'https://example.com/images/book1.jpg',
        status: 'SELLING',
        sellerId: MOCK_USERS.SELLER.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        productId: 3,
        productName: '품절된 상품',
        description: '재고가 없는 상품입니다.',
        price: 25000,
        stock: 0,
        type: 'EBOOK',
        imageUrl: null,
        status: 'SOLD_OUT',
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