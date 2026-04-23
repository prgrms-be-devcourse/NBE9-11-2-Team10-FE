// e2e/mocks/auth.routes.ts
import { Router, Request, Response as ExpressResponse, NextFunction } from 'express';
import { MOCK_USERS } from '../lib/mock-user-data';
import { createErrorResponse } from '../lib/mock-common-data';
import { z } from 'zod';

const router = Router();

interface RegisterRequestBody {
  email?: string;
  password?: string;
  name?: string;
  nickname?: string;
  phoneNumber?: string;
  roadAddress?: string;
  detailAddress?: string;
  address?: string;  // 기존 코드 호환용
  role?: 'BUYER' | 'SELLER';
}

const validateRegisterRequest = (req: Request, res: ExpressResponse, next: NextFunction) => {
  const body = req.body as RegisterRequestBody;
  
  const { email, password, name, nickname, phoneNumber, address, role } = body;
  
  const errors: Array<{ field: string; message: string }> = [];

  // 이메일 검증
  if (!email || typeof email !== 'string') {
    errors.push({ field: 'email', message: '이메일은 필수입니다.' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: '올바른 이메일 형식이 필요합니다.' });
  }

  // 비밀번호 검증 (Zod schema 와 동일)
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: '비밀번호는 필수입니다.' });
  } else {
    if (password.length < 8) errors.push({ field: 'password', message: '비밀번호는 8자 이상 입력해 주세요.' });
    if (password.length > 20) errors.push({ field: 'password', message: '비밀번호는 20자 이하여야 합니다.' });
    if (!/[A-Za-z]/.test(password)) errors.push({ field: 'password', message: '영문을 포함해야 합니다.' });
    if (!/\d/.test(password)) errors.push({ field: 'password', message: '숫자를 포함해야 합니다.' });
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push({ field: 'password', message: '특수문자를 포함해야 합니다.' });
    }
  }

  // 이름 검증
  if (!name || typeof name !== 'string') {
    errors.push({ field: 'name', message: '이름은 필수입니다.' });
  } else {
    if (name.length < 2) errors.push({ field: 'name', message: '이름은 2자 이상 입력해 주세요.' });
    if (name.length > 50) errors.push({ field: 'name', message: '이름은 50자 이하여야 합니다.' });
  }

  // 닉네임 검증
  if (!nickname || typeof nickname !== 'string') {
    errors.push({ field: 'nickname', message: '닉네임은 필수입니다.' });
  } else {
    if (nickname.length < 2) errors.push({ field: 'nickname', message: '닉네임은 2자 이상 입력해 주세요.' });
    if (nickname.length > 20) errors.push({ field: 'nickname', message: '닉네임은 20자 이하여야 합니다.' });
    if (!/^[a-zA-Z0-9가-힣_]+$/.test(nickname)) {
      errors.push({ field: 'nickname', message: '영문/숫자/한글/_만 사용 가능합니다.' });
    }
  }

  // 전화번호 검증
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    errors.push({ field: 'phoneNumber', message: '전화번호는 필수입니다.' });
  } else if (!/^01[016789]-\d{3,4}-\d{4}$/.test(phoneNumber)) {
    errors.push({ field: 'phoneNumber', message: '전화번호 형식이 올바르지 않습니다. (010-0000-0000)' });
  }

  // 주소 검증
  if (!address || typeof address !== 'string' || address.trim() === '') {
    errors.push({ field: 'address', message: '주소는 필수입니다.' });
  }

  // 역할 검증
  if (!role || !['BUYER', 'SELLER'].includes(role)) {
    errors.push({ field: 'role', message: '올바른 회원 유형을 선택해 주세요.' });
  }

  // 검증 실패 시 에러 응답
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      detail: '입력 정보를 확인해 주세요.',
      errorCode: 'VALIDATION_FAILED',
      validationErrors: errors,
      status: 400,
    });
  }

  next(); // 검증 통과 시 다음 핸들러로
};

// ✅ 중복 체크 전용 미들웨어 (별도 엔드포인트용)
const checkDuplicate = (type: 'EMAIL' | 'NICKNAME', value: string): boolean => {
  const targets = [
    MOCK_USERS.DUPLICATE.email,
    MOCK_USERS.DUPLICATE.nickname,
    MOCK_USERS.BUYER.email,
    MOCK_USERS.BUYER.nickname,
    MOCK_USERS.SELLER.email,
    MOCK_USERS.SELLER.nickname,
  ];
  return targets.includes(value);
};

// ✅ POST /register - 검증 미들웨어 적용
router.post('/register', validateRegisterRequest, (req: Request, res: ExpressResponse) => {
  const { email, nickname } = req.body;

  // 1. 이메일 중복 체크
  if (checkDuplicate('EMAIL', email)) {
    return res.status(409).json(
      createErrorResponse(409, 'USER_002', '이미 사용 중인 이메일입니다.', '/api/v1/auth/register')
    );
  }

  // 2. 닉네임 중복 체크 (선택사항: 서버에서 닉네임도 중복 체크한다고 가정)
  if (nickname && checkDuplicate('NICKNAME', nickname)) {
    return res.status(409).json(
      createErrorResponse(409, 'USER_003', '이미 사용 중인 닉네임입니다.', '/api/v1/auth/register')
    );
  }

  // 3. 성공 응답
  return res.status(201).json({
    success: true,
    data: {
      id: Math.floor(Math.random() * 10000) + 1000,
      email,
      nickname,
      createdAt: new Date().toISOString(),
    },
  });
});

// ✅ GET /check-duplicate - 기존 로직 유지 + 닉네임 지원 강화
router.get('/check-duplicate', (req: Request, res: ExpressResponse) => {
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

  if (rawType === 'EMAIL') {
    const emailSchema = z.email('올바른 이메일 형식이 필요합니다.');
    
    const parseResult = emailSchema.safeParse(value);
    if (!parseResult.success) {
      return res.status(400).json(
        createErrorResponse(400, 'INVALID_FORMAT', parseResult.error.issues[0].message, '/api/v1/auth/check-duplicate')
      );
    }
  }
  const isDuplicate = checkDuplicate(rawType as 'EMAIL' | 'NICKNAME', value);

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