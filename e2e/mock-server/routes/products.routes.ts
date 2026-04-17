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
  // ✅ 1. 사용자 입력 파싱 (1-based)
  const userPage = parsePositiveInt(req.query.page, 1); // ✅ 기본값 1 로 변경
  const size = Math.min(parsePositiveInt(req.query.size, 10), 100);
  const typeFilter = parseQuery(req.query.type);
  const statusFilter = parseQuery(req.query.status);

  // ✅ 2. 검증 (1-based 기준)
  if (userPage < 1) {  // ✅ 0 이 아닌 1 부터 시작
    return res.status(400).json(
      createErrorResponse(
        400,
        'CONSTRAINT_VIOLATION',
        '입력값 검증에 실패했습니다.',
        '/api/v1/products',
        { detail: 'page 는 1 이상의 정수여야 합니다.' }  // ✅ 메시지 수정
      )
    );
  }

  // ✅ 3. 내부 로직용 변환: 1-based → 0-based
  const internalPage = userPage - 1;  // ⭐ 핵심: API 내부 처리용

  // ✅ 4. 데이터 조회 (기존 로직 동일)
  const filtered = ProductStore.findAll({
    type: typeFilter as any,
    status: statusFilter as any,
    excludeInactive: true,
  });

  // ✅ 5. 페이징 (내부 0-based 사용)
  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size);
  const startIndex = internalPage * size;  // ✅ internalPage 사용
  const paginated = filtered.slice(startIndex, startIndex + size);

  const content = paginated.map(p => ({
    productId: p.productId,
    productName: p.productName,
    price: p.price,
    imageUrl: p.imageUrl,
    type: p.type,
    status: p.status,
  }));

  // ✅ 6. 응답은 사용자 친화적 1-based 로 반환
  return res.status(200).json({
    content,
    page: userPage,      // ✅ 1-based 로 응답
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