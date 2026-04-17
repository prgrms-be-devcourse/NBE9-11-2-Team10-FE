// components/auth/AddressSearchInput.tsx
'use client';

import { useState } from 'react';
import { useKakaoPostcode } from '@/hooks/useKakaoPostcode';
import { KakaoPostcodeData } from '@/types/kakao-postcode';

interface Props {
  roadAddress: string;
  error?: string;
  disabled?: boolean;
}

export const AddressSearchInput = ({ 
  roadAddress,
  error,
  disabled 
}: Props) => {
  const [inputRoadAddress, setInputRoadAddress] = useState(roadAddress);

  const handlePostcodeComplete = (data: KakaoPostcodeData) => {
    setInputRoadAddress(data.roadAddress);
  };

  const { openPostcode, isLoading } = useKakaoPostcode(handlePostcodeComplete);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          name="roadAddress"
          value={inputRoadAddress}
          onChange={(e) => {
            setInputRoadAddress(e.target.value);
          }}
          placeholder="도로명 주소"
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