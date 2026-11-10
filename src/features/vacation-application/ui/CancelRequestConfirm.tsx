import { useTranslation } from 'react-i18next'

import { useSnackbar } from '@/shared/ds/snackbar'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { usePostCancelVacationRequestMutation, type GetUserRequestedVacationsResp } from '@/entities/vacation'
import { requestTitle } from '../lib/request-format'

/**
 * 신청 취소 확인창(#10) — 줄 · 상세 바닥이 같은 글을 쓴다. 닫는 단추는 "닫기"([취소] 와 [신청 취소] 가 헷갈려서).
 * 서버는 대기(PENDING)만 받으므로 눌렀을 때 목록의 지금 값을 다시 판단한다(`latest`). 실패는 ConfirmDialog 가 닫고 Snackbar + [다시 시도].
 */
export function CancelRequestConfirm({
  target,
  latest,
  userId,
  onOpenChange,
  onDone,
}: {
  target: GetUserRequestedVacationsResp | null
  /** 지금 목록의 같은 신청 — 없으면 target 으로 판단한다 */
  latest?: (id: number) => GetUserRequestedVacationsResp | undefined
  userId: string
  onOpenChange: (open: boolean) => void
  /** 취소가 끝났을 때(상세를 같이 닫는 자리) */
  onDone?: () => void
}) {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const { mutateAsync } = usePostCancelVacationRequestMutation()

  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={onOpenChange}
      kind='cancel'
      title={t('application.cancelTitle')}
      description={t('application.cancelConfirm', { title: target ? requestTitle(target) : '' })}
      confirmLabel={t('application.cancelAction')}
      cancelLabel={tc('close')}
      onConfirm={async () => {
        if (!target || !userId) return
        const now = latest?.(target.vacation_grant_id) ?? target
        if (now.grant_status !== 'PENDING') {
          // 서버가 거절할 상태 — 누르는 순간 다시 판단해 요청을 보내지 않는다
          snackbar.show({ message: t('req.cancelNotPending'), tone: 'critical' })
          return
        }
        await mutateAsync({ vacationGrantId: target.vacation_grant_id, userId })
        snackbar.show({ message: t('req.canceled'), tone: 'positive' })
        onDone?.()
      }}
    />
  )
}
