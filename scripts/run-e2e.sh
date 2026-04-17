#!/bin/bash
# scripts/run-e2e.sh

set -e  # 에러 시 즉시 종료

echo "🧪 E2E 테스트 시작..."

# 1. 환경변수 확인
if [ ! -f ".env.test" ]; then
  echo "❌ .env.test 파일이 없습니다!"
  exit 1
fi

# 2. 목 서버 백그라운드 실행
echo "🎭 Mock API 서버 시작 (port: 4000)..."
pnpm run mock:server &
MOCK_PID=$!

# 3. 목 서버 준비 대기
sleep 2

# 3.5. Next.js 빌드 및 서버 실행 (CI 환경용)
if [ "$CI" = "true" ]; then
  echo "🏗️ Next.js building..."
  pnpm run build
  
  echo "🚀 Next.js server starting (port: 3000)..."
  pnpm run start &
  NEXT_PID=$!
  
  # 서버 준비 대기 (헬스체크 추가 권장)
  for i in {1..30}; do
    if curl -s http://localhost:3000 > /dev/null; then
      echo "✅ Next.js server ready"
      break
    fi
    echo "⏳ Waiting for Next.js... ($i/30)"
    sleep 2
  done
fi

# 4. Playwright 테스트 실행
echo "🔍 Playwright 테스트 실행..."
pnpm exec playwright test "$@" --reporter=list,json
TEST_EXIT_CODE=$?

# 4.5. 로컬 환경이면 리포트 자동 오픈
if [ "$CI" != "true" ] && [ $TEST_EXIT_CODE -ne 0 ]; then
  echo "📊 테스트 실패! 리포트를 브라우저로 엽니다..."
  pnpm exec playwright show-report
fi

# 5. 서버 정리
echo "🧹 서버 종료..."
kill $MOCK_PID 2>/dev/null || true
[ -n "$NEXT_PID" ] && kill $NEXT_PID 2>/dev/null || true

# 6. 결과 반환
exit $TEST_EXIT_CODE