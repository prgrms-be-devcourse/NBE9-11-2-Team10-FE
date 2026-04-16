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

# 4. Playwright 테스트 실행
echo "🔍 Playwright 테스트 실행..."
pnpm exec playwright test "$@"
TEST_EXIT_CODE=$?

# 5. 목 서버 정리
echo "🧹 Mock 서버 종료..."
kill $MOCK_PID 2>/dev/null || true

# 6. 결과 반환
exit $TEST_EXIT_CODE