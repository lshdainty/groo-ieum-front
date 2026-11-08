import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import { useSnackbar } from '@/shared/ds/snackbar'
import { setWriteFailureHandler } from '@/shared/api/failure'

/** 호출처가 알리지 않은 쓰기 실패 · 읽기 실패 그물을 고정 글 Snackbar 로 알린다(critical — 다시 하면 되는 실패). 서버 글은 쓰지 않는다 */
export function WriteFailureBridge() {
  const snackbar = useSnackbar()
  const { t } = useTranslation('common')
  useEffect(
    () =>
      setWriteFailureHandler((key) => {
        snackbar.show({ message: t(key), tone: 'critical' })
      }),
    [snackbar, t],
  )
  return null
}
