// utils/loadKakaoPostcode.ts
const KAKAO_POSTCODE_URL = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

export const loadKakaoPostcode = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.kakao?.Postcode) {
      resolve();
      return;
    }

    // 중복 스크립트 삽입 방지
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${KAKAO_POSTCODE_URL}"]`
    );
    if (existing) {
      existing.onload = () => resolve();
      existing.onerror = () => reject(new Error('Failed to load Kakao Postcode script'));
      return;
    }

    const script = document.createElement('script');
    script.src = KAKAO_POSTCODE_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Kakao Postcode script'));
    document.head.appendChild(script);
  });
};