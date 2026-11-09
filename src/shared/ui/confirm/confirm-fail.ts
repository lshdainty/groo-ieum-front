import { isAxiosError } from 'axios'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { claimFailure, writeFailureKey } from '@/shared/api/failure'
import { useSnackbar, type SnackbarApi } from '@/shared/ds/snackbar'

/*
 * 확인창 뒤 요청이 실패했을 때의 표시 — alert-dialog.md "요청이 실패하면": 확인창을 닫고 critical Snackbar(액션이 있어 6초) +
 * [다시 시도](다시 묻지 않고 같은 요청을 바로 한다 — 사용자는 이미 확인했다). 확인창이 닫힌 뒤에 띄워 창 위에 겹치지 않는다.
 *
 * 글은 서버 글이 아니라 고정 글이다 — 실패 사유는 shared/api/failure.ts 의 사유 표(writeFailureKey)로 고른다.
 * 응답을 못 받은 쓰기는 지워졌는지 알 수 없으므로 "지워졌는지 확인하지 못했어요" 로 말하고 [다시 시도] 를 두지 않는다
 * (다시 하면 두 번 될 수 있다) — 목록은 다시 받아 서버 값으로 맞춘다.
 *
 * 폼이 뒤에 열려 있어 고쳐서 다시 저장하는 흐름은 이게 아니다 — 폼 맨 위 Callout 이 맞다(alert-dialog.md 예외).
 */

/** 확인창이 하는 일의 종류 — 실패 글의 동사를 정한다 */
export type ConfirmKind = 'delete' | 'cancel'

/** 실패 글 키(common 이름공간) — 401 은 로그인으로 넘어가는 길이 따로 있어 알리지 않는다(null) */
export const confirmFailureKey = (error: unknown, kind: ConfirmKind): string | null => {
  const key = writeFailureKey(error)
  if (key === null) return null
  // 일반 실패는 "저장" 이 아니라 이 확인창의 동사로 말한다 — 사유 글(권한 · 코드별)은 그대로
  // 5xx · 네트워크는 "잠시 뒤 다시 시도", 사유 코드가 없는 4xx 는 "내용을 확인해주세요"(22-1 규칙과 같다)
  if (key === 'failure.write') return `failure.${kind}`
  if (key === 'failure.writeInput') return `failure.${kind}Input`
  if (key === 'failure.unconfirmed') return `failure.${kind}Unconfirmed`
  return key
}

/** [다시 시도] 는 5xx · 네트워크처럼 다시 하면 달라질 수 있는 실패에만 붙인다 — 4xx 사유(지울 수 없음 · 권한 …)는 다시 해도 같다 */
export const canRetryFailure = (error: unknown): boolean =>
  !isAxiosError(error) || (error.response?.status ?? 500) >= 500

export interface ConfirmFailOptions {
  /** 실패의 오류 — 사유 글을 고르는 데 쓴다 */
  error: unknown
  kind: ConfirmKind
  /** [다시 시도] 로 하는 요청 — 묻지 않고 바로 한다. 실패하면 던진다(같은 띠가 다시 뜬다) */
  retry: () => Promise<unknown> | void
  /** 다시 시도가 성공했을 때 */
  onRetried?: () => void
}

type Translate = (key: string) => string

export function showConfirmFail(
  snackbar: SnackbarApi,
  t: Translate,
  options: ConfirmFailOptions,
  onUnconfirmed?: () => void,
): void {
  const { error, kind, retry, onRetried } = options
  claimFailure(error)
  const key = confirmFailureKey(error, kind)
  if (!key) return
  if (key === `failure.${kind}Unconfirmed`) {
    onUnconfirmed?.()
    snackbar.show({ message: t(key), tone: 'critical' })
    return
  }
  if (!canRetryFailure(error)) {
    snackbar.show({ message: t(key), tone: 'critical' })
    return
  }
  snackbar.show({
    message: t(key),
    tone: 'critical',
    action: {
      label: t('retry'),
      onClick: () => {
        Promise.resolve()
          .then(retry)
          .then(
            () => onRetried?.(),
            (e: unknown) => showConfirmFail(snackbar, t, { ...options, error: e }, onUnconfirmed),
          )
      },
    },
  })
}

/** 컴포넌트에서 쓰는 길 — `common` 글 · Snackbar · 확인 못 한 쓰기 뒤 목록 다시 받기를 묶는다 */
export function useConfirmFail(): (options: ConfirmFailOptions) => void {
  const snackbar = useSnackbar()
  const queryClient = useQueryClient()
  const { t } = useTranslation('common')
  return (options) =>
    showConfirmFail(snackbar, t as Translate, options, () => {
      void queryClient.invalidateQueries()
    })
}
