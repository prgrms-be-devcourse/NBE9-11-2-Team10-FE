// components/common/AddressSearchInput.tsx (리팩토링 버전)
'use client';

import { useEffect, useState } from 'react';
import { useKakaoPostcode } from '@/hooks/useKakaoPostcode';
import { KakaoPostcodeData } from '@/types/kakao-postcode';

interface Props {
  // ✅ Controlled: 외부에서 값 관리 (주문 폼용)
  value?: string;
  onChange?: (value: string) => void;
  
  // ✅ Uncontrolled: 내부에서 값 관리 (회원가입 폼용, 하위 호환)
  defaultValue?: string;
  name?: string;
  
  // 공통
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const AddressSearchInput = ({ 
  value: controlledValue,
  onChange,
  defaultValue = '',
  name = 'roadAddress',
  placeholder = '도로명 주소를 입력하세요',
  error,
  disabled = false,
  className = '',
}: Props) => {
  // ✅ Uncontrolled 모드일 때만 내부 상태 사용
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  
  // 현재 사용할 값 결정 (controlled 우선)
  const currentValue = controlledValue !== undefined ? controlledValue : uncontrolledValue;

  const handlePostcodeComplete = (data: KakaoPostcodeData) => {
    const newValue = data.roadAddress;
    
    if (onChange) {
      // ✅ Controlled: 외부 상태 업데이트
      onChange(newValue);
    } else {
      // ✅ Uncontrolled: 내부 상태 업데이트
      setUncontrolledValue(newValue);
    }
  };

  const { openPostcode, isLoading } = useKakaoPostcode(handlePostcodeComplete);

  // ✅ defaultValue 변경 시 내부 상태 동기화 (Uncontrolled 모드용)
  useEffect(() => {
    if (controlledValue === undefined) {
      setUncontrolledValue(defaultValue);
    }
  }, [defaultValue, controlledValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    } else {
      setUncontrolledValue(newValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <input
          type="text"
          name={name}
          value={currentValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 px-3 py-2.5 border rounded-lg text-sm ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100' : ''} text-gray-900`}
        />
        <button
          type="button"
          onClick={openPostcode}
          disabled={disabled || isLoading}
          className="px-4 py-2.5 bg-gray-800 text-white text-sm rounded-lg whitespace-nowrap disabled:opacity-50"
        >
          {isLoading ? '로딩...' : '주소 검색'}
        </button>
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};