"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchMyProfile, MyProfile, parseCachedMyProfile } from "@/lib/api/profile";
import { MyProfileEditForm } from "@/components/profile/MyProfileEditForm";
import { useAuthStore } from "@/stores/useAuthStore";

const getProfileCacheKey = (userId: number) => `cached_profile_${userId}`;

export default function MyPageEdit() {
  const { user, status, checkAuth, setUser } = useAuthStore();
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
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

    const load = async () => {
      try {
        const nextProfile = await fetchMyProfile(user);
        if (!active) return;
        setProfile(nextProfile);
        localStorage.setItem(profileCacheKey, JSON.stringify(nextProfile));
        setError(null);
      } catch (loadError) {
        if (!active) return;
        const statusCode = (loadError as { status?: number })?.status;
        if (statusCode === 401 || statusCode === 403) {
          setUser(null);
          setProfile(null);
          setError(null);
          localStorage.removeItem(profileCacheKey);
          return;
        }

        setError(
          cachedProfile ? null : "수정할 프로필 정보를 불러오지 못해 기본 정보로 표시합니다.",
        );
        setProfile((prev) =>
          prev ??
          cachedProfile ?? {
            email: user.email,
            name: user.nickname.replace(/\s*님$/, "") || user.nickname,
            nickname: user.nickname,
            phoneNumber: "-",
            address: "-",
            bio: "",
            businessNumber: "",
            imageUrl: null,
          },
        );
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [cachedProfile, user, status, setUser]);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500">수정 화면을 준비하는 중입니다...</p>
        </div>
      </div>
    );
  }

  if (!user || status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">개인 정보 수정</h1>
          <p className="mt-2 text-sm text-gray-600">
            로그인 후 프로필을 수정할 수 있습니다.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              로그인
            </Link>
            <Link
              href="/my-page"
              className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              내 정보로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/my-page"
            className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            ← 내 정보로 돌아가기
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-gray-900">개인 정보 수정</h1>
          <p className="mt-2 text-sm text-gray-600">
            닉네임, 전화번호, 주소를 수정할 수 있습니다.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : null}

        {profile ?? cachedProfile ? (
          <MyProfileEditForm initialProfile={(profile ?? cachedProfile)!} />
        ) : null}
      </div>
    </main>
  );
}
