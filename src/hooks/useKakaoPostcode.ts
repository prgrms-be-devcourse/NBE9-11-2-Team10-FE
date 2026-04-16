// hooks/useKakaoPostcode.ts
import { useCallback, useState } from 'react';
import { loadKakaoPostcode } from '@/utils/loadKakaoPostcode';
import type { KakaoPostcodeData, KakaoPostcodeOptions } from '@/types/kakao-postcode';

interface UseKakaoPostcodeReturn {
  openPostcode: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

export const useKakaoPostcode = (
  onAddressSelected: (data: KakaoPostcodeData) => void,
  options?: Omit<KakaoPostcodeOptions, 'oncomplete'>
): UseKakaoPostcodeReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const openPostcode = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      await loadKakaoPostcode();
      
      const postcode = new window.kakao.Postcode({
        oncomplete: (data: KakaoPostcodeData) => {
          onAddressSelected(data);
        },
        ...options,
      });
      
      postcode.open();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [onAddressSelected, options]);

  return { openPostcode, isLoading, error };
};