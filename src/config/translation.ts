/**
 * Cau hinh cac API dich thuat
 * Gom URL, tham so va thu tu uu tien cho tung cap ngon ngu
 */

/**
 * URL proxy DeepL - goi qua backend vi DeepL chan CORS tu browser.
 * Dat DEEPL_API_KEY trong Vercel Environment Variables.
 */
export const DEEPL_PROXY_URL = '/api/deepl-translate';

/** Map ma ngon ngu noi bo sang ma DeepL (Viet hoa) */
export const DEEPL_LANG_MAP: Record<string, string> = {
  zh: 'ZH',
  vi: 'VI',
  en: 'EN'
};

/** Key luu lua chon nguon dich trong localStorage */
export const TRANSLATION_PROVIDER_KEY = 'translation_provider';

/** Cac nguon dich co the chon */
export type TranslationProvider = 'auto' | 'deepl' | 'google';

/** Danh sach nguon dich hien thi tren GUI */
export const TRANSLATION_PROVIDERS: { id: TranslationProvider; label: string }[] = [
  { id: 'auto', label: 'Tự động (thử lần lượt)' },
  { id: 'deepl', label: 'DeepL (chất lượng cao)' },
  { id: 'google', label: 'Google Translate' }
];
