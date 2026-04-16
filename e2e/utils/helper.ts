import { expect, Page } from "@playwright/test";

export async function expectErrorMessageVisible(page: Page, message: string) {
    const errorLocator = page.getByText(message);
    
    // 1️⃣ attached: DOM 에 요소가 렌더링될 때까지 대기
    //    - 서버 액션 응답 지연, 애니메이션 등을 고려한 안전장치
    await errorLocator.waitFor({ state: 'attached', timeout: 5000 });
    
    // 2️⃣ scrollIntoViewIfNeeded: 
    //    - 요소가 뷰포트 밖에 있으면 자동으로 스크롤
    //    - 이미 보이면 아무 작업도 하지 않음 (안전함)
    await errorLocator.scrollIntoViewIfNeeded({ timeout: 3000 });
    
    // 3️⃣ toBeVisible: 
    //    - 실제로 사용자에게 보이는 상태인지 최종 검증
    await expect(errorLocator).toBeVisible({ timeout: 3000 });
  }