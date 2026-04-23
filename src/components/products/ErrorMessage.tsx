// src/components/products/ErrorMessage.tsx
'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle, RefreshCw, ArrowLeft, LogIn } from 'lucide-react';

interface ErrorMessageProps {
  detail: string;
  errorCode: string;
  status: number;
  validationErrors?: Array<{ field: string; message: string }>;
}

export default function ErrorMessage({
  detail,
  errorCode,
  status,
  validationErrors,
}: ErrorMessageProps) {
  const router = useRouter();

  // ✅ 에러 코드별 설정 매핑
  const errorConfig: Record<string, { 
    title: string; 
    message: string; 
    icon: React.ReactNode;
    showRetry?: boolean;
    showLogin?: boolean;
    showBack?: boolean;
  }> = {
    // 클라이언트 에러
    'VALIDATION_FAILED': {
      title: '입력 오류',
      message: '요청 정보가 올바르지 않습니다. 아래 내용을 확인해 주세요.',
      icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
    },
    'UNAUTHORIZED': {
      title: '인증 필요',
      message: '로그인이 필요한 서비스입니다.',
      icon: <LogIn className="w-6 h-6 text-blue-500" />,
      showLogin: true,
    },
    'FORBIDDEN': {
      title: '접근 권한 없음',
      message: '이 페이지에 접근할 권한이 없습니다.',
      icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
      showBack: true,
    },
    'NOT_FOUND': {
      title: '찾을 수 없음',
      message: '요청한 상품을 찾을 수 없습니다.',
      icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
      showBack: true,
    },
    
    // 서버/네트워크 에러
    'INTERNAL_SERVER_ERROR': {
      title: '서버 오류',
      message: '서버에 일시적인 문제가 발생했습니다.',
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      showRetry: true,
    },
    'NETWORK_ERROR': {
      title: '연결 오류',
      message: '인터넷 연결을 확인해 주세요.',
      icon: <AlertCircle className="w-6 h-6 text-red-500" />,
      showRetry: true,
    },
  };

  // ✅ 기본/폴백 설정
  const config = errorConfig[errorCode] || {
    title: '오류 발생',
    message: detail || '요청 처리 중 문제가 발생했습니다.',
    icon: <AlertCircle className="w-6 h-6 text-gray-500" />,
    showRetry: status >= 500,  // 5xx 는 기본적으로 재시도 표시
  };

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      role="alert"
      aria-live="polite"
    >
      {/* ✅ 아이콘 */}
      <div className="mb-4 p-3 bg-gray-100 rounded-full">
        {config.icon}
      </div>

      {/* ✅ 제목 + 메시지 */}
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        {config.title}
      </h2>
      <p className="text-gray-600 mb-6 max-w-md">
        {config.message}
      </p>

      {/* ✅ 검증 에러 목록 (있는 경우) */}
      {validationErrors?.length ? (
        <div className="w-full max-w-md mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-left">
          <p className="text-sm font-medium text-orange-800 mb-2">
            ❗ 확인이 필요한 항목:
          </p>
          <ul className="space-y-1">
            {validationErrors.map((err, idx) => (
              <li key={idx} className="text-sm text-orange-700">
                • <span className="font-mono">{err.field}</span>: {err.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ✅ 액션 버튼 그룹 */}
      <div className="flex flex-wrap justify-center gap-3">
        {/*
        {config.showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                       rounded-lg hover:bg-blue-700 transition-colors focus:outline-none 
                       focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </button>
        )}
        */}
        {/* 로그인 버튼 */}
        {config.showLogin && (
          <button
            onClick={() => router.push('/login?redirect=' + encodeURIComponent(location.pathname))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            로그인하기
          </button>
        )}

        {/* 뒤로가기 버튼 */}
        {config.showBack && (
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 
                       text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            이전 페이지
          </button>
        )}

        {/* 목록으로 버튼 (404 등) */}
        {status === 404 && (
          <button
            onClick={() => router.push('/products')}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 
                       text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            상품 목록으로
          </button>
        )}
      </div>

      {/* ✅ 개발용: 상세 에러 정보 (프로덕션에서는 숨김) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 w-full max-w-md text-left">
          <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
            개발자 정보 펼치기
          </summary>
          <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-x-auto">
            <p>errorCode: {errorCode}</p>
            <p>status: {status}</p>
            <p>detail: {detail}</p>
            {validationErrors && (
              <pre className="mt-2">{JSON.stringify(validationErrors, null, 2)}</pre>
            )}
          </div>
        </details>
      )}
    </div>
  );
}