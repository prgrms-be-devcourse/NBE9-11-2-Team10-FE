"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// scripts/mock-api-server.ts (최종 간소화 버전)
var express_1 = require("express");
var app = (0, express_1.default)();
var PORT = 4000;
app.use(express_1.default.json());
// 🎯 필요한 엔드포인트만 정의 (catch-all 제거)
app.post('/api/v1/auth/register', function (req, res) {
    var _a = req.body, email = _a.email, password = _a.password;
    if (email === 'duplicate@example.com') {
        return res.status(409).json({
            detail: '이미 사용 중인 이메일입니다.',
            status: 409,
            errorCode: 'USER_002',
            timestamp: new Date().toISOString(),
        });
    }
    // 기본 성공 응답
    return res.status(200).json({
        success: true,
        user: {
            id: Math.floor(Math.random() * 10000) + 1000,
            email: email,
            createdAt: new Date().toISOString(),
        },
    });
});
// ✅ catch-all 라우트 삭제 — 불필요한 요청은 Express 가 기본 404 처리
app.listen(PORT, function () {
    console.log("\uD83C\uDFAD Mock API Server running on http://localhost:".concat(PORT));
});
