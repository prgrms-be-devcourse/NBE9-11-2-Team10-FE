// e2e/mock-server/routes/debug.routes.ts
import { Router, Request, Response } from 'express';
import { PaymentScenarioStore } from '../lib/mock-payment-scenario';

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

// 🔹 [E2E 전용] 결제 시나리오 설정
router.post("/__e2e/set-payment-scenario", (req: Request, res: Response) => {
  const { scenario } = req.body;
  
  if (!scenario) {
    return res.status(400).json({ error: "scenario is required" });
  }
  
  PaymentScenarioStore.set(scenario);
  
  return res.status(200).json({ 
    success: true, 
    message: `Payment scenario set to: ${scenario}` 
  });
});

// 🔹 [E2E 전용] 결제 시나리오 초기화
router.post("/__e2e/reset-payment-scenario", (req: Request, res: Response) => {
  PaymentScenarioStore.reset();
  return res.status(200).json({ success: true, message: "Payment scenario reset" });
});

export default router;