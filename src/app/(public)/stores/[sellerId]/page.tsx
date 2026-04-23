// store/[sellerId]/page.tsx
import { Suspense } from "react";
import { FeedsSection } from "@/components/feed/FeedsSection";
import { FeaturedProductsSection } from "@/components/stores/FeaturedProductsSection";
import { StoreProfile } from "@/components/stores/StoreProfile";
import { fetchSellerPulbicInfo } from "@/lib/services/userService";

interface PageProps {
  params: Promise<{ sellerId: string }>;
}

// 로딩 스켈레톤
function SectionSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3"></div>
      <div className="h-32 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default async function SellerProfilePage({ params }: PageProps) {
  const { sellerId } = await params;
  const seller = await fetchSellerPulbicInfo(sellerId);

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="sr-only">스토어 프로필 - {sellerId}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 메인 콘텐츠 영역 */}
          <div className="lg:col-span-3 space-y-6">
            {seller.bio && (
              <section
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                data-testid="seller-intro-section"
              >
                <div className="border-b border-gray-100 bg-gradient-to-r from-amber-50 via-white to-sky-50 px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                    About
                  </p>
                </div>
                <div className="px-6 py-5">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {seller.bio}
                  </p>
                </div>
              </section>
            )}

            <Suspense fallback={<SectionSkeleton />}>
              <FeaturedProductsSection sellerId={sellerId} />
            </Suspense>

            <Suspense fallback={<SectionSkeleton />}>
              <FeedsSection sellerId={sellerId} seller={seller} />
            </Suspense>
          </div>

          {/* 사이드바 */}
          <div className="lg:col-span-1">
            <Suspense fallback={<SectionSkeleton />}>
              <StoreProfile sellerId={sellerId} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
