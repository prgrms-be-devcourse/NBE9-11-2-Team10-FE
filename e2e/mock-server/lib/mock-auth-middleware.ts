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
// 🔍 헬퍼: 헤더에서 사용자 ID 추출
// ============================================================================
const getMockUserId = (req: Request): string | null => {
  // E2E 테스트용: X-Mock-User-Id 헤더 우선
  const headerId = req.headers['x-mock-user-id'];
  if (typeof headerId === 'string') return headerId;
  
  // fallback: 쿠키 (필요시 확장)
  const cookieId = req.cookies?.mockUserId;
  if (typeof cookieId === 'string') return cookieId;
  
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