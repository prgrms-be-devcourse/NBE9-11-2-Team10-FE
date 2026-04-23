// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // ✅ 테스트 환경에서만 외부 이미지 도메인 허용
    remotePatterns: [
      {
        protocol: "https",
        hostname: "team10-images-dev-wuho-20260419.s3.us-east-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "search.pstatic.net",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
