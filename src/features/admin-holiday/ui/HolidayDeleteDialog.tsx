import { GetHolidaysResp } from '@/entities/holiday'
import { ConfirmDialog } from '@/shared/ui/confirm'
import { useTranslation } from 'react-i18next'

interface HolidayDeleteDialogProps {
  holiday: GetHolidaysResp
  trigger: React.ReactNode
  /** 지운다 — 요청이면 실패할 때 던진다(확인창이 닫히고 실패 알림이 뜬다) */
  onDelete: (holiday_id: number) => Promise<unknown> | void
}

const HolidayDeleteDialog = ({ holiday, trigger, onDelete }: HolidayDeleteDialogProps) => {
  const { t } = useTranslation('admin')

  return (
    <ConfirmDialog
      trigger={trigger}
      title={t('holiday.deleteTitle')}
      description={t('holiday.deleteConfirm', { name: holiday.holiday_name })}
      onConfirm={() => onDelete(holiday.holiday_id)}
    />
  )
}

export { HolidayDeleteDialog }
