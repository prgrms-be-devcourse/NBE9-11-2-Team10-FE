// components/layout/Footer.tsx
'use client';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center text-center md:text-left">
          
          {/* SNS 버튼 */}
          <div className="flex justify-center md:justify-start gap-4">
            {['Instagram', 'Facebook', 'Twitter'].map((sns) => (
              <button 
                key={sns} 
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition"
              >
                {sns}
              </button>
            ))}
          </div>

          {/* 사업자 소개 */}
          <div className="text-center">
            <h4 className="font-bold text-gray-800 mb-2">사업자 소개</h4>
            <p className="text-sm text-gray-500">
              (주)텐텐 | 대표이사: 홍길동<br/>
              사업자등록번호: 123-45-67890
            </p>
          </div>

          {/* 고객센터 */}
          <div className="flex justify-center md:justify-end">
            <button className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition">
              고객센터
            </button>
          </div>

        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          © 2026 Tenten Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}