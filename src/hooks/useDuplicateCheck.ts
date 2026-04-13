// hooks/useDuplicateCheck.ts
import { useState, useCallback } from 'react';
import { authApi } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/request';

export const useDuplicateCheck = (type: 'email' | 'nickname') => {
  const [isChecked, setIsChecked] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const trigger = useCallback(async (value: string) => {
    if (!value) return;
    
    // 간단 유효성 (이메일 형식 등) 은 Zod 스키마에서 걸러지지만, 
    // 중복체크 API 호출 전 최소한의 검사 가능
    
    setLoading(true);
    try {
      const rsData = await authApi.checkDuplicate(type, value);
      
      setIsChecked(true);
      if (rsData.data?.available) {
        setIsAvailable(true);
        setMessage(`사용 가능한 ${type === 'email' ? '이메일' : '닉네임'}입니다.`);
      } else {
        setIsAvailable(false);
        setMessage(`이미 사용 중인 ${type === 'email' ? '이메일' : '닉네임'}입니다.`);
      }
    } catch (err) {
      setIsChecked(false);
      setMessage('중복 확인 중 오류가 발생했습니다.');
      if (err instanceof ApiError) setMessage(err.message);
    } finally {
      setLoading(false);
    }
  }, [type]);

  return { trigger, isChecked, isAvailable, message, loading };
};