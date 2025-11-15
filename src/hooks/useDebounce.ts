import { useState, useEffect } from 'react';

/**
 * Hook để debounce giá trị, hữu ích cho input fields
 * @param value Giá trị cần debounce
 * @param delay Thời gian delay (ms)
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

