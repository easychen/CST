import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslation from './locales/en.json';
import zhTranslation from './locales/zh.json';

// 获取系统语言
const getDefaultLanguage = () => {
  // 首先检查本地存储中是否有语言设置
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage) {
    return savedLanguage;
  }

  // 获取浏览器语言设置
  const browserLang = navigator.language.toLowerCase();
  
  // 如果浏览器语言以 zh 开头（如 zh-CN, zh-TW 等），返回 zh，否则返回 en
  return browserLang.startsWith('zh') ? 'zh' : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation,
      },
      zh: {
        translation: zhTranslation,
      },
    },
    lng: getDefaultLanguage(),
    fallbackLng: 'en', // 如果检测到的语言不支持，默认使用英语
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 