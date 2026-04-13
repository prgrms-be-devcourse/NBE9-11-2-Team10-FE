// schemas/auth.schema.ts
import { z } from 'zod';

// ✅ 회원가입 스키마
export const registerSchema = z.object({
    email: z
        .email('올바른 이메일 형식이 아닙니다.')
        .max(100, '이메일은 100자 이내여야 합니다.')
        .trim(),

    password: z
        .string()
        .min(8, '비밀번호는 8자 이상이어야 합니다.')
        .max(20, '비밀번호는 20자 이내여야 합니다.')
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
            '영문, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.'
        ),

    confirmPassword: z.string().min(8, '비밀번호를 다시 입력해주세요.'),

    name: z
        .string()
        .min(2, '이름은 2자 이상이어야 합니다.')
        .max(50, '이름은 50자 이내여야 합니다.'),

    nickname: z
        .string()
        .min(2, '닉네임은 2자 이상이어야 합니다.')
        .max(20, '닉네임은 20자 이내여야 합니다.')
        .regex(/^[a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]+$/, '닉네임은 영문, 숫자, 한글, _ 만 사용할 수 있습니다.')
        .trim(),

    address: z
        .string()
        .min(1, '주소를 입력해주세요.')
        .max(255, '주소는 255자 이내여야 합니다.'),

    role: z.enum(['BUYER', 'SELLER']).default('BUYER').optional(),
})
    .refine((data) => data.password === data.confirmPassword, {
        message: "비밀번호가 일치하지 않습니다.",
        path: ["confirmPassword"], // 오류가 표시될 필드 지정
    });

export type RegisterFormValues = z.infer<typeof registerSchema>;

// ✅ 로그인 스키마
export const loginSchema = z.object({
    identifier: z
        .string()
        .min(1, '이메일 또는 아이디를 입력해주세요.')
        .max(100),
    password: z.string().min(1, '비밀번호를 입력해주세요.'),
    targetRole: z.enum(['BUYER', 'SELLER', 'ADMIN']).default('BUYER'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;