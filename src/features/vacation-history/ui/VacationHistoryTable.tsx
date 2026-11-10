import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { usePermission, useUser } from '@/entities/session'
import { useDeleteVacationUsageMutation, type GetUserVacationHistoryResp, type VacationUsageInfo } from '@/entities/vacation'
import { IEvent } from '@/features/calendar/model/interfaces'
import { calendarTypes } from '@/features/calendar/model/types'
import { EventFormDialog } from '@/features/calendar/ui/event-form-dialog'
import { isUpcoming } from '@/features/vacation-history/lib/record-format'
import { useSnackbar } from '@/shared/ds/snackbar'
import { formatDayText } from '@/shared/lib/date-text'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { VacationHistoryContent, type RecordsStatus } from './VacationHistoryContent'

export interface RecordOwner {
  id: string
  name: string
}

/**
 * 휴가 기록 + 고치기 · 지우기(I-25 C 14) — 시작 전 사용 기록에만 수정 · 삭제가 있다(서버가 시작 뒤를 거절).
 * 데스크톱 표 줄 끝 ⋮ = 수정 · 삭제, 폰 줄 누름 = 수정 폼(바닥 왼쪽 [삭제]). 삭제는 확인창을 지나 DELETE 하나.
 * 수정 폼은 그 줄의 시간 종류(`vacation_time_type`) · 쓴 휴가 종류(`vacation_type` — 서버 25-0 이 싣기 전에는 빈 칸) · 기록 주인(owner)으로 열린다 —
 * 요청 본문 user_id 는 기록 주인이다(빈 글이면 서버가 거절). 남의 기록은 VACATION:MANAGE 가 있을 때만 고칠 수 있다.
 */
export function VacationHistoryTable({
  value,
  year,
  owner,
  status,
}: {
  value: GetUserVacationHistoryResp | undefined
  year: number
  /** 기록의 주인 — 없으면 로그인한 사람 */
  owner?: RecordOwner
  status?: RecordsStatus
}) {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const snackbar = useSnackbar()
  const { loginUser } = useUser()
  const { hasAnyPermission } = usePermission()
  const desktop = useDesktop()
  const [editing, setEditing] = useState<IEvent | null>(null)
  const { mutateAsync: deleteVacationUsage } = useDeleteVacationUsageMutation()
  const deleteConfirm = useConfirmTarget<VacationUsageInfo>()

  const ownerId = owner?.id ?? loginUser?.user_id ?? ''
  const ownerName = owner?.name ?? loginUser?.user_name ?? ''
  const mine = !!loginUser && ownerId === loginUser.user_id
  const mayAct = mine ? hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE']) : hasAnyPermission(['VACATION:MANAGE'])
  const canAct = (u: VacationUsageInfo) => mayAct && isUpcoming(u.start_date)

  /** 단추를 누르는 때 "시작 전" 을 다시 본다 — 화면을 열어 둔 채 시작 시각이 지났으면 폼 · 확인창을 열지 않고 알린다(서버도 시작 뒤는 거절) */
  const stillUpcoming = (u: VacationUsageInfo): boolean => {
    if (isUpcoming(u.start_date)) return true
    snackbar.show({ message: t('history.alreadyStarted') })
    return false
  }

  const handleEdit = (u: VacationUsageInfo) => {
    if (!stillUpcoming(u)) return
    setEditing({
      id: u.vacation_usage_id,
      kind: 'vacation',
      type: calendarTypes.find((c) => c.id === u.vacation_time_type) ?? calendarTypes.find((c) => c.type === 'vacation') ?? calendarTypes[0],
      title: u.vacation_usage_desc,
      description: u.vacation_usage_desc,
      startDate: u.start_date,
      endDate: u.end_date,
      vacationType: u.vacation_type ?? undefined,
      user: { id: ownerId, name: ownerName, picturePath: null },
    })
  }

  const usage = deleteConfirm.target

  return (
    <>
      <VacationHistoryContent
        data={value}
        year={year}
        status={status}
        canAct={canAct}
        onEdit={mayAct ? handleEdit : undefined}
        onDelete={mayAct ? (u) => stillUpcoming(u) && deleteConfirm.ask(u) : undefined}
      />
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title={tc('deleteVacation.title')}
        description={tc('deleteVacation.confirm', { date: usage ? formatDayText(usage.start_date) : '' })}
        onConfirm={async () => {
          if (usage) await deleteVacationUsage(usage.vacation_usage_id)
        }}
      />
      {editing && (
        <EventFormDialog
          open
          onClose={() => setEditing(null)}
          event={editing}
          onDelete={desktop ? undefined : () => {
            const u = value?.usages.find((x) => x.vacation_usage_id === editing.id)
            setEditing(null)
            if (u && stillUpcoming(u)) deleteConfirm.ask(u)
          }}
        />
      )}
    </>
  )
}
