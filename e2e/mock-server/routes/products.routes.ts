// e2e/mock-server/routes/products.routes.ts
import { Router, Request, Response } from 'express';
import { createErrorResponse } from '../lib/mock-common-data';
import { ProductStore, PUBLIC_STATUSES, VALID_TYPES } from '../lib/mock-product-data';

export const router = Router();

// ============================================================================
// 🔍 헬퍼: 쿼리 파라미터 안전하게 파싱 (ParsedQs 대응)
// ============================================================================
const parseQuery = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value.trim() || undefined;
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') {
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
router.get('/', (req: Request, res: Response) => {
  // ✅ 쿼리 파라미터 추출
  const page = parsePositiveInt(req.query.page, 0);
  const size = Math.min(parsePositiveInt(req.query.size, 10), 100); // 최대 100
  const typeFilter = parseQuery(req.query.type);
  const statusFilter = parseQuery(req.query.status);

  // ✅ 페이지/사이즈 검증
  if (page < 0) {
    return res.status(400).json(
      createErrorResponse(
        400,
        'CONSTRAINT_VIOLATION',
        '입력값 검증에 실패했습니다.',
        '/api/v1/products',
        { detail: 'page 는 0 이상의 정수여야 합니다.' }
      )
    );
  }
  if (size < 1 || size > 100) {
    return res.status(400).json(
      createErrorResponse(
        400,
        'CONSTRAINT_VIOLATION',
        '입력값 검증에 실패했습니다.',
        '/api/v1/products',
        { detail: 'size 는 1~100 사이의 정수여야 합니다.' }
      )
    );
  }

  // ✅ enum 필터 검증
  if (typeFilter && !VALID_TYPES.includes(typeFilter as any)) {
    return res.status(400).json(
      createErrorResponse(
        400,
        'TYPE_MISMATCH',
        '입력값 검증에 실패했습니다.',
        '/api/v1/products',
        { detail: `타입 변환 실패: 매개변수 'type' 의 값 '${typeFilter}' 이 (가) 올바르지 않습니다.` }
      )
    );
  }
  if (statusFilter && !PUBLIC_STATUSES.includes(statusFilter as any)) {
    return res.status(400).json(
      createErrorResponse(
        400,
        'TYPE_MISMATCH',
        '입력값 검증에 실패했습니다.',
        '/api/v1/products',
        { detail: `타입 변환 실패: 매개변수 'status' 의 값 '${statusFilter}' 이 (가) 올바르지 않습니다.` }
      )
    );
  }

  // ✅ 데이터 조회 (필터링 적용)
  const filtered = ProductStore.findAll({
    type: typeFilter as any,
    status: statusFilter as any,
    excludeInactive: true, // 공용 조회에서는 INACTIVE 제외
  });

  // ✅ 페이징
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size);
  const startIndex = page * size;
  const paginated = filtered.slice(startIndex, startIndex + size);

  // ✅ 응답 포맷팅 (목록 응답: description, stock 제외)
  const content = paginated.map(p => ({
    productId: p.productId,
    productName: p.productName,
    price: p.price,
    imageUrl: p.imageUrl,
    type: p.type,
    status: p.status,
  }));

  return res.status(200).json({
    content,
    page,
    size,
    totalElements,
    totalPages,
  });
});

// ============================================================================
// 🔹 GET /:productId - 상품 상세 조회
// ============================================================================
router.get('/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;

  // ✅ ID 형식 검증
  const id = Number(productId);
  if (isNaN(id) || !Number.isInteger(id) || id < 1) {
    return res.status(400).json(
      createErrorResponse(
        400,
        'TYPE_MISMATCH',
        '타입 변환 실패: 매개변수 값이 올바르지 않습니다.',
        `/api/v1/products/${productId}`,
        { detail: `'productId' 의 값 '${productId}' 이 (가) 올바르지 않습니다.` }
      )
    );
  }

  // ✅ 상품 조회 (공용: INACTIVE 는 404 처리)
  const product = ProductStore.findById(id);
  
  if (!product || product.status === 'INACTIVE') {
    return res.status(404).json(
      createErrorResponse(
        404,
        'PRODUCT_001',
        '상품을 찾을 수 없습니다.',
        `/api/v1/products/${productId}`
      )
    );
  }

  // ✅ 상세 응답 (description, stock 포함)
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