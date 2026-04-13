// app/page.tsx
'use client';

export default function HomePage() {
  // 더미 데이터 (나중에 API 연동 시 사용)
  const placeholderBooks = [1, 2, 3, 4];

  return (
    <main className="flex-grow bg-gray-50 min-h-screen pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* 1. 상단 카테고리 메뉴 (상품 전체 조회) */}
        <nav className="bg-white rounded-lg shadow-sm overflow-hidden">
          <ul className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y border border-gray-200">
            {['상품 전체 조회', '신간 도서', '베스트셀러', '이벤트 상품'].map((item) => (
              <li key={item}>
                <button className="w-full py-3 text-center font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition">
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* 2. 진행중인 이벤트 배너 */}
        <section className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-md overflow-hidden text-white">
          <div className="px-8 py-12 md:py-16 text-center">
            <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-semibold mb-4 backdrop-blur-sm">
              HOT EVENT
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">진행중인 이벤트</h2>
            <p className="text-blue-100 max-w-2xl mx-auto">
              신규 회원가입 시 도서 할인 쿠폰을 지급합니다. 지금 바로 확인하세요!
            </p>
            <button className="mt-6 px-6 py-3 bg-white text-blue-600 font-bold rounded-lg shadow hover:bg-gray-50 transition">
              이벤트 보기
            </button>
          </div>
        </section>

        {/* 3. 인기 도서 / 최신 도서 (2 Column) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* 인기 도서 */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">🔥 인기 도서</h3>
              <button className="text-sm text-blue-600 font-medium hover:underline">더보기 &gt;</button>
            </div>
            <div className="space-y-4">
              {placeholderBooks.map((i) => (
                <div key={`popular-${i}`} className="flex items-center p-3 border rounded-md hover:shadow-md transition bg-gray-50">
                  <div className="w-12 h-16 bg-gray-300 rounded mr-4 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gray-700">베스트셀러 도서 제목 {i}</p>
                    <p className="text-sm text-gray-500">저자 이름 • 15,000 원</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 최신 도서 */}
          <section className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">✨ 최신 도서</h3>
              <button className="text-sm text-blue-600 font-medium hover:underline">더보기 &gt;</button>
            </div>
            <div className="space-y-4">
              {placeholderBooks.map((i) => (
                <div key={`new-${i}`} className="flex items-center p-3 border rounded-md hover:shadow-md transition bg-gray-50">
                  <div className="w-12 h-16 bg-gray-300 rounded mr-4 flex-shrink-0"></div>
                  <div>
                    <p className="font-semibold text-gray-700">신간 도서 제목 {i}</p>
                    <p className="text-sm text-gray-500">저자 이름 • 18,000 원</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </main>
  );
}