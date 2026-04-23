// e2e/mock-server/lib/mock-payment-scenario.ts
// ✅ 테스트 시나리오를 저장하는 공유 상태 (단일 인스턴스)

export type PaymentScenario = 
  | "SUCCESS"
  | "NOT_FOUND_PAYMENT"
  | "REJECT_CARD_PAYMENT"
  | "REJECT_CARD_COMPANY"
  | "INVALID_REQUEST"
  | "NETWORK_ERROR_FINAL_FAILED"
  | null;

let currentScenario: PaymentScenario = null;

export const PaymentScenarioStore = {
  set: (scenario: PaymentScenario) => {
    currentScenario = scenario;
    console.log(`[Mock Payment] Scenario set to: ${scenario}`);
  },
  
  get: (): PaymentScenario => currentScenario,
  
  reset: () => {
    currentScenario = null;
    console.log('[Mock Payment] Scenario reset');
  },
};