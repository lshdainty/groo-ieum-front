import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

import { grantTimeText } from '@/shared/lib/groo/grant-time-text'

/** 컴포넌트에서 쓰는 `grantTimeText` — `vacation` 네임스페이스 · 지금 언어를 알아서 쓴다. 숫자(서버 grant_time 단위)가 없으면 서버 글 그대로 */
export const useGrantTimeText = (): ((value: number | null | undefined, serverText: string) => string) => {
  const { t, i18n } = useTranslation('vacation')
  const language = i18n.language
  return useCallback((value, serverText) => grantTimeText(value, serverText, language, t), [language, t])
}
