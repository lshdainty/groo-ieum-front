import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 각 언어별 네임스페이스 import
import koCommon from '@/locales/ko/common.json'
import koLogin from '@/locales/ko/login.json'
import koSidebar from '@/locales/ko/sidebar.json'
import koAdmin from '@/locales/ko/admin.json'
import koVacation from '@/locales/ko/vacation.json'
import koDashboard from '@/locales/ko/dashboard.json'
import koWork from '@/locales/ko/work.json'
import koCulture from '@/locales/ko/culture.json'
import koAuth from '@/locales/ko/auth.json'
import koUser from '@/locales/ko/user.json'
import koCalendar from '@/locales/ko/calendar.json'
import koNotice from '@/locales/ko/notice.json'
import koDs from '@/locales/ko/ds.json'

import enCommon from '@/locales/en/common.json'
import enLogin from '@/locales/en/login.json'
import enSidebar from '@/locales/en/sidebar.json'
import enAdmin from '@/locales/en/admin.json'
import enVacation from '@/locales/en/vacation.json'
import enDashboard from '@/locales/en/dashboard.json'
import enWork from '@/locales/en/work.json'
import enCulture from '@/locales/en/culture.json'
import enAuth from '@/locales/en/auth.json'
import enUser from '@/locales/en/user.json'
import enCalendar from '@/locales/en/calendar.json'
import enNotice from '@/locales/en/notice.json'
import enDs from '@/locales/en/ds.json'

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES = ['ko', 'en'] as const
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]

// 언어 표시 이름
export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  ko: '한국어',
  en: 'English'
}

// 네임스페이스 목록
export const NAMESPACES = [
  'common',
  'login',
  'sidebar',
  'admin',
  'vacation',
  'dashboard',
  'work',
  'culture',
  'auth',
  'user',
  'calendar',
  'notice',
  'ds'
] as const
export type Namespace = typeof NAMESPACES[number]

// 리소스 번들
const resources = {
  ko: {
    common: koCommon,
    login: koLogin,
    sidebar: koSidebar,
    admin: koAdmin,
    vacation: koVacation,
    dashboard: koDashboard,
    work: koWork,
    culture: koCulture,
    auth: koAuth,
    user: koUser,
    calendar: koCalendar,
    notice: koNotice,
    ds: koDs
  },
  en: {
    common: enCommon,
    login: enLogin,
    sidebar: enSidebar,
    admin: enAdmin,
    vacation: enVacation,
    dashboard: enDashboard,
    work: enWork,
    culture: enCulture,
    auth: enAuth,
    user: enUser,
    calendar: enCalendar,
    notice: enNotice,
    ds: enDs
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    defaultNS: 'common',
    ns: NAMESPACES,

    interpolation: {
      escapeValue: false // React가 XSS 방지를 처리함
    },

    detection: {
      // 언어 감지 순서
      order: ['localStorage', 'navigator'],
      // localStorage에 저장할 키
      lookupLocalStorage: 'i18nextLng',
      // 캐시 저장소
      caches: ['localStorage']
    }
  })

// 문서 언어를 화면 언어에 맞춘다(낭독기 · 하이픈 · 글꼴 선택) — index.html 의 lang 은 한국어가 기본값
const syncDocumentLang = (lng: string | undefined) => {
  document.documentElement.lang = lng?.startsWith('en') ? 'en' : 'ko'
}
syncDocumentLang(i18n.resolvedLanguage)
i18n.on('languageChanged', syncDocumentLang)

export default i18n
