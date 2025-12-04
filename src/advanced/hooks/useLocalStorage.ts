import { useState, useEffect } from "react";

/**
 * useLocalStorage - localStorage와 React state 동기화 훅
 *
 * 책임: localStorage 읽기/쓰기, JSON 직렬화/역직렬화, 에러 처리
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed;
      } catch {
        return initialValue;
      }
    }
    return initialValue;
  });

  useEffect(() => {
    // 빈 배열이면 localStorage에서 삭제
    if (Array.isArray(storedValue) && storedValue.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(storedValue));
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

