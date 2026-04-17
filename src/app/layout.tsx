// app/layout.tsx
import './globals.css'; // Tailwind CSS 설정 파일
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: '텐텐 - 당신의 서재',
  description: '도서 판매 및 구매 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
        
        {/* 상단 헤더 (모든 페이지 공통) */}
        <Header />

        {/* 페이지 콘텐츠 */}
        {children}

        {/* 하단 푸터 (모든 페이지 공통) */}
        <Footer />
        
      </body>
    </html>
  );
}