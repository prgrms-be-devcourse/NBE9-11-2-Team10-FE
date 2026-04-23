// app/api/for-debug/forwarded-headers/route.ts
import { NextResponse } from 'next/server';
import { getForwardedHeaders } from '@/utils/helper'; // 앞서 작성한 헬퍼 함수 경로에 맞게 수정

export async function GET() {
  // 🚨 프로덕션에서는 절대 노출되지 않도록 차단
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Debug endpoint is disabled in production.' },
      { status: 403 }
    );
  }

  // ✅ 실제로 Server Action 에서 사용할 헤더 생성 로직 호출
  const forwardedHeaders = await getForwardedHeaders();

  return NextResponse.json({
    status: 'success',
    message: 'Next.js 가 백엔드로 전달할 헤더입니다.',
    forwardedHeaders,
    cookie: forwardedHeaders['Cookie'] || null,
    environment: process.env.NODE_ENV,
  });
}