"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MyProfile, MyProfileUpdateInput, updateMyProfile } from "@/lib/api/profile";
import { useAuthStore } from "@/stores/useAuthStore";

type Props = {
  initialProfile: MyProfile;
};

export function MyProfileEditForm({ initialProfile }: Props) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [form, setForm] = useState<MyProfileUpdateInput>({
    nickname: initialProfile.nickname,
    phoneNumber: initialProfile.phoneNumber === "-" ? "" : initialProfile.phoneNumber,
    address: initialProfile.address === "-" ? "" : initialProfile.address,
    bio: initialProfile.bio || "",
    businessNumber: initialProfile.businessNumber || "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  const isSeller = user?.role === "SELLER";
  const cancelHref = "/my-page";

  if (!user) {
    return null;
  }

  const handleFieldChange =
    (field: keyof MyProfileUpdateInput) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSavingInfo(true);
    setMessage(null);
    setError(null);

    try {
      const updatedProfile = await updateMyProfile(user, form);
      setForm({
        nickname: updatedProfile.nickname,
        phoneNumber: updatedProfile.phoneNumber === "-" ? "" : updatedProfile.phoneNumber,
        address: updatedProfile.address === "-" ? "" : updatedProfile.address,
        bio: updatedProfile.bio || "",
        businessNumber: updatedProfile.businessNumber || "",
      });
      localStorage.setItem(
        `cached_profile_${user.id}`,
        JSON.stringify(updatedProfile),
      );
      router.push("/my-page");
    } catch (submitError) {
      console.error("[MyProfileEditForm] profile update failed:", submitError);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "개인 정보 수정에 실패했습니다.",
      );
    } finally {
      setIsSavingInfo(false);
    }
  };

  return (
    <div className="space-y-6">
      {message ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">개인 정보 수정</h2>
        <p className="mt-2 text-sm text-gray-600">
          {isSeller
            ? "판매자 계정 정보를 수정합니다."
            : "구매자 계정 정보를 수정합니다."}
        </p>

        <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
          {isSeller ? (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-4 py-4">
              <label className="block text-sm font-semibold text-blue-700" htmlFor="bio">
                스토어 소개
              </label>
              <p className="mt-1 text-xs text-blue-700">
                스토어 분위기와 강점을 짧고 선명하게 전해보세요.
              </p>
              <textarea
                id="bio"
                value={form.bio || ""}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, bio: event.target.value }))
                }
                rows={5}
                placeholder="스토어 분위기와 강점을 한눈에 전할 문장을 적어보세요"
                className="mt-3 w-full rounded-md border border-blue-200 bg-white px-3 py-3 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ) : null}

          <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">기본 정보</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
                  이름
                </label>
                <input
                  id="name"
                  type="text"
                  value={initialProfile.name}
                  disabled
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">이름은 현재 수정할 수 없습니다.</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="nickname">
                  닉네임
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={form.nickname}
                  onChange={handleFieldChange("nickname")}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phoneNumber">
                  전화번호
                </label>
                <input
                  id="phoneNumber"
                  type="text"
                  value={form.phoneNumber}
                  onChange={handleFieldChange("phoneNumber")}
                  placeholder="010-0000-0000"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="address">
                  주소
                </label>
                <input
                  id="address"
                  type="text"
                  value={form.address}
                  onChange={handleFieldChange("address")}
                  placeholder="주소를 입력해 주세요"
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {isSeller ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900">스토어 정보</h3>
              <div className="mt-4">
              <label
                className="mb-1 block text-sm font-medium text-gray-700"
                htmlFor="businessNumber"
              >
                사업자번호
              </label>
              <input
                id="businessNumber"
                type="text"
                value={form.businessNumber || ""}
                onChange={handleFieldChange("businessNumber")}
                placeholder="123-45-67890"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={isSavingInfo}
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSavingInfo ? "저장 중..." : "개인 정보 수정하기"}
            </button>
            <Link
              href={cancelHref}
              className="rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              돌아가기
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
