import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { PersonPicker, type PersonOption } from '@/shared/ui/groo/person-picker'
import { usePermission } from '@/entities/session'
import { useUsersQuery } from '@/entities/user'
import { useUserRequestedVacationsQuery } from '@/entities/vacation'
import { UserInfoCard } from '@/features/user-profile/ui/UserInfoCard'
import { AddEventDialog } from '@/features/calendar/ui/dialogs/add-event-dialog'
import { ApplicationTable } from '@/features/vacation-application/ui/ApplicationTable'
import { VacationGrantDialog } from '@/features/vacation-application/ui/VacationGrantDialog'
import { VacationSections } from '@/features/vacation-history/ui/VacationSections'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useVacationContext } from '../model/VacationContext'

/**
 * 직원 휴가 탭(I-24 C 14 · 15) — 사람 고르기 줄(왼쪽 Input Button · 오른쪽 [휴가 사용] [휴가 부여]) 아래에 고른 직원의 카드들.
 * 카드는 H-C(I-25) 가 모양을 정하기 전이라 지금 부품 그대로다(옛 카드 — 임시). 처음 고른 사람은 로그인한 사람(VacationContent 가 정한다).
 * [휴가 사용] 은 고른 직원으로 고정된 휴가 사용 창(MANAGE 만)을 연다, [휴가 부여] 는 고른 직원에게 부여하는 폼(VACATION:GRANT · MANAGE 만).
 */
export function StaffVacation() {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const { hasAnyPermission } = usePermission()
  const { selectedUserId, setSelectedUserId, selectedYear } = useVacationContext()
  const usersQuery = useUsersQuery({ quiet: true })
  const [grantOpen, setGrantOpen] = useState(false)
  const [useOpen, setUseOpen] = useState(false)

  const people = useMemo<PersonOption[]>(
    () => (usersQuery.data ?? []).map((u) => ({ id: u.user_id, name: u.user_name, department: u.main_department_name_kr })),
    [usersQuery.data]
  )
  const selected = people.find((p) => p.id === selectedUserId)
  const selectedUser = (usersQuery.data ?? []).find((u) => u.user_id === selectedUserId)
  const canGrant = hasAnyPermission(['VACATION:GRANT', 'VACATION:MANAGE'])
  // 대리 사용은 VACATION:MANAGE 만(서버 규칙 — 대상이 로그인한 사람과 다르면 MANAGE). 결재자(APPROVER)에게는 이 단추가 없다
  const canUse = hasAnyPermission(['VACATION:MANAGE'])

  const actions = (
    <>
      {canUse && (
        <Button variant='neutralOutline' size='small' disabled={!selected} onClick={() => setUseOpen(true)} data-use-vacation>
          {t('staff.useVacation')}
        </Button>
      )}
      {canGrant && (
        <Button variant='neutralOutline' size='small' disabled={!selected} onClick={() => setGrantOpen(true)} data-grant-vacation>
          {t('staff.grantVacation')}
        </Button>
      )}
    </>
  )

  if (usersQuery.isLoadingError) {
    return (
      <ResultSection
        kind='failure'
        size='medium'
        title={t('staff.usersFailureTitle')}
        description={t('memberVacation.failureDescription')}
        primaryAction={{ label: tc('retry'), onClick: () => void usersQuery.refetch(), loading: usersQuery.isFetching }}
      />
    )
  }

  return (
    <div className={desktop ? 'flex flex-col gap-x6' : 'flex flex-col gap-x4 pb-x6'} data-staff-vacation>
      <div className={desktop ? 'flex items-center justify-between gap-x4' : 'flex flex-col gap-x3 px-x6'}>
        {usersQuery.isPending ? (
          <Skeleton className={desktop ? 'h-[40px] w-[280px]' : 'h-[52px] w-full'} />
        ) : (
          <PersonPicker
            people={people}
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            className={desktop ? 'w-[280px]' : undefined}
            ariaLabel={t('staff.pickerAria')}
            placeholder={t('staff.pickerPlaceholder')}
            surfaceTitle={t('staff.pickerTitle')}
            searchPlaceholder={t('staff.searchPlaceholder')}
            emptyTitle={t('staff.searchEmpty')}
          />
        )}
        <div className={desktop ? 'flex items-center gap-x2' : 'grid grid-cols-2 gap-x2 [&>*]:w-full'}>{actions}</div>
      </div>
      {selected && (
        <div className='flex min-w-0 flex-col gap-x6' data-staff-cards>
          {selectedUser && (
            <div className={desktop ? undefined : 'px-x4'}>
              <UserInfoCard value={[selectedUser]} />
            </div>
          )}
          <StaffCards userId={selected.id} year={selectedYear} name={selected.name} />
        </div>
      )}
      {selected && canGrant && grantOpen && (
        <VacationGrantDialog key={selected.id} open={grantOpen} user={{ id: selected.id, name: selected.name, department: selected.department }} onOpenChange={setGrantOpen} />
      )}
      {/* 열 때만 마운트 — 이 창이 직원 목록을 quiet 없이 부르므로 늘 마운트해 두면 첫 로드 실패에 전역 Snackbar 가 겹친다 */}
      {useOpen && selected && (
        <AddEventDialog key={selected.id} open={useOpen} onOpenChange={setUseOpen} fixedUser={{ id: selected.id, name: selected.name, department: selected.department }} />
      )}
    </div>
  )
}

/** 고른 직원의 카드들 — 휴가 현황 구역(휴가 현황 화면과 같은 부품)과 신청 내역(내 신청 화면과 같은 부품 — 취소 없음) */
function StaffCards({ userId, year, name }: { userId: string; year: string; name: string }) {
  const { t } = useTranslation('vacation')
  const requests = useUserRequestedVacationsQuery(userId, parseInt(year), { quiet: true })
  return (
    <>
      <VacationSections userId={userId} year={year} owner={{ id: userId, name }} />
      <ApplicationTable
        title={t('staff.requestsTitle')}
        requests={requests.data ?? []}
        year={parseInt(year)}
        status={{ pending: requests.isPending, failed: requests.isLoadingError, fetching: requests.isFetching, onRetry: () => void requests.refetch() }}
        emptyTitle={t('staff.noRequestsTitle', { name })}
        emptyDescription={t('staff.noRequestsDescription')}
      />
    </>
  )
}
