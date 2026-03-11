/**
 * Cau hinh cac API dich thuat
 * Gom URL, tham so va thu tu uu tien cho tung cap ngon ngu
 */

/** Base URL DeepL API - :fx = free key dung api-free */
export const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

/** Lay DeepL API key tu bien moi truong (dat trong .env.local) */
export const getDeepLApiKey = (): string => {
  return import.meta.env.VITE_DEEPL_API_KEY || '';
};

/** Map ma ngon ngu noi bo sang ma DeepL (Viet hoa) */
export const DEEPL_LANG_MAP: Record<string, string> = {
  zh: 'ZH',
  vi: 'VI',
  en: 'EN'
};

/** Key luu lua chon nguon dich trong localStorage */
export const TRANSLATION_PROVIDER_KEY = 'translation_provider';

/** Cac nguon dich co the chon */
export type TranslationProvider = 'auto' | 'deepl' | 'google' | 'mymemory';

/** Danh sach nguon dich hien thi tren GUI */
export const TRANSLATION_PROVIDERS: { id: TranslationProvider; label: string }[] = [
  { id: 'auto', label: 'Tự động (thử lần lượt)' },
  { id: 'deepl', label: 'DeepL (chất lượng cao)' },
  { id: 'google', label: 'Google Translate' },
  { id: 'mymemory', label: 'MyMemory' }
];
