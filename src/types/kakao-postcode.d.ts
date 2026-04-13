// types/kakao-postcode.d.ts
export interface KakaoPostcodeData {
    zonecode: string;           // 우편번호
    address: string;            // 지번 주소
    roadAddress: string;        // 도로명 주소
    jibunAddress: string;       // 지번 주소 (구주소)
    buildingName: string;       // 건물명
    apartment: string;          // 공동주택 여부 (Y/N)
    bname: string;              // 법정동명
    userSelectedType: 'R' | 'J'; // 사용자 선택 주소 유형
    autoRoadAddress: string;    // 자동 선택 도로명 주소
    autoJibunAddress: string;   // 자동 선택 지번 주소
  }
  
  export interface KakaoPostcodeOptions {
    oncomplete: (data: KakaoPostcodeData) => void;
    width?: string;
    height?: string;
    animation?: boolean;
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