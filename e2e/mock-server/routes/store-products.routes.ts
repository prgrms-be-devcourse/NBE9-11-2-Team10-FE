// e2e/mock-server/routes/store-products.routes.ts
import { Router, Request, Response } from "express";
import {
  createErrorResponse,
  ProblemDetailResponse,
} from "../lib/mock-common-data";
import {
  mockSellerMiddleware,
  verifyOwnership,
} from "../lib/mock-auth-middleware";
import {
  ProductStore,
  VALID_TYPES,
  VALID_STATUSES,
  Product,
} from "../lib/mock-product-data";
import { MOCK_SELLER } from "../../test-case/product/fixtures/product-fixture";

export const router = Router();

// ============================================================================
// 🔍 헬퍼: URL 형식 검증
// ============================================================================
const isValidUrl = (url: string): boolean => {
  if (!url) return true; // null/undefined 는 허용
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// ============================================================================
// ✅ 검증: 상품 생성 요청
// ============================================================================
const validateProductCreate = (
  body: any,
  path: string,
): ProblemDetailResponse | null => {
  const errors: Array<{ field: string; message: string }> = [];

  if (
    !body.productName ||
    typeof body.productName !== "string" ||
    body.productName.trim() === ""
  ) {
    errors.push({ field: "productName", message: "상품명은 필수입니다." });
  } else if (body.productName.length < 1 || body.productName.length > 100) {
    errors.push({
      field: "productName",
      message: "상품명은 1~100자 이내여야 합니다.",
    });
  }

  if (body.price === undefined || body.price === null) {
    errors.push({ field: "price", message: "가격은 필수입니다." });
  } else if (
    typeof body.price !== "number" ||
    body.price < 0 ||
    !Number.isInteger(body.price)
  ) {
    errors.push({
      field: "price",
      message: "가격은 0 이상의 정수여야 합니다.",
    });
  }

  if (body.stock === undefined || body.stock === null) {
    errors.push({ field: "stock", message: "재고는 필수입니다." });
  } else if (
    typeof body.stock !== "number" ||
    body.stock < 0 ||
    !Number.isInteger(body.stock)
  ) {
    errors.push({
      field: "stock",
      message: "재고는 0 이상의 정수여야 합니다.",
    });
  }

  if (!body.type || !VALID_TYPES.includes(body.type)) {
    errors.push({
      field: "type",
      message: `상품 종류는 ${VALID_TYPES.join(", ")} 중 하나여야 합니다.`,
    });
  }

  if (
    body.imageUrl !== undefined &&
    body.imageUrl !== null &&
    body.imageUrl !== ""
  ) {
    if (typeof body.imageUrl !== "string" || !isValidUrl(body.imageUrl)) {
      errors.push({
        field: "imageUrl",
        message: "올바른 이미지 URL 형식이어야 합니다.",
      });
    }
  }

  if (errors.length > 0) {
    return {
      ...createErrorResponse(
        400,
        "VALIDATION_FAILED",
        "입력값 검증에 실패했습니다.",
        path,
      ),
      validationErrors: errors,
    };
  }
  return null;
};

// ============================================================================
// ✅ 검증: 상품 수정 요청
// ============================================================================
const validateProductUpdate = (
  body: any,
  path: string,
): ProblemDetailResponse | null => {
  const errors: Array<{ field: string; message: string }> = [];

  // --------------------------------------------------------------------------
  // 🔹 필수 필드 검증 (누락 시 에러)
  // --------------------------------------------------------------------------

  // ✅ productName: 필수, 1~100자
  if (body.productName === undefined || body.productName === null) {
    errors.push({ field: "productName", message: "상품명은 필수입니다." });
  } else if (typeof body.productName !== "string") {
    errors.push({
      field: "productName",
      message: "상품명은 문자열이어야 합니다.",
    });
  } else {
    const trimmed = body.productName.trim();
    if (trimmed.length < 1) {
      errors.push({
        field: "productName",
        message: "상품명은 1자 이상이어야 합니다.",
      });
    } else if (trimmed.length > 100) {
      errors.push({
        field: "productName",
        message: "상품명은 100자를 초과할 수 없습니다.",
      });
    }
  }

  // ✅ price: 필수, 1 이상의 정수
  if (body.price === undefined || body.price === null) {
    errors.push({ field: "price", message: "가격은 필수입니다." });
  } else if (typeof body.price !== "number") {
    errors.push({ field: "price", message: "가격은 숫자여야 합니다." });
  } else if (!Number.isInteger(body.price)) {
    errors.push({ field: "price", message: "가격은 정수여야 합니다." });
  } else if (body.price < 1) {
    errors.push({ field: "price", message: "가격은 1 이상이어야 합니다." });
  }

  // ✅ stock: 필수, 0 이상의 정수 (재고는 0 가능 = 품절 상태 표현)
  if (body.stock === undefined || body.stock === null) {
    errors.push({ field: "stock", message: "재고는 필수입니다." });
  } else if (typeof body.stock !== "number") {
    errors.push({ field: "stock", message: "재고는 숫자여야 합니다." });
  } else if (!Number.isInteger(body.stock)) {
    errors.push({ field: "stock", message: "재고는 정수여야 합니다." });
  } else if (body.stock < 0) {
    errors.push({ field: "stock", message: "재고는 0 이상이어야 합니다." });
  }

  // ✅ type: 필수, "BOOK" | "EBOOK"
  if (body.type === undefined || body.type === null) {
    errors.push({ field: "type", message: "상품 유형은 필수입니다." });
  } else if (!VALID_TYPES.includes(body.type)) {
    errors.push({
      field: "type",
      message: `상품 유형은 ${VALID_TYPES.join(", ")} 중 하나여야 합니다.`,
    });
  }

  // --------------------------------------------------------------------------
  // 🔹 선택 필드 검증 (존재할 경우만 유효성 검사)
  // --------------------------------------------------------------------------

  // ✅ description: 선택, 존재 시 1000자 이내
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== "string") {
      errors.push({
        field: "description",
        message: "설명은 문자열이어야 합니다.",
      });
    } else if (body.description.length > 1000) {
      errors.push({
        field: "description",
        message: "설명은 1000자를 초과할 수 없습니다.",
      });
    }
  }

  // ✅ imageUrl: 선택, 존재 시 유효한 URL 형식 또는 null/빈문자열
  if (
    body.imageUrl !== undefined &&
    body.imageUrl !== null &&
    body.imageUrl !== ""
  ) {
    if (typeof body.imageUrl !== "string") {
      errors.push({
        field: "imageUrl",
        message: "이미지 URL은 문자열이어야 합니다.",
      });
    } else if (!isValidUrl(body.imageUrl)) {
      errors.push({
        field: "imageUrl",
        message: "올바른 이미지 URL 형식이어야 합니다.",
      });
    }
  }

  // ✅ status: 선택, 존재 시 유효한 상태값 ("SELLING" | "SOLD_OUT" | "INACTIVE")
  if (body.status !== undefined && body.status !== null) {
    if (!VALID_STATUSES.includes(body.status)) {
      errors.push({
        field: "status",
        message: `상품 상태는 ${VALID_STATUSES.join(", ")} 중 하나여야 합니다.`,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 🔹 에러 응답 반환
  // --------------------------------------------------------------------------
  if (errors.length > 0) {
    return {
      ...createErrorResponse(
        400,
        "VALIDATION_FAILED",
        "입력값 검증에 실패했습니다.",
        path,
      ),
      validationErrors: errors,
    };
  }

  return null;
};

// ============================================================================
// 🔹 POST / - 상품 등록 (판매자 전용)
// ============================================================================
router.post("/", mockSellerMiddleware, (req: Request, res: Response) => {
  const validationError = validateProductCreate(
    req.body,
    "/api/v1/stores/me/products",
  );
  if (validationError) {
    return res.status(400).json(validationError);
  }

  const user = req.mockUser!;
  const { productName, price, stock, type, imageUrl, description } = req.body;

  const newProduct = ProductStore.create({
    productName: productName.trim(),
    description: description?.trim() || "",
    price,
    stock,
    type,
    imageUrl: imageUrl || null,
    status: "SELLING",
    sellerId: user.id,
    nickname: MOCK_SELLER.nickname, // 임시 값 !!
  });

  return res.status(201).json({
    productId: newProduct.productId,
    productName: newProduct.productName,
    description: newProduct.description,
    price: newProduct.price,
    stock: newProduct.stock,
    imageUrl: newProduct.imageUrl,
    type: newProduct.type,
    status: newProduct.status,
  });
});

// ============================================================================
// 🔹 PUT /:productId - 상품 수정 (판매자 전용)
// ============================================================================
router.put(
  "/:productId",
  mockSellerMiddleware,
  (req: Request, res: Response) => {
    const { productId } = req.params;
    const id = Number(productId);

    // ✅ ID 형식 검증
    if (isNaN(id) || !Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            "TYPE_MISMATCH",
            "타입 변환 실패: 매개변수 값이 올바르지 않습니다.",
            `/api/v1/stores/me/products/${productId}`,
          ),
        );
    }

    // ✅ 상품 존재 여부 확인
    const existing = ProductStore.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json(
          createErrorResponse(
            404,
            "PRODUCT_001",
            "상품을 찾을 수 없습니다.",
            `/api/v1/stores/me/products/${productId}`,
          ),
        );
    }

    // ✅ 본인 상품 여부 확인
    if (
      !verifyOwnership(
        req,
        res,
        existing.sellerId,
        `/api/v1/stores/me/products/${productId}`,
      )
    ) {
      return; // verifyOwnership 에서 응답 처리 완료
    }

    // ✅ 요청값 검증
    const validationError = validateProductUpdate(
      req.body,
      `/api/v1/stores/me/products/${productId}`,
    );
    if (validationError) {
      return res.status(400).json(validationError);
    }

    // ✅ 수정 적용
    const { productName, price, description, type, imageUrl, status, stock } =
      req.body;
    const updated = ProductStore.update(id, {
      productName: productName?.trim(),
      price,
      description: description !== undefined ? description.trim() : undefined,
      type,
      imageUrl: imageUrl !== undefined ? imageUrl || null : undefined,
      status,
      stock,
    });

    if (!updated) {
      return res
        .status(500)
        .json(
          createErrorResponse(
            500,
            "INTERNAL_ERROR",
            "상품 수정 중 오류가 발생했습니다.",
            `/api/v1/stores/me/products/${productId}`,
          ),
        );
    }

    return res.status(200).json({
      productId: updated.productId,
      productName: updated.productName,
      description: updated.description,
      price: updated.price,
      stock: updated.stock,
      imageUrl: updated.imageUrl,
      type: updated.type,
      status: updated.status,
    });
  },
);

