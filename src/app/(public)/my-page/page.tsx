"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deleteMyProfileImage,
  fetchMyProfile,
  MyProfile,
  parseCachedMyProfile,
  uploadProfileImageFile,
  updateMyProfileImage,
} from "@/lib/api/profile";
import { useAuthStore } from "@/stores/useAuthStore";

const getProfileCacheKey = (userId: number) => `cached_profile_${userId}`;

function InfoRow({ label, value, subtle = false }: { label: string; value: string; subtle?: boolean }) {
  return (
    <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3">
      <dt className="text-sm font-semibold text-blue-700">{label}</dt>
      <dd className={`mt-1 text-base ${subtle ? "text-gray-500" : "text-gray-900"}`}>{value}</dd>
    </div>
  );
}

export default function MyPage() {
  const { user, status, checkAuth, setUser } = useAuthStore();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImageName, setSelectedImageName] = useState("");
  const [isImageSaving, setIsImageSaving] = useState(false);
  const cachedProfile = useMemo(() => {
    if (!user) return null;

    try {
      const saved = localStorage.getItem(getProfileCacheKey(user.id));
      if (!saved) return null;
      const parsed = parseCachedMyProfile(saved);
      if (!parsed) {
        localStorage.removeItem(getProfileCacheKey(user.id));
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(getProfileCacheKey(user.id));
      return null;
    }
  }, [user]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user || status !== "authenticated") {
      return;
    }

    let active = true;
    const profileCacheKey = getProfileCacheKey(user.id);

    const loadProfile = async () => {
      setIsProfileLoading(true);
      setProfileError(null);

      try {
        const nextProfile = await fetchMyProfile(user);
        if (!active) return;
        setProfile(nextProfile);
        localStorage.setItem(profileCacheKey, JSON.stringify(nextProfile));
      } catch (error) {
        if (!active) return;
        const statusCode = (error as { status?: number })?.status;
        if (statusCode === 401 || statusCode === 403) {
          // 로컬 캐시 사용자 정보만 남아있는 상태를 정리해 로그인 화면으로 유도한다.
          setUser(null);
          setProfile(null);
          setProfileError(null);
          localStorage.removeItem(profileCacheKey);
          return;
        }
        setProfileError(
          cachedProfile ? null : "프로필 정보를 모두 가져오지 못해 기본 정보만 표시합니다.",
        );
        setProfile((prev) =>
          prev ??
          cachedProfile ?? {
            businessNumber: "",
            bio: "",
            email: user.email,
            name: user.nickname.replace(/\s*님$/, "") || user.nickname,
            nickname: user.nickname,
            phoneNumber: "-",
            address: "-",
            imageUrl: null,
          },
        );
      } finally {
        if (active) {
          setIsProfileLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [cachedProfile, user, status, setUser]);

  const selectedImagePreviewUrl = useMemo(
    () => (selectedImageFile ? URL.createObjectURL(selectedImageFile) : null),
    [selectedImageFile],
  );

  useEffect(() => {
    return () => {
      if (selectedImagePreviewUrl) {
        URL.revokeObjectURL(selectedImagePreviewUrl);
      }
    };
  }, [selectedImagePreviewUrl]);

  const activeProfile = profile ?? cachedProfile;

  if (status === "loading" || status === "idle" || (user && isProfileLoading && !activeProfile)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">내 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!user || !activeProfile || status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">내 정보</h1>
          <p className="mt-2 text-sm text-gray-600">
            로그인 후 프로필과 이동 메뉴를 확인할 수 있습니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              로그인
            </Link>
            <Link
              href="/"
              className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isSeller = user.role === "SELLER";
  const editHref = "/my-page/edit";
  const ordersHref = isSeller ? "/seller/dashboard" : "/cart";
  const displayedImageUrl = selectedImagePreviewUrl || activeProfile.imageUrl;
  const sellerBio = activeProfile.bio?.trim() || "";

  const handleProfileImageSave = async () => {
    if (!selectedImageFile) {
      setProfileError("이미지 파일을 선택해 주세요.");
      return;
    }

    setIsImageSaving(true);
    setProfileError(null);

    try {
      const uploadedImageUrl = await uploadProfileImageFile(selectedImageFile);
      const updatedProfile = await updateMyProfileImage(user, uploadedImageUrl);
      setProfile(updatedProfile);
      localStorage.setItem(
        getProfileCacheKey(user.id),
        JSON.stringify(updatedProfile),
      );
      setSelectedImageFile(null);
      setSelectedImageName("");
    } catch (error) {
      console.error("[MyPage] image update failed:", error);
      setProfileError("프로필 이미지 수정에 실패했습니다.");
    } finally {
      setIsImageSaving(false);
    }
  };

  const handleProfileImageDelete = async () => {
    setIsImageSaving(true);
    setProfileError(null);

    try {
      const updatedProfile = await deleteMyProfileImage(user);
      setProfile(updatedProfile);
      localStorage.setItem(
        getProfileCacheKey(user.id),
        JSON.stringify(updatedProfile),
      );
      setSelectedImageFile(null);
      setSelectedImageName("");
    } catch (error) {
      console.error("[MyPage] image delete failed:", error);
      setProfileError("프로필 이미지 삭제에 실패했습니다.");
    } finally {
      setIsImageSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">내 정보</h1>

          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-start">
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white text-4xl font-bold text-gray-500 shadow-sm">
              {displayedImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayedImageUrl}
                  alt={`${activeProfile.nickname} 프로필 이미지`}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                activeProfile.nickname.charAt(0).toUpperCase()
              )}
            </div>

            <div className="w-full flex-1">
              <p className="text-sm font-medium text-gray-500">프로필</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">
                {activeProfile.nickname}
              </p>
              {isSeller ? (
                <div className="mt-4 rounded-md border border-blue-100 bg-blue-50 px-4 py-4">
                  <p className="text-sm font-semibold text-blue-700">스토어 소개</p>
                  <p
                    className={`mt-2 text-sm leading-6 ${
                      sellerBio ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {sellerBio ||
                      "아직 스토어 소개가 없습니다. 한 줄 소개로 분위기를 살려보세요."}
                  </p>
                </div>
              ) : null}
              <div className="mt-3 w-full max-w-md space-y-3">
                <label className="block">
                  <span className="sr-only">프로필 이미지 파일 선택</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setSelectedImageFile(file);
                      setSelectedImageName(file?.name || "");
                    }}
                    className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                  />
                </label>
                {selectedImageName ? (
                  <p className="text-sm text-gray-500">{selectedImageName}</p>
                ) : (
                  <p className="text-sm text-gray-500">
                    JPG, PNG 같은 이미지 파일을 선택해 주세요.
                  </p>
                )}
                {selectedImagePreviewUrl ? (
                  <p className="text-sm text-blue-600">
                    업로드 전에 왼쪽 미리보기에서 바로 확인할 수 있습니다.
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleProfileImageSave}
                    disabled={isImageSaving}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isImageSaving ? "저장 중..." : "이미지 변경하기"}
                  </button>
                  <button
                    type="button"
                    onClick={handleProfileImageDelete}
                    disabled={isImageSaving}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    이미지 삭제
                  </button>
                </div>
              </div>
            </div>
          </div>

          <dl className="mt-8 grid gap-3">
            <InfoRow label="이메일" value={activeProfile.email} />
            <InfoRow label="이름" value={activeProfile.name} />
            <InfoRow label="닉네임" value={activeProfile.nickname} />
            <InfoRow label="전화번호" value={activeProfile.phoneNumber} subtle />
            <InfoRow label="주소" value={activeProfile.address} subtle />
            {isSeller ? (
              <>
                <InfoRow
                  label="사업자번호"
                  value={activeProfile.businessNumber.trim() || "-"}
                  subtle={!activeProfile.businessNumber.trim()}
                />
              </>
            ) : null}
          </dl>

          {profileError ? (
            <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {profileError}
            </p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={editHref}
              className="inline-flex w-full items-center justify-between rounded-md bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <span>개인 정보 수정하기</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href={ordersHref}
              className="inline-flex w-full items-center justify-between rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <span>{isSeller ? "판매자 센터" : "주문 내역 조회"}</span>
              <span aria-hidden="true">→</span>
            </Link>

            <Link
              href="/"
              className="inline-flex w-full items-center justify-between rounded-md border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <span>메인으로 돌아가기</span>
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
