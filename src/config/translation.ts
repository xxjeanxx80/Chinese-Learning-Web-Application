/**
 * Cau hinh cac API dich thuat
 * Gom URL, tham so va thu tu uu tien cho tung cap ngon ngu
 */

/** Base URL cua LibreTranslate (API open source, dich Trung-Viet chuan) */
export const LIBRETRANSLATE_URL = 'https://libretranslate.com/translate';

/** Map ma ngon ngu noi bo sang ma LibreTranslate (zh-Hans = Han gian the) */
export const LIBRE_LANG_MAP: Record<string, string> = {
  zh: 'zh-Hans',
  vi: 'vi',
  en: 'en'
};

/** Key luu lua chon nguon dich trong localStorage */
export const TRANSLATION_PROVIDER_KEY = 'translation_provider';

/** Cac nguon dich co the chon */
export type TranslationProvider = 'auto' | 'libre' | 'google' | 'mymemory';

/** Danh sach nguon dich hien thi tren GUI */
export const TRANSLATION_PROVIDERS: { id: TranslationProvider; label: string }[] = [
  { id: 'auto', label: 'Tự động (thử lần lượt)' },
  { id: 'libre', label: 'LibreTranslate (Trung-Việt chuẩn)' },
  { id: 'google', label: 'Google Translate' },
  { id: 'mymemory', label: 'MyMemory' }
];
