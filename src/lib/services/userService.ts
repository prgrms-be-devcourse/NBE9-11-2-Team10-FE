import { SellerPublicResponse } from "@/types/auth";

type ApiResponse<T> = {
    success: boolean;
    data: T;
  };

  export async function fetchSellerPulbicInfo(
    sellerId: string
  ): Promise<SellerPublicResponse> {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/sellers/${sellerId}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );
  
    if (!res.ok) {
      throw new Error("판매자 조회 실패");
    }
  
    const result = (await res.json()) as ApiResponse<SellerPublicResponse>;
  
    return result.data;
  }