// e2e/mock-server/routes/products.routes.ts
import { Router, Request, Response } from "express";
import { createErrorResponse } from "../lib/mock-common-data";
import {
  ProductStatus,
  ProductStore,
  ProductType,
  PUBLIC_STATUSES,
  VALID_TYPES,
} from "../lib/mock-product-data";

export const router = Router();

// ============================================================================
// 🔍 헬퍼: 쿼리 파라미터 안전하게 파싱 (ParsedQs 대응)
// ============================================================================
const parseQuery = (value: unknown): string | undefined => {
  if (typeof value === "string") return value.trim() || undefined;
  if (
    Array.isArray(value) &&
    value.length > 0 &&
    typeof value[0] === "string"
  ) {
    return value[0].trim() || undefined;
  }
  // ParsedQs 객체 등 복잡한 타입은 무시
  return undefined;
};

const parsePositiveInt = (value: unknown, fallback: number): number => {
  const str = parseQuery(value);
  if (str === undefined) return fallback;

  const num = parseInt(str, 10);
  return isNaN(num) || num < 0 ? fallback : num;
};

// ============================================================================
// 🔹 GET / - 상품 목록 조회 (페이징 + 필터)
// ============================================================================
router.get("/", (req: Request, res: Response) => {
  try {
    const { page, size, type, status, sellerId } = req.query;
    
    // 1. 기본 데이터 조회 (INACTIVE 제외)
    let result = ProductStore.findAll({
      type: type as ProductType,
      status: status as ProductStatus,
    });

    // ✅ [추가] sellerId 필터링 로직
    // 쿼리 파라미터로 sellerId 가 전달되면 해당 판매자의 상품만 필터링
    if (sellerId) {
      const numericSellerId = Number(sellerId);
      if (!isNaN(numericSellerId)) {
        result = result.filter((p) => p.sellerId === numericSellerId);
      }
    }

    // 2. 최신순 정렬 (createdAt 기준) - 강조 상품은 최신 제품이 나와야 하므로
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 3. 페이지네이션 적용
    const pageNum = Number(page) || 1;
    const pageSize = Math.min(Number(size) || 10, 100);
    const startIndex = (pageNum - 1) * pageSize;
    const paginated = result.slice(startIndex, startIndex + pageSize);

    return res.status(200).json({
      content: paginated,
      page: pageNum,
      size: pageSize,
      totalElements: result.length,
      totalPages: Math.ceil(result.length / pageSize),
    });
  } catch (error) {
    console.error("[GET /products] Error:", error);
    return res.status(500).json(
      createErrorResponse(500, "INTERNAL_ERROR", "상품 조회 중 오류가 발생했습니다.", "/api/v1/products")
    );
  }
});

// ============================================================================
// 🔹 GET /:productId - 상품 상세 조회
// ============================================================================
router.get("/:productId", (req: Request, res: Response) => {
  const { productId } = req.params;
  const id = Number(productId);

  if (isNaN(id) || !Number.isInteger(id) || id < 1) {
    return res.status(400).json(
      createErrorResponse(
        400,
        "TYPE_MISMATCH",
        "타입 변환 실패",
        `/api/v1/products/${productId}`,
        {
          detail: `'productId' 의 값 '${productId}' 이 (가) 올바르지 않습니다.`,
        },
      ),
    );
  }

  // ✅ ProductStore.findById 에서 INACTIVE 면 자동으로 undefined 반환
  const product = ProductStore.findById(id);

  // ❌ 존재하지 않거나 INACTIVE(삭제) 상태이면 둘 다 404
  if (!product) {
    return res
      .status(404)
      .json(
        createErrorResponse(
          404,
          "PRODUCT_001",
          "상품을 찾을 수 없습니다.",
          `/api/v1/products/${productId}`,
        ),
      );
  }

  return res.status(200).json({
    productId: product.productId,
    productName: product.productName,
    description: product.description,
    price: product.price,
    stock: product.stock,
    imageUrl: product.imageUrl,
    type: product.type,
    status: product.status,
  });
});

export default router;
