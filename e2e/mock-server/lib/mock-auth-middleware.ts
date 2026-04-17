// e2e/mock-server/lib/mock-auth-middleware.ts
import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from './mock-common-data';
import { MOCK_USERS, MockUser } from './mock-user-data';

// ============================================================================
// 📦 Request 확장: 인증된 사용자 정보 첨부
// ============================================================================
declare global {
  namespace Express {
    interface Request {
      mockUser?: MockUser;
    }
  }
}

// ============================================================================
// 🔍 헬퍼: 헤더/쿠키 에서 사용자 ID 추출 (accessToken 지원 추가)
// ============================================================================
const getMockUserId = (req: Request): string | null => {
  // ✅ 1순위: 테스트용 헤더 (명시적)
  const e2eHeader = req.headers['x-e2e-user-id'];
  if (typeof e2eHeader === 'string') return e2eHeader;
  
  const headerId = req.headers['x-mock-user-id'];
  if (typeof headerId === 'string') return headerId;
  
  // ✅ 2순위: 실제 로그인 플로우의 accessToken 쿠키 (단순 형식 파싱)
  const accessToken = req.cookies?.accessToken;
  if (accessToken && typeof accessToken === 'string' && accessToken.startsWith('mock_access_')) {
    // 🔹 토큰 형식: "mock_access_{userId}_{timestamp}"
    // 예: "mock_access_1002_1704067200000"
    const parts = accessToken.split('_');
    if (parts.length >= 3) {
      const userId = parts[2];  // "1002" 추출
      console.log(`✅ [getMockUserId] Parsed userId ${userId} from accessToken`);
      return userId;
    }
  }
  
  // ✅ 3순위: 기존 테스트용 쿠키 (하위 호환)
  const cookieId = req.cookies?.mockUserId;
  if (typeof cookieId === 'string') return cookieId;
  
  // ❌ 인증 정보 없음
  console.log('❌ [getMockUserId] No valid auth credentials found');
  console.log('📦 Debug - cookies:', req.cookies);
  console.log('📦 Debug - cookie header:', req.headers['cookie']);
  return null;
};

// ============================================================================
// 🔐 인증 미들웨어: 로그인 여부만 확인
// ============================================================================
export const mockAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const userId = getMockUserId(req);

  if (!userId) {
    return res.status(401).json(
      createErrorResponse(
        401,
        'AUTH_REQUIRED',
        '인증이 필요합니다.',
        req.path
      )
    );
  }

  const user = Object.values(MOCK_USERS).find(u => u.id.toString() === userId);

  if (!user) {
    return res.status(401).json(
      createErrorResponse(
        401,
        'USER_NOT_FOUND',
        '존재하지 않는 사용자입니다.',
        req.path
      )
    );
  }

  // ✅ 인증 성공: 사용자 정보를 request 에 첨부
  req.mockUser = user;
  next();
};

// ============================================================================
// 🛡️ 인가 미들웨어: 판매자 권한 확인
// ============================================================================
export const mockSellerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  mockAuthMiddleware(req, res, () => {
    const user = req.mockUser;

    if (user?.role !== 'SELLER') {
      return res.status(403).json(
        createErrorResponse(
          403,
          'FORBIDDEN',
          '판매자만 접근할 수 있습니다.',
          req.path
        )
      );
    }
    next();
  });
};

// ============================================================================
// 🔐 인가 미들웨어: 구매자 권한 확인 (향후 확장용)
// ============================================================================
export const mockBuyerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  mockAuthMiddleware(req, res, () => {
    const user = req.mockUser;

    if (user?.role !== 'BUYER') {
      return res.status(403).json(
        createErrorResponse(
          403,
          'FORBIDDEN',
          '구매자만 접근할 수 있습니다.',
          req.path
        )
      );
    }
    next();
  });
};

// ============================================================================
// 🎯 소유자 검증 헬퍼: 본인 리소스 여부 확인
// ============================================================================
export const verifyOwnership = (
  req: Request,
  res: Response,
  resourceOwnerId: number,
  resourcePath: string
): boolean => {
  const user = req.mockUser;
  
  if (!user) {
    res.status(401).json(
      createErrorResponse(401, 'AUTH_REQUIRED', '인증이 필요합니다.', resourcePath)
    );
    return false;
  }

  // 판매자는 본인 상품만 수정/삭제 가능
  if (user.role === 'SELLER' && resourceOwnerId !== user.id) {
    res.status(403).json(
      createErrorResponse(
        403,
        'FORBIDDEN',
        '본인 상품만 관리할 수 있습니다.',
        resourcePath
      )
    );
    return false;
  }

  return true;
};