// ============================================================================
// 🔹 PATCH /:productId/inactive - 상품 비활성화 (판매자 전용)
// ============================================================================
router.patch(
  "/:productId/inactive",
  mockSellerMiddleware,
  (req: Request, res: Response) => {
    const { productId } = req.params;
    const id = Number(productId);

    // ✅ ID 형식 검증
    if (isNaN(id) || !Number.isInteger(id) || id < 1) {
      return res
        .status(400)
        .json(
          createErrorResponse(
            400,
            "TYPE_MISMATCH",
            "타입 변환 실패: 매개변수 값이 올바르지 않습니다.",
            `/api/v1/stores/me/products/${productId}/inactive`,
          ),
        );
    }

    // ✅ 상품 존재 여부 확인
    const existing = ProductStore.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json(
          createErrorResponse(
            404,
            "PRODUCT_001",
            "상품을 찾을 수 없습니다.",
            `/api/v1/stores/me/products/${productId}/inactive`,
          ),
        );
    }

    // ✅ 본인 상품 여부 확인
    if (
      !verifyOwnership(
        req,
        res,
        existing.sellerId,
        `/api/v1/stores/me/products/${productId}/inactive`,
      )
    ) {
      return;
    }

    // ✅ 이미 비활성화된 상품 체크
    if (existing.status === "INACTIVE") {
      return res
        .status(409)
        .json(
          createErrorResponse(
            409,
            "PRODUCT_003",
            "이미 비활성화된 상품입니다.",
            `/api/v1/stores/me/products/${productId}/inactive`,
          ),
        );
    }

    // ✅ 상태 변경
    const deactivated = ProductStore.deactivate(id);
    if (!deactivated) {
      return res
        .status(500)
        .json(
          createErrorResponse(
            500,
            "INTERNAL_ERROR",
            "상품 비활성화 중 오류가 발생했습니다.",
            `/api/v1/stores/me/products/${productId}/inactive`,
          ),
        );
    }

    return res.status(200).json({
      productId: deactivated.productId,
      status: deactivated.status,
      message: "상품이 삭제되었습니다.",
    });
  },
);

// ============================================================================
// 🔹 [E2E 전용] DELETE /__reset - 데이터 초기화
// ============================================================================
router.delete("/__reset", (req: Request, res: Response) => {
  ProductStore.reset();
  return res.status(200).json({
    success: true,
    message: "Mock product data has been reset.",
    resetAt: new Date().toISOString(),
  });
});

export default router;
