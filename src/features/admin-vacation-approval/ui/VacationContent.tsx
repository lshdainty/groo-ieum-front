import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Select, SelectItem } from '@/shared/ds/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ds/tabs'
import { useUser } from '@/entities/session'
import { useAllVacationsByApproverQuery } from '@/entities/vacation'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ScreenBody, ScreenTitleRow } from '@/widgets/layout/ui/ScreenBody'
import { useVacationContext } from '../model/VacationContext'
import { needsMyApproval } from '../lib/approval-format'
import { ApprovalInbox } from './ApprovalInbox'
import { StaffVacation } from './StaffVacation'

type VacationTab = 'inbox' | 'staff'

/** 고른 해 선택지 — 5년 전 ~ 1년 뒤(지금 그대로) */
const yearOptions = (): number[] => {
  const current = new Date().getFullYear()
  return Array.from({ length: 7 }, (_, i) => current - 5 + i)
}

/**
 * 구성원 휴가(I-24 C 11) — 화면 탭 둘 "결재함 · 직원 휴가"(첫 탭 결재함, 내가 결재할 신청이 있으면 탭에 알림 점).
 * 데스크톱: 제목 줄(h1 + 오른쪽 연도 Select) → 탭 → 16 → 내용. 폰: 상단 바 제목 아래 흰 면 하나 — 탭 → 연도 · 건수 줄 → 내용.
 * 연도는 두 탭에 함께 걸린다. 결재함 질의는 여기서 한 번만 받아(탭 점 · 건수 · 표가 같이 쓴다) quiet 로 두고 구역이 실패를 말한다.
 */
export const VacationContent = () => {
  const { t } = useTranslation('vacation')
  const desktop = useDesktop()
  const { loginUser } = useUser()
  const { selectedUserId, setSelectedUserId, selectedYear, setSelectedYear } = useVacationContext()
  const [tab, setTab] = useState<VacationTab>('inbox')
  const loginUserId = loginUser?.user_id ?? ''

  // 처음 고른 직원은 로그인한 사람
  useEffect(() => {
    if (loginUser && !selectedUserId) setSelectedUserId(loginUser.user_id)
  }, [loginUser, selectedUserId, setSelectedUserId])

  const approvals = useAllVacationsByApproverQuery(loginUserId, parseInt(selectedYear, 10), undefined, { quiet: true })
  const rows = approvals.data ?? []
  const waiting = rows.some((row) => needsMyApproval(row, loginUserId))

  const yearSelect = (
    <Select
      size={desktop ? 'medium' : 'large'}
      aria-label={t('memberVacation.yearAria')}
      value={selectedYear}
      onValueChange={setSelectedYear}
      className='w-[9rem]'
    >
      {yearOptions().map((y) => (
        <SelectItem key={y} value={String(y)} label={t('memberVacation.yearLabel', { year: y })} />
      ))}
    </Select>
  )

  const tabs = (
    <TabsList aria-label={t('memberVacation.tabsAria')} layout={desktop ? 'hug' : 'fill'} size={desktop ? 'medium' : 'small'}>
      <TabsTrigger value='inbox' notification={waiting} aria-describedby={waiting ? 'vacation-inbox-pending' : undefined}>
        {t('memberVacation.tabInbox')}
      </TabsTrigger>
      <TabsTrigger value='staff'>{t('memberVacation.tabStaff')}</TabsTrigger>
    </TabsList>
  )
  const pendingNote = waiting ? (
    <span id='vacation-inbox-pending' className='sr-only'>
      {t('memberVacation.inboxPending')}
    </span>
  ) : null

  const inbox = (
    <ApprovalInbox
      rows={rows}
      pending={approvals.isPending}
      failed={approvals.isLoadingError}
      fetching={approvals.isFetching}
      onRetry={() => void approvals.refetch()}
    />
  )

  if (desktop) {
    return (
      <ScreenBody density='high'>
        <ScreenTitleRow title={t('memberVacation.title')} action={yearSelect} />
        <Tabs value={tab} onValueChange={(v) => setTab(v as VacationTab)}>
          {tabs}
          {pendingNote}
          <TabsContent value='inbox' className='mt-x4'>
            {inbox}
          </TabsContent>
          <TabsContent value='staff' className='mt-x4'>
            <StaffVacation />
          </TabsContent>
        </Tabs>
      </ScreenBody>
    )
  }

  return (
    <ScreenBody density='high'>
      <div className='bg-bg-layer-default' data-member-vacation-phone>
        <Tabs value={tab} onValueChange={(v) => setTab(v as VacationTab)}>
          {tabs}
          {pendingNote}
          <div className='flex items-center justify-between gap-x3 px-x6 pb-x1 pt-x3'>
            {yearSelect}
            {tab === 'inbox' && rows.length > 0 && (
              <span className='text-t3 font-normal text-fg-neutral-subtle'>{t('memberVacation.count', { n: rows.length })}</span>
            )}
          </div>
          <TabsContent value='inbox'>{inbox}</TabsContent>
          <TabsContent value='staff' className='pt-x3'>
            <StaffVacation />
          </TabsContent>
        </Tabs>
      </div>
    </ScreenBody>
  )
}
