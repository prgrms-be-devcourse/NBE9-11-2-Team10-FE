// types/tosspayments.d.ts

// ------ 결제 요청 옵션 ------
export interface TossPaymentAmount {
    currency: "KRW";
    value: number;
  }
  
  export interface TossPaymentCardOptions {
    useEscrow: boolean;
    flowMode: "DEFAULT" | "DIRECT";
    useCardPoint: boolean;
    useAppCardOnly: boolean;
  }
  
  export interface TossPaymentRequestOptions {
    method: "CARD"; // 필요시 다른 수단도 추가 가능
    amount: TossPaymentAmount;
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerEmail?: string;
    customerName?: string;
    customerMobilePhone?: string;
    card?: TossPaymentCardOptions;
  }
  
  // ------ 인스턴스 타입 ------
  export interface PaymentInstance {
    requestPayment: (options: TossPaymentRequestOptions) => Promise<void>;
  }
  
  export interface TossPaymentsInstance {
    payment: (options: { customerKey?: string }) => PaymentInstance;
    // 필요시 다른 메서드들 추가: widget(), etc.
  }
  
  // ------ 메인 SDK 타입 (callable + 정적 프로퍼티) ------
  export interface TossPaymentsSDK {
    // ✅ 호출 가능한 함수
    (clientKey: string): TossPaymentsInstance;
    
    // ✅ 정적 프로퍼티
    readonly ANONYMOUS: string;
  }
  
  // ------ 글로벌 선언 ------
  declare global {
    interface Window {
      // ✅ TossPayments 는 존재할 수도, 없을 수도 있음 (스크립트 로딩 전)
      TossPayments?: TossPaymentsSDK;
    }
  }
  
  // ✅ 모듈 확장을 위해 export 필요
  export {};