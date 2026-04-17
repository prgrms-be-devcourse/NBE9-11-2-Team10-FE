// e2e/mock-server/mock-api-server.ts
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// 📦 도메인별 라우터 임포트
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';           // 공용: 상품 조회
import storeProductsRoutes from './routes/store-products.routes' // 판매자: 상품 관리
import debugRoutes from './routes/debug.routes';

const app = express();
const PORT = process.env.MOCK_PORT || 4000;

// ✅ 공통 미들웨어
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// 🛣️ 도메인별 라우터 마운팅 (명세서와 1:1 매핑)
app.use('/api/v1/auth', authRoutes);                    // 🔐 인증
app.use('/api/v1/products', productsRoutes);            // 📦 상품 조회 (공용)
app.use('/api/v1/stores/me/products', storeProductsRoutes); // 🏪 상품 관리 (판매자)
app.use('/api/v1/__debug', debugRoutes); // 인증 쿠키 테스트 용 (e2e 전용)

// 🚨 글로벌 에러 핸들러 (라우터 등록 후 마지막에)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Mock API Error]', err);
  res.status(500).json({ 
    type: 'https://api.example.com/errors/INTERNAL_ERROR',
    title: 'Internal Server Error',
    status: 500,
    detail: '서버 내부 오류가 발생했습니다.',
    errorCode: 'INTERNAL_ERROR',
    instance: req.path,
    timestamp: new Date().toISOString()
  });
});

// 🚀 서버 부팅
app.listen(PORT, () => {
  console.log(`🎭 Mock API Server: http://localhost:${PORT}`);
  console.log(`   ├─ POST /api/v1/auth/*`);
  console.log(`   ├─ GET  /api/v1/products/*`);
  console.log(`   ├─ CRUD /api/v1/stores/me/products/*`);
  console.log(`   └─ DEBUG /api/v1/__debug`);
});