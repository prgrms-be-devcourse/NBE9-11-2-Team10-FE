import FailPaymentClient from "@/components/order/payment/FailPaymentClient";

interface PageProps {
  searchParams: Promise<{
    code?: string;
    message?: string;
    orderId?: string;
  }>;
}

export default async function FailPaymentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  return (
    <FailPaymentClient
      errorCode={params.code || null}
      errorMessage={params.message || null}
      orderId={params.orderId || null}
    />
  );
}