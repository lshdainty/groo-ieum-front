import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'

import { Button } from '@/shared/ds/button'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { PersonPicker, type PersonOption } from '@/shared/ui/groo/person-picker'
import { useGrantStatusTypesQuery } from '@/entities/type'
import { usePermission } from '@/entities/session'
import { useUsersQuery } from '@/entities/user'
import {
  useAvailableVacationsQuery,
  useUserMonthlyVacationStatsQuery,
  useUserRequestedVacationsQuery,
  useUserVacationHistoryQuery,
  useUserVacationStatsQuery,
} from '@/entities/vacation'
import { UserInfoCard } from '@/features/user-profile/ui/UserInfoCard'
import { AddEventDialog } from '@/features/calendar/ui/dialogs/add-event-dialog'
import { ApplicationTable } from '@/features/vacation-application/ui/ApplicationTable'
import { VacationGrantDialog } from '@/features/vacation-application/ui/VacationGrantDialog'
import { MonthVacationStatsCard } from '@/features/vacation-history/ui/MonthVacationStatsCard'
import { VacationHistoryTable } from '@/features/vacation-history/ui/VacationHistoryTable'
import { VacationStatsCard } from '@/features/vacation-history/ui/VacationStatsCard'
import { VacationTypeStatsCard } from '@/features/vacation-history/ui/VacationTypeStatsCard'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useVacationContext } from '../model/VacationContext'

/**
 * 직원 휴가 탭(I-24 C 14 · 15) — 사람 고르기 줄(왼쪽 Input Button · 오른쪽 [휴가 사용] [휴가 부여]) 아래에 고른 직원의 카드들.
 * 카드는 H-C(I-25) 가 모양을 정하기 전이라 지금 부품 그대로다(옛 카드 — 임시). 처음 고른 사람은 로그인한 사람(VacationContent 가 정한다).
 * [휴가 사용] 은 지금처럼 일정 등록 대화상자(로그인한 사람의 일정)를 연다, [휴가 부여] 는 고른 직원에게 부여하는 폼(VACATION:GRANT · MANAGE 만).
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
  const canUse = hasAnyPermission(['VACATION:USE', 'VACATION:MANAGE', 'SCHEDULE:WRITE', 'SCHEDULE:MANAGE'])

  const actions = (
    <>
      {canUse && (
        <Button variant='neutralOutline' size='small' onClick={() => setUseOpen(true)} data-use-vacation>
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
        <div className={desktop ? 'flex min-w-0 flex-col gap-x6' : 'flex min-w-0 flex-col gap-x6 overflow-x-auto px-x4'} data-staff-cards>
          {selectedUser && <UserInfoCard value={[selectedUser]} />}
          <StaffCards userId={selected.id} year={selectedYear} name={selected.name} />
        </div>
      )}
      {selected && canGrant && grantOpen && (
        <VacationGrantDialog key={selected.id} open={grantOpen} user={{ id: selected.id, name: selected.name, department: selected.department }} onOpenChange={setGrantOpen} />
      )}
      {/* 열 때만 마운트 — 이 창이 직원 목록을 quiet 없이 부르므로 늘 마운트해 두면 첫 로드 실패에 전역 Snackbar 가 겹친다 */}
      {useOpen && <AddEventDialog open={useOpen} onOpenChange={setUseOpen} />}
    </div>
  )
}

/** 고른 직원의 카드들 — 지금 부품 그대로(H-C 가 모양을 정하면 바꾼다) */
function StaffCards({ userId, year, name }: { userId: string; year: string; name: string }) {
  const { t } = useTranslation('vacation')
  const baseDate = dayjs().year(parseInt(year)).format('YYYY-MM-DDT23:59:59')
  const { data: vacationTypes } = useAvailableVacationsQuery(userId, baseDate)
  const { data: monthStats } = useUserMonthlyVacationStatsQuery(userId, year)
  const { data: histories } = useUserVacationHistoryQuery(userId, parseInt(year))
  const { data: vacationStats } = useUserVacationStatsQuery(userId, baseDate)
  const { data: requests = [] } = useUserRequestedVacationsQuery(userId, parseInt(year))
  const { data: grantStatusTypes = [] } = useGrantStatusTypesQuery()
  return (
    <>
      <VacationStatsCard value={vacationStats} />
      <MonthVacationStatsCard value={monthStats || []} className='h-full' />
      <div className='grid grid-cols-1 gap-6 min-[80rem]:grid-cols-3'>
        <div className='flex flex-col min-[80rem]:col-span-1'>
          <VacationTypeStatsCard value={vacationTypes} className='h-full' />
        </div>
        <div className='flex flex-col min-[80rem]:col-span-2'>
          <VacationHistoryTable value={histories || { grants: [], usages: [] }} canAdd={false} />
        </div>
      </div>
      <ApplicationTable
        title={t('staff.requestsTitle')}
        vacationRequests={requests}
        grantStatusTypes={grantStatusTypes}
        showCancelButton={false}
        emptyTitle={t('staff.noRequestsTitle', { name })}
        emptyDescription={t('staff.noRequestsDescription')}
      />
    </>
  )
}
