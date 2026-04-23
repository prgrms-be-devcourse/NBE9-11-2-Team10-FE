// src/app/stores/[sellerId]/feeds/new/page.tsx
import { FeedForm } from "@/components/feed/FeedForm";

interface PageProps {
  params: Promise<{ sellerId: string }>;
}

export default async function CreateFeedPage({ params }: PageProps) {
  const { sellerId } = await params;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          새 피드 작성
        </h1>
        <FeedForm mode="create" sellerId={sellerId} />
      </div>
    </div>
  );
}