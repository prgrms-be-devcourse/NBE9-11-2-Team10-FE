// components/auth/RegisterForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useRegister } from '@/hooks/useRegister';
import { useDuplicateCheck } from '@/hooks/useDuplicateCheck';
import { useState } from 'react';
import { RegisterFormValues, registerSchema } from '@/schemas/auth.schema';

interface RegisterFormProps {
    role: 'BUYER' | 'SELLER';
}

const loadKakaoPostcodeScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
        // 이미 로딩된 경우
        if (window.kakao?.Postcode) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = '//t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Kakao Postcode script load failed'));
        document.head.appendChild(script);
    });
};

export default function RegisterForm({ role }: RegisterFormProps) {
    const router = useRouter();
    const { handleRegister } = useRegister();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        setError,
        clearErrors,
        setValue
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: { role },
    });

    // 중복체크 훅 사용 (email, nickname)
    const emailCheck = useDuplicateCheck('email');
    const nicknameCheck = useDuplicateCheck('nickname');

    const onSubmit = async (data: RegisterFormValues) => {
        setIsSubmitting(true);
        const { confirmPassword, baseAddress, detailAddress, ...submitData } = data;

        // 최종 주소: "기본주소 상세주소" 형식으로 결합
        const fullAddress = `${baseAddress} ${detailAddress}`.trim();

        const result = await handleRegister({
            ...submitData,
            address: fullAddress,
        });
        setIsSubmitting(false);

        if (result.success) {
            if (role === 'SELLER') {
                alert('판매자 가입이 완료되었습니다. 관리자 승인 후 이용 가능합니다.');
                router.push('/auth/pending');
            } else {
                alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
                router.push('/login');
            }
        } else {
            // BE에서 내려준 에러 코드에 따른 처리
            if (result.code === 'F-3') { // 중복
                alert(result.error);
            } else {
                alert(result.error);
            }
        }
    };

    const handleSearchAddress = async () => {
        try {
            await loadKakaoPostcodeScript();

            new window.kakao.Postcode({
                oncomplete: function (data) {
                    // 👇 카카오 예제의 주소 조합 로직 (빌딩명, 공동주택 처리)
                    let extraRoadAddr = '';

                    // 법정동명이 있을 경우 추가 (동/로/가로 끝나는 경우)
                    if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                        extraRoadAddr += data.bname;
                    }
                    // 건물명이 있고 공동주택일 경우 추가
                    if (data.buildingName !== '' && data.apartment === 'Y') {
                        extraRoadAddr += (extraRoadAddr !== '' ? `, ${data.buildingName}` : data.buildingName);
                    }
                    // 참고항목 괄호 처리
                    if (extraRoadAddr !== '') {
                        extraRoadAddr = ` (${extraRoadAddr})`;
                    }

                    // 👇 React Hook Form 으로 값 설정
                    const fullBaseAddress = data.roadAddress + extraRoadAddr;

                    setValue('baseAddress', fullBaseAddress, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                    });

                    // 🔹 우편번호도 필요하면 함께 저장
                    // setValue('postcode', data.zonecode);
                },
                width: '100%',
                height: '100%',
            }).open();

        } catch (error) {
            console.error('주소 검색 로딩 실패:', error);
            alert('주소 검색 서비스를 불러오지 못했습니다.');
        }
    };


    return (
        <div className="w-full max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">회원가입</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* 이메일 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            {...register('email')}
                            className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                            placeholder="example@email.com"
                        />
                        <button
                            type="button"
                            onClick={() => emailCheck.trigger(watch('email'))}
                            disabled={!emailCheck.isAvailable && emailCheck.isChecked} // 중복이면 비활성화
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 whitespace-nowrap disabled:opacity-50"
                        >
                            {emailCheck.isChecked ? (emailCheck.isAvailable ? '사용 가능' : '중복 확인') : '중복 확인'}
                        </button>
                    </div>
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
                    {emailCheck.message && <p className={`mt-1 text-xs ${emailCheck.isAvailable ? 'text-green-600' : 'text-red-600'}`}>{emailCheck.message}</p>}
                </div>

                {/* 비밀번호 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                    <input
                        type="password"
                        {...register('password')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
                </div>

                {/* 비밀번호 확인 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                    <input
                        type="password"
                        {...register('confirmPassword')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
                </div>

                {/* 이름 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                        type="text"
                        {...register('name')}
                        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                {/* 닉네임 */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            {...register('nickname')}
                            className={`flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.nickname ? 'border-red-500' : 'border-gray-300'}`}
                        />
                        <button
                            type="button"
                            onClick={() => nicknameCheck.trigger(watch('nickname'))}
                            disabled={!nicknameCheck.isAvailable && nicknameCheck.isChecked}
                            className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700 whitespace-nowrap disabled:opacity-50"
                        >
                            {nicknameCheck.isChecked ? (nicknameCheck.isAvailable ? '사용 가능' : '중복 확인') : '중복 확인'}
                        </button>
                    </div>
                    {errors.nickname && <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>}
                    {nicknameCheck.message && <p className={`mt-1 text-xs ${nicknameCheck.isAvailable ? 'text-green-600' : 'text-red-600'}`}>{nicknameCheck.message}</p>}
                </div>

                {/* 🔥 주소 섹션: 기본주소 + 상세주소 분리 */}
                <div className="space-y-4">
                    {/* 기본주소 (검색) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            주소 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                {...register('baseAddress')}
                                readOnly
                                className="flex-1 px-3 py-2 border rounded-md bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                                placeholder="주소 검색 버튼을 눌러주세요"
                                onClick={handleSearchAddress}
                            />
                            <button
                                type="button"
                                onClick={handleSearchAddress}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap transition-colors"
                            >
                                주소 검색
                            </button>
                        </div>
                        {errors.baseAddress && (
                            <p className="mt-1 text-xs text-red-500">{errors.baseAddress.message}</p>
                        )}
                    </div>

                    {/* 상세주소 (직접 입력) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            상세주소 <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            {...register('detailAddress')}
                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none ${errors.detailAddress ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="동/호수, 층수, 호실 등을 입력해주세요 (예: 101동 1502호)"
                        />
                        {errors.detailAddress && (
                            <p className="mt-1 text-xs text-red-500">{errors.detailAddress.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            예: 101동 1502호, 3층, 지하실, 오피스텔 A동 805호
                        </p>
                    </div>
                </div>

                {/* 가입하기 버튼 */}
                <button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className="w-full py-3 mt-4 text-lg font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isSubmitting ? '처리 중...' : '가입하기'}
                </button>
            </form>
        </div>
    );
}