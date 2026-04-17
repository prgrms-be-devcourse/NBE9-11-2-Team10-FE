// e2e/mocks/auth.routes.ts
import { Router } from 'express';
import { MOCK_USERS } from '../lib/mock-user-data';
import { createErrorResponse } from '../lib/mock-common-data';

const router = Router();


// ✅ POST /register
router.post('/register', (req, res) => {
  const { email } = req.body;
  
  if (email === MOCK_USERS.DUPLICATE.email) {
    return res.status(409).json(
      createErrorResponse(409, 'USER_002', '이미 사용 중인 이메일입니다.', '/api/v1/auth/register')
    );
  }

  return res.status(200).json({
    success: true,
    user: {
      id: Math.floor(Math.random() * 10000) + 1000,
      email,
      createdAt: new Date().toISOString(),
    },
  });
});

// ✅ GET /check-duplicate
router.get('/check-duplicate', (req, res) => {
  const rawType = Array.isArray(req.query.type) ? req.query.type[0] : req.query.type;
  const rawValue = Array.isArray(req.query.value) ? req.query.value[0] : req.query.value;

  if (!rawType || typeof rawType !== 'string') {
    return res.status(400).json(
      createErrorResponse(400, 'PARAM_MISSING', "필수 파라미터 누락: 'type'", '/api/v1/auth/check-duplicate')
    );
  }

  if (rawType !== 'EMAIL' && rawType !== 'NICKNAME') {
    return res.status(400).json(
      createErrorResponse(400, 'TYPE_MISMATCH', `타입 변환 실패: '${rawType}'`, '/api/v1/auth/check-duplicate')
    );
  }

  if (!rawValue || typeof rawValue !== 'string' || rawValue.trim() === '') {
    return res.status(400).json(
      createErrorResponse(400, 'CONSTRAINT_VIOLATION', '값은 공백일 수 없습니다', '/api/v1/auth/check-duplicate')
    );
  }

  const value = rawValue.trim();
  const isDuplicate = value === MOCK_USERS.DUPLICATE.email || value === MOCK_USERS.DUPLICATE.nickname;

  res.json({ 
    success: true, 
    data: { type: rawType, value, available: !isDuplicate } 
  });
});

// ✅ POST /login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      ...createErrorResponse(400, 'VALIDATION_FAILED', '필수 입력값이 누락되었습니다.', '/api/v1/auth/login'),
      validationErrors: [
        !email && { field: 'email', message: '이메일을 입력해 주세요.' },
        !password && { field: 'password', message: '비밀번호를 입력해 주세요.' },
      ].filter(Boolean),
    });
  }

  const user = Object.values(MOCK_USERS).find(u => u.email === email);

  if (!user || user.password !== password) {
    return res.status(404).json(
      createErrorResponse(404, 'USER_004', '아이디 또는 비밀번호가 일치하지 않습니다.', '/api/v1/auth/login')
    );
  }

  // 🍪 쿠키 설정 (공통 유틸로 추출 가능)
  const isProd = process.env.NODE_ENV === 'production';
  const setAuthCookie = (name: string, value: string, path: string, sameSite: 'lax' | 'strict') => {
    res.cookie(name, value, {
      httpOnly: true,
      secure: isProd,
      sameSite,
      path,
      maxAge: name === 'accessToken' ? 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
    });
  };

  setAuthCookie('accessToken', `mock_access_${user.id}_${Date.now()}`, '/', 'lax');
  setAuthCookie('refreshToken', `mock_refresh_${user.id}_${Date.now()}`, '/api/v1/auth/refresh', 'strict');

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

// ✅ POST /logout
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  
  res.cookie('accessToken', '', { httpOnly: true, secure: isProd, sameSite: 'lax', path: '/', maxAge: 0 });
  res.cookie('refreshToken', '', { httpOnly: true, secure: isProd, sameSite: 'strict', path: '/api/v1/auth/refresh', maxAge: 0 });

  return res.status(200).json({
    message: "로그아웃이 완료되었습니다.",
    invalidatedAt: new Date().toISOString(),
  });
});

export default router;