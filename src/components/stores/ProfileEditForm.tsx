"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { handleUpdateProfile } from "@/lib/actions/store.actions";
import { StoreProfileResponse } from "@/types/store";

interface ProfileEditFormProps {
    initialData: StoreProfileResponse;
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
            {pending ? "저장 중..." : "프로필 저장"}
        </button>
    );
}

export function ProfileEditForm({ initialData }: ProfileEditFormProps) {
    const [state, formAction] = useActionState(handleUpdateProfile, {
        error: undefined,
        fieldErrors: {},
    });

    return (
        <form action={formAction} className="bg-white rounded-lg p-6 shadow-sm space-y-6">
            {state.error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {state.error}
                </div>
            )}

            <div className="space-y-5">
                {/* 닉네임 */}
                <div>
                    <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                        닉네임 <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="nickname"
                        type="text"
                        name="nickname"
                        defaultValue={initialData.nickname}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${state.fieldErrors?.nickname ? "border-red-500" : "border-gray-300"
                            }`}
                    />
                    {state.fieldErrors?.nickname && (
                        <p className="mt-1 text-xs text-red-500">{state.fieldErrors.nickname}</p>
                    )}
                </div>

                {/* 소개 */}
                <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                        소개
                    </label>
                    <textarea
                        id="bio"
                        name="bio"
                        defaultValue={initialData.bio || ""}
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${state.fieldErrors?.bio ? "border-red-500" : "border-gray-300"
                            }`}
                    />
                    {state.fieldErrors?.bio && (
                        <p className="mt-1 text-xs text-red-500">{state.fieldErrors.bio}</p>
                    )}
                </div>

                {/* 프로필 이미지 URL */}
                <div>
                    <label htmlFor="profileImageUrl" className="block text-sm font-medium text-gray-700 mb-1">
                        프로필 이미지 URL
                    </label>
                    <input
                        id="profileImageUrl"
                        type="text"
                        name="profileImageUrl"
                        defaultValue={initialData.profileImageUrl || ""}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${state.fieldErrors?.profileImageUrl ? "border-red-500" : "border-gray-300"
                            }`}
                    />
                    {state.fieldErrors?.profileImageUrl && (
                        <p className="mt-1 text-xs text-red-500">{state.fieldErrors.profileImageUrl}</p>
                    )}
                </div>

                {/* 사업자 정보 */}
                <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-md font-semibold text-gray-800 mb-4">사업자 정보 (선택)</h3>
                    <input type="hidden" name="businessInfo" value="true" />
                    <div className="space-y-4">
                        {/* 상호명 */}
                        <div>
                            <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                                상호명
                            </label>
                            <input
                                id="businessName"
                                type="text"
                                name="businessName"
                                defaultValue={initialData.businessInfo?.businessName || ""}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${state.fieldErrors?.['businessInfo.businessName'] ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {/* ✅ 수정: 점표기법 키로 접근 */}
                            {state.fieldErrors?.['businessInfo.businessName'] && (
                                <p className="mt-1 text-xs text-red-500">
                                    {state.fieldErrors['businessInfo.businessName']}
                                </p>
                            )}
                        </div>

                        {/* 대표자명 */}
                        <div>
                            <label htmlFor="ceoName" className="block text-sm font-medium text-gray-700 mb-1">
                                대표자명
                            </label>
                            <input
                                id="ceoName"
                                type="text"
                                name="ceoName"
                                defaultValue={initialData.businessInfo?.ceoName || ""}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${state.fieldErrors?.['businessInfo.ceoName'] ? "border-red-500" : "border-gray-300"
                                    }`}
                            />
                            {/* ✅ 수정: 점표기법 키로 접근 */}
                            {state.fieldErrors?.['businessInfo.ceoName'] && (
                                <p className="mt-1 text-xs text-red-500">
                                    {state.fieldErrors['businessInfo.ceoName']}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-2">
                <SubmitButton />
            </div>
        </form>
    );
}