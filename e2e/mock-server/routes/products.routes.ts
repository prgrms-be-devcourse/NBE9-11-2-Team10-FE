// e2e/mock-server/routes/products.routes.ts
import { Router, Request, Response } from "express";
import { createErrorResponse } from "../lib/mock-common-data";
import {
  ProductStore,
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
  const userPage = parsePositiveInt(req.query.page, 1);
  const size = Math.min(parsePositiveInt(req.query.size, 10), 100);
  const typeFilter = parseQuery(req.query.type);
  const statusFilter = parseQuery(req.query.status);

  if (userPage < 1) {
    return res.status(400).json(
      createErrorResponse(
        400,
        "CONSTRAINT_VIOLATION",
        "입력값 검증에 실패했습니다.",
        "/api/v1/products",
        {
          detail: "page 는 1 이상의 정수여야 합니다.",
        },
      ),
    );
  }

  const internalPage = userPage - 1;

  // ✅ INACTIVE 는 ProductStore.findAll 에서 자동으로 제외됨
  const filtered = ProductStore.findAll({
    type: typeFilter as any,
    status: statusFilter as any,
  });

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size);
  const startIndex = internalPage * size;
  const paginated = filtered.slice(startIndex, startIndex + size);

  const content = paginated.map((p) => ({
    productId: p.productId,
    productName: p.productName,
    price: p.price,
    imageUrl: p.imageUrl,
    type: p.type,
    status: p.status,
  }));

  return res.status(200).json({
    content,
    page: userPage,
    size,
    totalElements,
    totalPages,
  });
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
