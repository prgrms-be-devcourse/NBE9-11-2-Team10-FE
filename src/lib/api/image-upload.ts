import { ApiEnvelope } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type PresignedUrlResponse = {
  uploadUrl: string;
  imageUrl: string;
};

function normalizeEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    payload.data !== undefined
  ) {
    return payload.data;
  }

  return payload as T;
}

export async function uploadImageFile(
  file: File,
  directory = "default",
): Promise<string> {
  const presignedResponse = await fetch(`${API_BASE_URL}/api/v1/images/presigned-url`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      directory,
    }),
  });

  if (!presignedResponse.ok) {
    const errorText = await presignedResponse.text();
    throw new Error(
      `업로드 URL 발급에 실패했습니다. (${presignedResponse.status}) ${errorText}`,
    );
  }

  const presignedPayload = (await presignedResponse.json()) as
    | ApiEnvelope<PresignedUrlResponse>
    | PresignedUrlResponse;
  const presigned = normalizeEnvelope(presignedPayload);

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(
      `이미지 업로드에 실패했습니다. (${uploadResponse.status}) ${errorText}`,
    );
  }

  return presigned.imageUrl;
}
