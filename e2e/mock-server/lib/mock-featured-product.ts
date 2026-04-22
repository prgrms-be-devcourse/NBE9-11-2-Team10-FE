import { Product, ProductStore } from "./mock-product-data";


export interface FeaturedProduct {
  productId: string; // UUID
  productName: string; // 최대 100 자
  thumbnailUrl: string; // URL
  price: number;
  nickname: string;
  discountRate?: number; // 0~100
  isSoldOut: boolean;
  displayOrder: number; // 1~10
  sellerId: string;
}
// ============================================================================
// 🔄 Product → FeaturedProduct 변환 헬퍼
// ============================================================================
export const toFeaturedProduct = (
  product: Product,
  order: number
): FeaturedProduct => ({
  productId: `${product.productId}`, // number → string 변환
  productName: product.productName,
  thumbnailUrl: product.imageUrl ?? "https://example.com/images/no-image.png",
  price: product.price,
  nickname: product.nickname,
  discountRate: product.stock > 0 && product.price > 0
    ? Math.min(100, Math.floor(Math.random() * 30)) // mock: 0~30% 랜덤 할인
    : 0,
  isSoldOut: product.stock <= 0 || product.status === "SOLD_OUT",
  displayOrder: order, // 1~10 범위에서 외부에서 전달받거나 랜덤 지정
  sellerId: product.sellerId.toString(), // number → string 변환
});

// ============================================================================
// 🛠️ FeaturedProduct Store 헬퍼
// ============================================================================

export const FeaturedProductStore = {
  // 🔍 판매자별 강조 상품 조회 (ProductStore 에서 필터링 후 변환)
  findBySellerId: (sellerId: string): FeaturedProduct[] => {
    // 1. ProductStore 에서 공개 가능한 상품만 조회
    const products = ProductStore.findAll()
      .filter((p) => p.sellerId.toString() === sellerId)
      .slice(0, 10); // 최대 10 개


    // 2. FeaturedProduct 형태로 변환 + displayOrder 부여
    return products.map((product, index) => toFeaturedProduct(product, index + 1)
    );
  },

  // 🔍 단일 상품 조회 (productId 가 string 이므로 변환 처리)
  findById: (productId: string): FeaturedProduct | undefined => {
    // "prod-123" → 123 으로 파싱
    const numericId = parseInt(productId.replace("prod-", ""), 10);
    if (isNaN(numericId)) return undefined;

    const product = ProductStore.findById(numericId);
    if (!product) return undefined;

    return toFeaturedProduct(product, 1); // order 는 임의 지정
  },

  // ➕ 강조 상품 등록 (실제로는 Product 생성/수정을 트리거)
  // ⚠️ mock 환경에서는 단순 변환만 수행, 실제 로직은 서버에서 처리
  upsert: (data: FeaturedProduct): FeaturedProduct => {
    // productId 를 number 로 역변환
    const numericId = parseInt(data.productId.replace("prod-", ""), 10);

    // ProductStore 에 반영 (필요한 필드만 매핑)
    const productUpdate = {
      productId: numericId,
      productName: data.productName,
      price: data.price,
      nickname: data.nickname,
      stock: data.isSoldOut ? 0 : 10, // mock: 재고 단순화
      status: data.isSoldOut ? ("SOLD_OUT" as const) : ("SELLING" as const),
      imageUrl: data.thumbnailUrl !== "https://example.com/images/no-image.png"
        ? data.thumbnailUrl
        : null,
      sellerId: parseInt(data.sellerId, 10),
      type: "BOOK" as const, // mock: 기본값
    };

    // 기존 상품이 있으면 업데이트, 없으면 생성
    const existing = ProductStore.findById(numericId);
    const result = existing
      ? ProductStore.update(numericId, productUpdate)
      : ProductStore.create({
        ...productUpdate,
      });

    if (!result) return data;
    return toFeaturedProduct(result, data.displayOrder);
  },

  // ❌ 강조 상품 해제 = Product 를 INACTIVE 로 전환 (소프트 삭제)
  remove: (productId: string): boolean => {
    const numericId = parseInt(productId.replace("prod-", ""), 10);
    return ProductStore.deactivate(numericId) !== null;
  },

  // 🔄 데이터 초기화 (ProductStore 에 위임)
  reset: () => {
    ProductStore.reset();
  },
};

