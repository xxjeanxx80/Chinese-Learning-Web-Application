import { useState, useEffect } from 'react';

export function useCustomBackground() {
  const [customBackground, setCustomBackground] = useState<string | null>(() => {
    return localStorage.getItem('custom_app_background');
  });

  // Áp dụng background
  useEffect(() => {
    if (customBackground) {
      document.body.style.backgroundImage = `url(${customBackground})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.animation = 'none'; // Tắt animation liquidBg để ảnh đứng im
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.animation = '';
    }
  }, [customBackground]);

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Giới hạn size < 5MB để tránh quất đầy LocalStorage
      if (file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh nhỏ hơn 5MB để đảm bảo hiệu năng!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setCustomBackground(base64String);
        try {
          localStorage.setItem('custom_app_background', base64String);
        } catch (error) {
          console.error('LocalStorage quota exceeded:', error);
          alert('Ảnh này có độ phân giải quá cao không thể lưu lại cho lần sau. Tuy vậy nền vẫn sẽ được áp dụng tạm thời.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomBackground = () => {
    setCustomBackground(null);
    localStorage.removeItem('custom_app_background');
  };

  return {
    customBackground,
    handleBackgroundUpload,
    removeCustomBackground
  };
}
