// e2e/mock-server/routes/debug.routes.ts
import { Router, Request, Response } from 'express';

export const router = Router();

// 🔍 헤더/쿠키 포워딩 검증용 엔드포인트 (E2E 전용)
router.get('/headers', (req: Request, res: Response) => {
  if (process.env.NODE_ENV !== 'test' && process.env.E2E_MODE !== 'true') {
    return res.status(403).json({ error: 'Debug endpoint is disabled in production.' });
  }

  res.json({
    headers: req.headers,
    // Express 는 헤더를 소문자로 변환하므로 'cookie' 로 접근
    cookie: req.headers['cookie'] || null,
    timestamp: new Date().toISOString(),
  });
});

export default router;