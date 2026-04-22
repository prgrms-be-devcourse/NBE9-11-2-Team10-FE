// src/app/(store-management)/stores/[sellerId]/layout.tsx
import StoreOwnerGuard from "@/components/auth/StoreOwnerGuard";
import AccessDenied from "@/components/auth/AccessDenied";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ sellerId: string }>;
}

export default async function StoreManagementLayout({ 
  children, 
  params 
}: LayoutProps) {
  const { sellerId } = await params;

  return (
    <StoreOwnerGuard 
      sellerId={sellerId}
      fallback={
        <AccessDenied 
          requiredRole="SELLER" 
          message="본인의 스토어만 관리할 수 있습니다."
        />
      }
    >
      {children}
    </StoreOwnerGuard>
  );
}