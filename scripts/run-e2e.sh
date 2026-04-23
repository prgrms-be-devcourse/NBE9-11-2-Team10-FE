#!/bin/bash
# scripts/run-e2e.sh
# ✅ 윈도우 Git Bash 호환 + 모든 Mock 라우트 헬스체크 + 명확한 로그

set -e  # 에러 시 즉시 종료

# ============================================================================
# 🔹 컬러 출력 함수 (윈도우 호환)
# ============================================================================
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
  # Windows Git Bash: 컬러 비활성화 (호환성 문제 방지)
  RED='' GREEN='' YELLOW='' BLUE='' NC=''
else
  RED='\033[0;31m' GREEN='\033[0;32m' YELLOW='\033[1;33m' BLUE='\033[0;34m' NC='\033[0m'
fi

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}   $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[FAIL]${NC}  $1"; }

# ============================================================================
# 🔹 1. 환경변수 및 파일 확인
# ============================================================================
log_info "E2E 테스트 시작..."

# .env.test 또는 .env.local 이 없으면 기본값 생성
if [ ! -f ".env.test" ] && [ ! -f ".env.local" ]; then
  log_warn ".env.test 또는 .env.local 이 없습니다. 기본값으로 생성합니다."
  cat > .env.test << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_APP_URL=http://localhost:3000
API_BASE_URL=http://localhost:4000
NODE_ENV=test
EOF
fi

# ============================================================================
# 🔹 트랩 설정: 스크립트 종료 시 항상 서버 정리 (EXIT, INT, TERM 시그널 대응)
# ============================================================================
cleanup() {
  log_info "🧹 트랩 호출: 서버 프로세스 종료..."
  [ -n "$MOCK_PID" ] && kill $MOCK_PID 2>/dev/null || true
  [ -n "$NEXT_PID" ] && kill $NEXT_PID 2>/dev/null || true
  # 포트 점유 프로세스 정리 (선택사항, Linux/Mac 전용)
  # command -v fuser >/dev/null 2>&1 && fuser -k 3000/tcp 4000/tcp 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# ============================================================================
# 🔹 2. Mock API 서버 시작 (NODE_ENV=test 필수)
# ============================================================================
log_info "Mock API 서버 시작 (port: 4000)..."

# ✅ NODE_ENV=test 를 반드시 주입 (debug 라우트 활성화용)
export NODE_ENV=test
export E2E_MODE=true

# 서버 백그라운드 실행 + 로그 파일로 리다이렉트
pnpm run mock:server > mock-server.log 2>&1 &
MOCK_PID=$!

# 프로세스가 실제로 시작되었는지 확인
sleep 2
if ! kill -0 $MOCK_PID 2>/dev/null; then
  log_error "Mock 서버 프로세스가 시작되지 않았습니다."
  echo "=== Mock Server Log ==="
  cat mock-server.log
  exit 1
fi

# ============================================================================
# 🔹 3. 헬스체크 함수 (윈도우 호환 + 유연한 상태코드 처리)
# ============================================================================
check_route() {
  local name="$1"
  local url="$2"
  local method="${3:-GET}"
  local body="${4:-}"  # POST/PUT 용 요청 본문 (선택)
  local max_retries=15
  local retry_delay=1
  
  for i in $(seq 1 $max_retries); do
    # ✅ curl 옵션: -s(조용히), -o /dev/null(응답 무시), -w(상태코드만 출력)
    # ✅ 윈도우 호환: 2>/dev/null 으로 에러 숨김, || 로 기본값 설정
    if [ -n "$body" ]; then
      http_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
        -H "Content-Type: application/json" \
        -d "$body" \
        "$url" 2>/dev/null) || http_code="000"
    else
      http_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$url" 2>/dev/null) || http_code="000"
    fi
    
    # ✅ "라우트 존재" 로 간주하는 상태코드: 2xx, 400(검증실패), 401(인증필요), 403(권한없음), 404(없음)
    # ❌ 진짜 실패: 000(연결실패), 500(서버에러), 502/503/504(게이트웨이)
    if [[ "$http_code" =~ ^(2[0-9]{2}|400|401|403|404)$ ]]; then
      log_success "[$name] $method $url → HTTP $http_code"
      return 0
    fi
    
    # 최대 재시도 도달 시 실패
    if [ $i -eq $max_retries ]; then
      case "$http_code" in
        000) log_error "[$name] 연결 실패: 서버가 응답하지 않음 ($url)" ;;
        5*)  log_error "[$name] 서버 오류: HTTP $http_code ($url)" ;;
        *)   log_error "[$name] 예외 응답: HTTP $http_code ($url)" ;;
      esac
      return 1
    fi
    
    # 재시도 중... (10 초 이후부터만 로그 출력)
    [ $i -le 5 ] || echo "⏳ [$name] 대기 중... ($i/$max_retries)"
    sleep $retry_delay
  done
}

# ============================================================================
# 🔹 4. 모든 라우트 도메인 헬스체크
# ============================================================================
log_info "📋 Mock 서버 라우트 헬스체크 시작..."
echo ""

HEALTH_CHECK_FAILED=0

# 🔐 1. Auth Routes (/api/v1/auth/*)
log_info "[1/4] Auth 라우트 체크..."
check_route "AUTH:check-duplicate" \
  "http://localhost:4000/api/v1/auth/check-duplicate?type=EMAIL&value=test@example.com" \
  "GET" || HEALTH_CHECK_FAILED=1

