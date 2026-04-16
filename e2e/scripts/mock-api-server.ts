// scripts/mock-api-server.ts (최종 간소화 버전)
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

// ✅ CORS 설정 (테스트 환경용)
app.use(cors({
  origin: [
    'http://localhost:3000',  // Next.js dev 서버
    'http://localhost:8080',  // Next.js custom 포트
    'http://127.0.0.1:3000',
  ],
  credentials: true,  // 쿠키/인증 헤더 허용 (필요시)
}));

app.use(express.json());

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

app.get('/api/v1/auth/check-duplicate', (req, res) => {
  // ✅ 1. 쿼리 파라미터 추출 + 타입 좁히기 (Type Narrowing)
  const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  const rawValue = Array.isArray(req.query.value) ? req.query.value[0] : req.query.value;

  // ✅ 2. type 파라미터 필수 + 타입 가드
  if (!rawType || typeof rawType !== 'string') {
    return res.status(400).json({
      detail: "필수 파라미터 누락: 'type'",
      instance: "/api/v1/auth/check-duplicate",
      status: 400,
      title: "Bad Request",
      type: "https://api.example.com/errors/PARAM_MISSING",
      errorCode: "PARAM_MISSING",
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ 3. type 값 도메인 검증 (타입 좁히기 활용)
  if (rawType !== 'EMAIL' && rawType !== 'NICKNAME') {
    return res.status(400).json({
      detail: `타입 변환 실패: 매개변수 'type'의 값 '${rawType}' 이(가) 올바르지 않습니다.`,
      instance: "/api/v1/auth/check-duplicate",
      status: 400,
      title: "Bad Request",
      type: "https://api.example.com/errors/TYPE_MISMATCH",
      errorCode: "TYPE_MISMATCH",
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ 4. value 파라미터 필수 + 문자열 타입 가드
  //    ⚠️ 여기서 !rawValue 체크를 먼저 해야 .trim() 에러 방지
  if (!rawValue || typeof rawValue !== 'string' || rawValue.trim() === '') {
    return res.status(400).json({
      detail: "checkDuplicate.value: 공백일 수 없습니다",
      instance: "/api/v1/auth/check-duplicate",
      status: 400,
      title: "Bad Request",
      type: "https://api.example.com/errors/CONSTRAINT_VIOLATION",
      errorCode: "CONSTRAINT_VIOLATION",
      timestamp: new Date().toISOString(),
    });
  }

  // ✅ 5. 이제야 안전하게 사용 가능 (TypeScript 가 string 으로 인식)
  const type = rawType as 'EMAIL' | 'NICKNAME';
  const value = rawValue.trim(); // ✅ trim() 호출 안전함

  // ✅ 6. 실제 중복 체크 로직
  if (value === 'duplicate@example.com' || value === '중복닉네임') {
    return res.json({ 
      success: true, 
      data: { type, value, available: false } 
    });
  }
  
  res.json({ 
    success: true, 
    data: { type, value, available: true } 
  });
});

app.listen(PORT, () => {
  console.log(`🎭 Mock API Server running on http://localhost:${PORT}`);
});