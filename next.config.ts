// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ✅ 테스트 환경에서만 외부 이미지 도메인 허용
    remotePatterns:
      process.env.NODE_ENV === "test"
        ? [
            {
              protocol: "https",
              hostname: "example.com",
              pathname: "/images/**",
            },
          ]
        : [], // 개발/프로덕션에서는 빈 배열 (외부 이미지 차단)
  },
};

export default nextConfig;
