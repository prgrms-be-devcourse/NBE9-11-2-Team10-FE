// scripts/mock-api-server.ts (최종 간소화 버전)
import express from 'express';

const app = express();
const PORT = 4000;

app.use(express.json());

// 🎯 필요한 엔드포인트만 정의 (catch-all 제거)
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'duplicate@example.com') {
    return res.status(409).json({
      detail: '이미 사용 중인 이메일입니다.',
      status: 409,
      errorCode: 'USER_002',
      timestamp: new Date().toISOString(),
    });
  }

  // 기본 성공 응답
  return res.status(200).json({
    success: true,
    user: {
      id: Math.floor(Math.random() * 10000) + 1000,
      email,
      createdAt: new Date().toISOString(),
    },
  });
});

app.listen(PORT, () => {
  console.log(`🎭 Mock API Server running on http://localhost:${PORT}`);
});