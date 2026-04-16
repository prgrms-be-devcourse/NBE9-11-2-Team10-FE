// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// ✅ .env.test 를 명시적으로 로드 (가장 중요!)
config({ path: '.env.test' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  
  reporter: 'html',
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run dev', // 또는 'next dev'
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI, // 로컬에서 기존 서버 재사용
    timeout: 120 * 1000, // 서버 시작 대기 시간
    stdout: 'pipe',
    stderr: 'pipe',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    
    // ✅ 모바일 테스트 (선택)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],
});