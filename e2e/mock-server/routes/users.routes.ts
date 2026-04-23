import { Router, Request, Response } from "express";
import { mockAuthMiddleware, mockSellerMiddleware } from "../lib/mock-auth-middleware";
import { StoreProfileStore } from "../lib/mock-store-profile-data";
import { createErrorResponse } from "../lib/mock-common-data";
import { updateMockUser } from "../lib/mock-user-data";

const router = Router();

const isValidPhoneNumber = (value: string) => /^01[016789]-\d{3,4}-\d{4}$/.test(value);

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const toProfileResponse = (req: Request) => {
  const user = req.mockUser!;
  const profile = StoreProfileStore.findBySellerId(String(user.id));

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    nickname: profile?.nickname || user.nickname,
    phoneNumber: user.phoneNumber,
    roadAddress: user.roadAddress,
    detailAddress: user.detailAddress,
    address: user.address,
    profileImageUrl: profile?.profileImageUrl || user.profileImageUrl || null,
    businessNumber: user.businessNumber || "",
    bio: profile?.bio || ""
  };
};

router.post("/images/presigned-url", (req: Request, res: Response) => {
  const { fileName, contentType, directory } = req.body ?? {};

  if (!fileName || !contentType) {
    return res.status(400).json({
      ...createErrorResponse(
        400,
        "VALIDATION_FAILED",
        "파일명과 파일 타입은 필수입니다.",
        "/api/v1/images/presigned-url",
      ),
      validationErrors: [
        !fileName ? { field: "fileName", message: "파일명은 필수입니다." } : null,
        !contentType ? { field: "contentType", message: "파일 타입은 필수입니다." } : null,
      ].filter(Boolean),
    });
  }

  const safeFileName = encodeURIComponent(String(fileName).trim());
  const folder = typeof directory === "string" && directory.trim() ? directory.trim() : "default";
  const uploadToken = `${folder}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const baseUrl = `${req.protocol}://${req.get("host")}`;

  return res.status(200).json({
    success: true,
    data: {
      uploadUrl: `${baseUrl}/api/v1/mock-storage/upload/${uploadToken}?fileName=${safeFileName}`,
      imageUrl: `${baseUrl}/mock-images/${folder}/${uploadToken}-${safeFileName}`,
    },
  });
});

router.put("/mock-storage/upload/:token", (req: Request, res: Response) => {
  return res.status(200).send("");
});

router.get("/users/me", mockAuthMiddleware, (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: toProfileResponse(req),
  });
});

router.get("/sellers/me", mockSellerMiddleware, (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    data: toProfileResponse(req),
  });
});

router.put("/users/me", mockAuthMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;
  const { nickname, phoneNumber, address } = req.body ?? {};
  const validationErrors: Array<{ field: string; message: string }> = [];

  if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
    validationErrors.push({ field: "nickname", message: "닉네임은 2자 이상 입력해 주세요." });
  }
  if (!phoneNumber || typeof phoneNumber !== "string" || !isValidPhoneNumber(phoneNumber)) {
    validationErrors.push({
      field: "phoneNumber",
      message: "전화번호 형식이 올바르지 않습니다. (010-0000-0000)",
    });
  }
  if (!address || typeof address !== "string" || !address.trim()) {
    validationErrors.push({ field: "address", message: "주소는 필수입니다." });
  }

  if (validationErrors.length) {
    return res.status(400).json({
      ...createErrorResponse(400, "VALIDATION_FAILED", "입력 정보를 확인해 주세요.", "/api/v1/users/me"),
      validationErrors,
    });
  }

  const updated = updateMockUser(user.id, {
    nickname: nickname.trim(),
    phoneNumber: phoneNumber.trim(),
    address: address.trim(),
  });

  req.mockUser = updated || user;

  return res.status(200).json({
    success: true,
    data: toProfileResponse(req),
  });
});

router.put("/sellers/me", mockSellerMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;
  const { nickname, phoneNumber, address, businessNumber, bio } = req.body ?? {};
  const validationErrors: Array<{ field: string; message: string }> = [];

  if (!nickname || typeof nickname !== "string" || nickname.trim().length < 2) {
    validationErrors.push({ field: "nickname", message: "닉네임은 2자 이상 입력해 주세요." });
  }
  if (!phoneNumber || typeof phoneNumber !== "string" || !isValidPhoneNumber(phoneNumber)) {
    validationErrors.push({
      field: "phoneNumber",
      message: "전화번호 형식이 올바르지 않습니다. (010-0000-0000)",
    });
  }
  if (!address || typeof address !== "string" || !address.trim()) {
    validationErrors.push({ field: "address", message: "주소는 필수입니다." });
  }
  if (!businessNumber || typeof businessNumber !== "string" || !businessNumber.trim()) {
    validationErrors.push({ field: "businessNumber", message: "사업자번호는 필수입니다." });
  }

  if (validationErrors.length) {
    return res.status(400).json({
      ...createErrorResponse(400, "VALIDATION_FAILED", "입력 정보를 확인해 주세요.", "/api/v1/sellers/me"),
      validationErrors,
    });
  }

  const updated = updateMockUser(user.id, {
    nickname: nickname.trim(),
    phoneNumber: phoneNumber.trim(),
    address: address.trim(),
    businessNumber: businessNumber.trim(),
    bio: typeof bio === "string" ? bio.trim() : user.bio,
  });

  if (updated) {
    StoreProfileStore.update(String(updated.id), {
      nickname: nickname.trim(),
      bio: typeof bio === "string" ? bio.trim() : "",
    });
    req.mockUser = updated;
  }

  return res.status(200).json({
    success: true,
    data: toProfileResponse(req),
  });
});

router.put("/me/profile-image", mockAuthMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;
  const { imageUrl } = req.body ?? {};

  if (!imageUrl || typeof imageUrl !== "string" || !isValidUrl(imageUrl)) {
    return res.status(400).json({
      ...createErrorResponse(
        400,
        "VALIDATION_FAILED",
        "올바른 이미지 URL 형식이어야 합니다.",
        "/api/v1/me/profile-image",
      ),
      validationErrors: [{ field: "imageUrl", message: "올바른 이미지 URL 형식이어야 합니다." }],
    });
  }

  const updated = updateMockUser(user.id, {
    profileImageUrl: imageUrl.trim(),
  });

  if (updated?.role === "SELLER") {
    StoreProfileStore.update(String(updated.id), {
      profileImageUrl: imageUrl.trim(),
    });
  }

  req.mockUser = updated || user;

  return res.status(200).json({
    success: true,
    data: toProfileResponse(req),
  });
});

router.delete("/me/profile-image", mockAuthMiddleware, (req: Request, res: Response) => {
  const user = req.mockUser!;
  const updated = updateMockUser(user.id, {
    profileImageUrl: null,
  });

  if (updated?.role === "SELLER") {
    StoreProfileStore.update(String(updated.id), {
      profileImageUrl: null,
    });
  }

  req.mockUser = updated || user;

  return res.status(200).json({
    success: true,
    data: toProfileResponse(req),
  });
});

export default router;
