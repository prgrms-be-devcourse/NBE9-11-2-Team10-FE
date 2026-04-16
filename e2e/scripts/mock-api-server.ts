// scripts/mock-api-server.ts
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

const mockUsers = [
  {
    id: 1,
    email: 'success@example.com',
    password: 'TestPass123!', // 실제 운영환경에서는 절대 평문 저장 금지
    nickname: '길동이',
    role: 'BUYER' as const,
  },
];

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

// 🔐 로그인 엔드포인트
app.post('/api/v1/auth/login', (req, res) => {
  const { email, password } = req.body;

  res.setHeader('Content-Type', 'application/json');

  // 1. 필수 필드 검증
  if (!email || !password) {
    return res.status(400).json({
      detail: "필수 입력값이 누락되었습니다.",
      instance: "/api/v1/auth/login",
      status: 400,
      errorCode: "VALIDATION_FAILED",
      timestamp: new Date().toISOString(),
      validationErrors: [
        !email && { field: 'email', message: '이메일을 입력해 주세요.' },
        !password && { field: 'password', message: '비밀번호를 입력해 주세요.' },
      ].filter(Boolean),
    });
  }

  // 2. 사용자 조회
  const user = mockUsers.find(u => u.email === email);

  // 3. 사용자 없음 또는 비밀번호 불일치 → 404 (명세서 준수: 구분하지 않음)
  if (!user || user.password !== password) {
    return res.status(404).json({
      detail: "아이디 또는 비밀번호가 일치하지 않습니다.",
      instance: "/api/v1/auth/login",
      status: 404,
      title: "Not Found",
      type: "https://api.example.com/errors/USER_004",
      errorCode: "USER_004",
      timestamp: new Date().toISOString(),
    });
  }

  // 4. 로그인 성공

  const mockAccessToken = `mock_access_${user.id}_${Date.now()}`;
  const mockRefreshToken = `mock_refresh_${user.id}_${Date.now()}`;

  const isProd = process.env.NODE_ENV === 'production';
  
  // accessToken 쿠키
  res.cookie('accessToken', mockAccessToken, {
    httpOnly: true,
    secure: isProd,           // 로컬에서는 false, 운영에서는 true
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 1000,   // 1시간 (ms)
  });

  // refreshToken 쿠키
  res.cookie('refreshToken', mockRefreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',  // refresh 엔드포인트 전용 경로
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7일 (ms)
  });

  return res.status(200).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
    },
  });
});

app.post('/api/v1/auth/logout', (req, res) => {

  // 🍪 쿠키 무효화: Max-Age=0 으로 설정하여 브라우저에서 즉시 삭제
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,  // 👈 즉시 만료
  });

  res.cookie('refreshToken', '', {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: 0,  // 👈 즉시 만료
  });

  // ✅ 성공 응답
  return res.status(200).json({
    message: "로그아웃이 완료되었습니다.",
    invalidatedAt: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🎭 Mock API Server running on http://localhost:${PORT}`);
});