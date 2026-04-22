// e2e/mock-server/mock-api-server.ts
import express , { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import qs from "qs";

// 📦 도메인별 라우터 임포트
import authRoutes from "./routes/auth.routes";
import productsRoutes from "./routes/products.routes"; // 공용: 상품 조회
import storeProductsRoutes from "./routes/store-products.routes"; // 판매자: 상품 관리
import storeProfileRoutes from "./routes/store-profiles.routes";
import storeFeedsRoutes from "./routes/store-feeds.routes";
import sellerRoutes from "./routes/seller.routes";
import orderRoutes from "./routes/orders.routes"; 
import debugRoutes from "./routes/debug.routes";
import { StoreProfileStore } from "./lib/mock-store-profile-data";
import { ProductStore } from "./lib/mock-product-data";
import { CommentStore, FeedStore } from "./lib/mock-feed-data";
import { FeaturedProductStore } from "./lib/mock-featured-product";
import { OrderStore } from "./lib/mock-order-data";

const app = express();
const PORT = process.env.MOCK_PORT || 4000;

// ✅ 공통 미들웨어
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  }),
);
app.set("query parser", (str: string) =>
  qs.parse(str, {
    charset: "utf-8",
    charsetSentinel: true,
    interpretNumericEntities: true,
  }),
);

app.use(
  express.json({
    limit: "10mb",
    verify: (req, res, buf) => {
      if (buf && buf.length) {
        (req as any).rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// 🛣️ 도메인별 라우터 마운팅 (명세서와 1:1 매핑)
app.use("/api/v1/auth", authRoutes); // 🔐 인증
app.use("/api/v1/products", productsRoutes); // 📦 상품 조회 (공용)
app.use("/api/v1/stores/me/products", storeProductsRoutes); // 🏪 상품 관리 (판매자)
app.use("/api/v1/stores", storeProfileRoutes);
app.use("/api/v1/stores", storeFeedsRoutes);
app.use("/api/v1/sellers", sellerRoutes);
app.use("/api/v1/orders", orderRoutes); 
app.use("/api/v1/__debug", debugRoutes); // 인증 쿠키 테스트 용 (e2e 전용)

app.post("/api/v1/__reset", (req: Request, res: Response) => {
  try {
    // 모든 스토어 초기화
    StoreProfileStore.reset();
    ProductStore.reset();
    FeedStore.reset();
    CommentStore.reset();
    FeaturedProductStore.reset();
    OrderStore.reset();
    
    console.log("[MOCK RESET] All stores have been reset at", new Date().toISOString());
    
    return res.status(200).json({
      success: true,
      message: "All mock data has been reset successfully.",
      resetAt: new Date().toISOString(),
      stores: [
        "StoreProfileStore",
        "ProductStore", 
        "FeedStore",
        "CommentStore",
        "FeaturedProductStore",
        "OrderStore"
      ]
    });
  } catch (error) {
    console.error("[MOCK RESET ERROR]", error);
    return res.status(500).json({
      success: false,
      error: "Failed to reset mock data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// 🚨 글로벌 에러 핸들러 (라우터 등록 후 마지막에)
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("[Mock API Error]", err);
    res.status(500).json({
      type: "https://api.example.com/errors/INTERNAL_ERROR",
      title: "Internal Server Error",
      status: 500,
      detail: "서버 내부 오류가 발생했습니다.",
      errorCode: "INTERNAL_ERROR",
      instance: req.path,
      timestamp: new Date().toISOString(),
    });
  },
);

// 🚀 서버 부팅
app.listen(PORT, () => {
  console.log(`🎭 Mock API Server: http://localhost:${PORT}`);
  console.log(`   ├─ POST /api/v1/auth/*`);
  console.log(`   ├─ GET  /api/v1/products/*`);
  console.log(`   ├─ CRUD /api/v1/stores/me/products/*`);
  console.log(`   ├─ CRUD /api/v1/stores (profile)`);
  console.log(`   ├─ GET  /api/v1/stores (feeds/comments/featured)`);
  console.log(`   └─ DEBUG /api/v1/__debug`);
});
