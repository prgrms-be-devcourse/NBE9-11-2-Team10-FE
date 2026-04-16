import { z } from 'zod';

export const registerRoleSchema = z.enum(['BUYER', 'SELLER']);

export const registerSchema = z.object({
  email: z.email('올바른 이메일 형식이 필요합니다.')
    .min(1, '이메일은 필수입니다.'),
    
  password: z.string()
    .min(8, '비밀번호는 8자 이상 입력해 주세요.')
    .max(20, '비밀번호는 20자 이하여야 합니다.')
    .regex(/[A-Za-z]/, '영문을 포함해야 합니다.')
    .regex(/\d/, '숫자를 포함해야 합니다.')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, '특수문자를 포함해야 합니다.'),
    
  name: z.string()
    .min(2, '이름은 2자 이상 입력해 주세요.')
    .max(50, '이름은 50자 이하여야 합니다.'),
    
  nickname: z.string()
    .min(2, '닉네임은 2자 이상 입력해 주세요.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .regex(/^[a-zA-Z0-9가-힣_]+$/, '영문/숫자/한글/_만 사용 가능합니다.'),
    
  phoneNumber: z.string()
    .regex(/^01[016789]-\d{3,4}-\d{4}$/, '전화번호 형식이 올바르지 않습니다. (010-0000-0000)'),
    
  roadAddress: z.string().min(1, '주소는 필수입니다.'),
  detailAddress: z.string().min(1, '상세주소는 필수입니다.'),
  
  role: registerRoleSchema,
});

export type RegisterRole = z.infer<typeof registerRoleSchema>;
// 타입 추론 (RegisterRequest 대체 가능)
export type RegisterRequest = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z
    .email('올바른 이메일 형식이 아닙니다.')
    .max(100, '이메일은 100자 이하여야 합니다.'),
  password: z.string()
    .min(8, '비밀번호는 8자 이상이어야 합니다.')
    .max(20, '비밀번호는 20자 이하여야 합니다.')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/, 
      '비밀번호는 영문과 숫자를 포함해야 합니다.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;