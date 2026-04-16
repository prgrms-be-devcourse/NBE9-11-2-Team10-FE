// types/kakao-postcode.d.ts
export interface KakaoPostcodeData {
  zonecode: string;           // 국가기초구역번호 (새 우편번호)
  address: string;            // 기본 주소 (검색 타입에 따라 지번/도로명)
  addressEnglish: string;     // 기본 영문 주소
  addressType: 'R' | 'J';     // 검색된 기본 주소 타입: R(도로명), J(지번)
  userSelectedType: 'R' | 'J'; // 사용자가 선택한 주소 타입
  noSelected: 'Y' | 'N';      // "선택 안함" 선택 여부
  userLanguageType: 'K' | 'E'; // 선택한 주소 언어 타입
  roadAddress: string;        // 도로명 주소
  roadAddressEnglish: string; // 영문 도로명 주소
  jibunAddress: string;       // 지번 주소
  jibunAddressEnglish: string;// 영문 지번 주소
  autoRoadAddress: string;    // 자동 매핑 도로명 주소
  autoRoadAddressEnglish: string;
  autoJibunAddress: string;   // 자동 매핑 지번 주소
  autoJibunAddressEnglish: string;
  buildingCode: string;       // 건물관리번호
  buildingName: string;       // 건물명
  apartment: 'Y' | 'N';       // 공동주택 여부
  sido: string;               // 시/도 이름
  sidoEnglish: string;
  sigungu: string;            // 시/군/구 이름
  sigunguEnglish: string;
  sigunguCode: string;        // 시/군/구 코드 (5자리)
  roadnameCode: string;       // 도로명 코드 (7자리)
  bcode: string;              // 법정동/리 코드
  roadname: string;           // 도로명 (건물번호 제외)
  roadnameEnglish: string;
  bname: string;              // 법정동/리 이름
  bnameEnglish: string;
  bname1: string;             // 법정리의 읍/면 이름 (동 지역은 공백)
  bname1English: string;
  bname2: string;             // 법정동/리 이름
  bname2English: string;
  hname: string;              // 행정동 이름
  query: string;              // 사용자 검색어
}

export interface KakaoPostcodeOptions {
  oncomplete: (data: KakaoPostcodeData) => void;
  width?: string;
  height?: string;
  animation?: boolean;
  autoMapping?: boolean;      // 자동 매핑 기능 제어 (기본 true)
  showMoreHname?: boolean;    // 행정동 더보기 버튼 표시 (기본 false)
}

export interface KakaoPostcode {
  open: () => void;
}

declare global {
  interface Window {
    kakao: {
      Postcode: new (options?: KakaoPostcodeOptions) => KakaoPostcode;
    };
  }
}