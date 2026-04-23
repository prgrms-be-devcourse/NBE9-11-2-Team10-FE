import { Metadata } from 'next';
import Link from 'next/link';
import ProductForm from '@/components/products/ProductForm';
import { handleCreateProduct } from '@/lib/actions/product.actions';
import SellerGuard from '@/components/auth/SellerGuard';
import AccessDenied from '@/components/auth/AccessDenied';

export const metadata: Metadata = {
    title: '새 상품 등록 | 판매자 센터',
    description: '새로운 상품을 등록하여 판매를 시작하세요.',
};

export default async function NewProductPage() {
    return (
        <SellerGuard fallback={<AccessDenied requiredRole="SELLER" />}>
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">

                    {/* 🔹 Breadcrumb Navigation */}
                    <nav className="mb-8" aria-label="breadcrumb">
                        <ol className="flex items-center gap-2 text-sm text-gray-500">
                            <li>
                                <Link href="/seller/dashboard" className="hover:text-blue-600 transition-colors">
                                    대시보드
                                </Link>
                            </li>
                            <li className="text-gray-300">/</li>
                            <li>
                                <Link href="/seller/products" className="hover:text-blue-600 transition-colors">
                                    상품 관리
                                </Link>
                            </li>
                            <li className="text-gray-300">/</li>
                            <li className="text-gray-900 font-medium" aria-current="page">
                                새 상품 등록
                            </li>
                        </ol>
                    </nav>

                    {/* 🔹 Page Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">새 상품 등록</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            판매할 상품의 정보를 입력해 주세요. <span className="text-red-500">*</span> 표시는 필수 항목입니다.
                        </p>
                    </div>

                    {/* 🔹 Form Container */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                        <ProductForm
                            action={handleCreateProduct}
                            mode="create"
                        />
                    </div>
                </div>
            </div>
        </SellerGuard>
    );
}