import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

import { StorageService } from '@/services/storage/storageService';

import { translations, type TranslationLang } from './translations';

const LANGUAGE_KEY = '@hikmah_language';
const SUPPORTED: TranslationLang[] = ['en', 'ar', 'bn', 'ur'];

// Detect device language
const getDeviceLanguage = (): TranslationLang => {
  const deviceLang = Localization.getLocales()[0]?.languageCode || 'en';
  return (SUPPORTED as string[]).includes(deviceLang) ? (deviceLang as TranslationLang) : 'en';
};

// Check if RTL
export const isRTL = (lang: string): boolean => {
  return ['ar', 'ur'].includes(lang);
};

const applyRTL = (lang: string): void => {
  const rtl = isRTL(lang);
  // allowRTL must be set before forceRTL takes effect; full effect needs a restart.
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
};

// Initialize i18n
export const initI18n = async (): Promise<void> => {
  const savedLang = await StorageService.getItem<string>(LANGUAGE_KEY);
  const language: TranslationLang =
    savedLang && (SUPPORTED as string[]).includes(savedLang)
      ? (savedLang as TranslationLang)
      : getDeviceLanguage();

  applyRTL(language);

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: translations.en },
      ar: { translation: translations.ar },
      bn: { translation: translations.bn },
      ur: { translation: translations.ur },
    },
    lng: language,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
};

// Change language (takes full effect after app restart for RTL layout)
export const changeLanguage = async (lang: string): Promise<void> => {
  await i18n.changeLanguage(lang);
  await StorageService.setItem(LANGUAGE_KEY, lang);
  applyRTL(lang);
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language;
};

// Get supported languages
export const getSupportedLanguages = () => [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isRTL: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRTL: true },
];

export default i18n;
