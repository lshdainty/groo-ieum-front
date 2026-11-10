import { ConfirmDialog } from '@/shared/ui/confirm'
import { formatDayText } from '@/shared/lib/date-text'
import type { WorkRow } from '../model/types'
import { useTranslation } from 'react-i18next'

/**
 * 업무 기록 삭제 확인(22-3 #1) — "업무 기록 삭제" · "{날짜} 업무 기록을 삭제할까요? …되돌릴 수 없어요." 확인만.
 * 실패는 확인창을 닫고 Snackbar + [다시 시도](ConfirmDialog 가 한다).
 */
export function ReportDeleteDialog({
  target,
  open,
  onOpenChange,
  onConfirm,
  onDone,
}: {
  target: WorkRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 지운다 — 실패하면 던진다 */
  onConfirm: () => Promise<unknown>
  onDone?: () => void
}) {
  const { t } = useTranslation('work')
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('rep.deleteTitle')}
      description={t('rep.deleteConfirm', { date: target ? formatDayText(target.date) : '' })}
      onConfirm={onConfirm}
      onDone={onDone}
    />
  )
}
