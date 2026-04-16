// e2e/scripts/mock-api-server.ts
import express from 'express';
import cors from 'cors';
import authRoutes from '../mocks/auth.routes';

const app = express();
const PORT = 4000;

// ✅ 공통 미들웨어
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000'],
  credentials: true,
}));
app.use(express.json());

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Mock API Error]', err);
  res.status(500).json({ 
    detail: '서버 내부 오류가 발생했습니다.', 
    errorCode: 'INTERNAL_ERROR',
    timestamp: new Date().toISOString() 
  });
});

// ✅ 라우터 마운팅 (Prefix 로 네임스페이스 분리)
app.use('/api/v1/auth', authRoutes);

// ✅ 서버 부팅
app.listen(PORT, () => {
  console.log(`🎭 Mock API Server running on http://localhost:${PORT}`);
  console.log(`   └─ Auth routes: /api/v1/auth/*`);
});