# 📦 2. Products Routes (/api/v1/products/*)
log_info "[2/4] Products 라우트 체크..."
check_route "PRODUCTS:list" \
  "http://localhost:4000/api/v1/products?page=1&size=2" \
  "GET" || HEALTH_CHECK_FAILED=1

check_route "PRODUCTS:detail(exists)" \
  "http://localhost:4000/api/v1/products/1" \
  "GET" || HEALTH_CHECK_FAILED=1

check_route "PRODUCTS:detail(not-found)" \
  "http://localhost:4000/api/v1/products/999999" \
  "GET" || HEALTH_CHECK_FAILED=1  # 404 도 정상

# 🏪 3. Store Products Routes (/api/v1/stores/me/products/*)
log_info "[3/4] Store Products 라우트 체크..."

# ✅ 인증 없이 호출 → 401 이면 "라우트 존재 + 미들웨어 작동" 으로 간주
check_route "STORE:create(no-auth)" \
  "http://localhost:4000/api/v1/stores/me/products" \
  "POST" \
  '{"productName":"test","price":1000,"stock":10,"type":"BOOK"}' || HEALTH_CHECK_FAILED=1

# ✅ E2E 전용 초기화 엔드포인트 (인증 불필요)
check_route "STORE:reset" \
  "http://localhost:4000/api/v1/stores/me/products/__reset" \
  "DELETE" || HEALTH_CHECK_FAILED=1

# 🔍 4. Debug Routes (/api/v1/__debug/*)
log_info "[4/4] Debug 라우트 체크..."
check_route "DEBUG:headers" \
  "http://localhost:4000/api/v1/__debug/headers" \
  "GET" || HEALTH_CHECK_FAILED=1

echo ""

# ============================================================================
# 🔹 5. 헬스체크 결과 처리
# ============================================================================
if [ "$HEALTH_CHECK_FAILED" = "1" ]; then
  log_error "Mock 서버 헬스체크 실패. 로그 확인:"
  echo ""
  echo "=== Mock Server Log (최근 100 줄) ==="
  tail -100 mock-server.log 2>/dev/null || echo "(로그 파일 없음)"
  echo ""
  
  # 프로세스 정리
  kill $MOCK_PID 2>/dev/null || true
  exit 1
fi

log_success "✅ 모든 Mock 라우트 헬스체크 통과!"
echo ""

# ============================================================================
# 🔹 6. Next.js 서버 실행 (CI 모드일 때만)
# ============================================================================
if [ "$CI" = "true" ]; then
  log_info "🏗️ Next.js 빌드 시작..."
  pnpm run build
  
  log_info "🚀 Next.js 서버 시작 (port: 3000)..."
  pnpm run start > next-server.log 2>&1 &
  NEXT_PID=$!
  
  # Next.js 헬스체크 (메인 페이지 + API 프록시)
  log_info "⏳ Next.js 서버 준비 대기..."
  for i in {1..40}; do
    # 1. 메인 페이지 접근 확인
    if curl -sf http://localhost:3000 > /dev/null 2>&1; then
      # 2. API 프록시 라우트 확인 (선택적)
      api_check=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/for-debug/forward-headers" 2>/dev/null) || api_check="000"
      if [[ "$api_check" =~ ^(200|401|403|404|500)$ ]]; then
        log_success "Next.js 서버 및 API 프록시 준비 완료 ($i 초)"
        break
      fi
    fi
    
    [ $i -eq 40 ] && {
      log_error "Next.js 서버 시작 실패"
      echo "=== Next.js Server Log ==="
      cat next-server.log 2>/dev/null || echo "(로그 파일 없음)"
      kill $MOCK_PID 2>/dev/null || true
      exit 1
    }
    
    [ $i -eq 10 ] && echo "⏳ Next.js 빌드/시작 중... ($i/40)"
    sleep 2
  done
  echo ""
fi

# ============================================================================
# 🔹 7. Playwright 테스트 실행
# ============================================================================
log_info "🔍 Playwright 테스트 실행..."
echo ""

# ✅ set -e 일시 해제 + 종료코드 안전하게 캡처
set +e
pnpm exec playwright test "$@"
TEST_EXIT_CODE=$?
set -e  # 다시 활성화 (선택사항, 이후 코드에서 에러 처리가 필요없다면 생략 가능)

echo ""

# ============================================================================
# 🔹 8. 로컬 환경: 실패 시 리포트 자동 오픈
# ============================================================================
if [ "$CI" != "true" ] && [ $TEST_EXIT_CODE -ne 0 ]; then
  log_warn "테스트 실패! 플레이라이트 리포트를 브라우저로 엽니다..."
  pnpm exec playwright show-report || true
fi

# ============================================================================
# 🔹 9. 서버 정리 (trap 에서 이미 처리하므로, 여기서는 로그만)
# ============================================================================
# 📝 trap cleanup 이 EXIT 시 자동으로 실행되므로, 
#    여기서는 추가 작업이 필요한 경우만 작성 (예: 로그 파일 아카이브 등)
log_info "✅ 클린업 완료 (trap 처리)"

# 포트 점유 프로세스 강제 정리 (선택)
# fuser -k 3000/tcp 4000/tcp 2>/dev/null || true

# ============================================================================
# 🔹 10. 최종 결과 반환
# ============================================================================
if [ $TEST_EXIT_CODE -eq 0 ]; then
  log_success "🎉 모든 E2E 테스트 통과!"
else
  log_error "❌ 일부 테스트 실패 (종료코드: $TEST_EXIT_CODE)"
fi

exit $TEST_EXIT_CODE