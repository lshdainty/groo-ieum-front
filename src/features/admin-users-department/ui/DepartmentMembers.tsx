import { useState } from 'react'
import { ChevronRight, Plus, Star, UserMinus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { Badge } from '@/shared/ds/badge'
import { Button } from '@/shared/ds/button'
import { BottomSheet, BottomSheetBody, BottomSheetContent } from '@/shared/ds/bottom-sheet'
import { List, ListButtonItem } from '@/shared/ds/list'
import { ResponsiveMenu, ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem, ResponsiveMenuTrigger } from '@/shared/ds/menu'
import { ProgressCircle } from '@/shared/ds/progress-circle'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import type { UserInfo } from '@/entities/department'

/** 이 부서 사람 줄 자리 — 줄 넷(Avatar 42 · 이름 · 아이디) */
export function MemberListSkeleton() {
  return (
    <ul className='m-0 list-none p-0' aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className='flex items-center gap-x3 px-x6 py-x3'>
          <Skeleton radius='full' className='size-[42px] shrink-0' />
          <div className='flex min-w-0 flex-1 flex-col gap-x1'>
            <Skeleton text='t5' className='block w-1/3' />
            <Skeleton text='t3' className='block w-1/4' />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * 사람 줄 하나 — 줄 끝 › 가 있는 누르는 줄(사용자 결정 11-09 "줄을 누르면 시트"). 누르면 폰(768 미만)은 그 사람 Bottom Sheet(머리: 아바타 · 이름 · 아이디 · "주 부서: {부서}"),
 * 768 이상은 Responsive Menu(1280 미만 Menu Sheet · 이상 줄에 붙은 Menu — 끝 맞춤). 항목: [주 부서로 정하기](이 부서가 이미 주 부서면 숨김) · [부서에서 빼기](critical).
 */
function MemberRow({
  user,
  deptName,
  mainDeptName,
  busy,
  onSetMain,
  onRemove,
}: {
  user: UserInfo
  deptName: string
  mainDeptName: string | null
  busy: boolean
  onSetMain: (user: UserInfo) => void
  onRemove: (user: UserInfo) => void
}) {
  const { t } = useTranslation('admin')
  const desktop = useDesktop()
  const [sheet, setSheet] = useState(false)
  const isMain = user.main_yn === 'Y'
  const row = (
    <ListButtonItem
      data-member-row={user.user_id}
      aria-busy={busy || undefined}
      disabled={busy}
      prefix={<Avatar name={user.user_name} size={42} />}
      title={user.user_name}
      detail={<span className='break-all'>{user.user_id}</span>}
      suffix={
        <>
          {isMain && <Badge variant='weak' tone='neutral'>{t('department.members.main')}</Badge>}
          {busy ? <ProgressCircle aria-hidden size='24' /> : <ChevronRight aria-hidden className='size-5 text-fg-neutral-subtle' />}
        </>
      }
      aria-label={t('department.members.rowFor', { name: user.user_name })}
      onClick={desktop ? undefined : () => setSheet(true)}
    />
  )
  if (!desktop) {
    return (
      <>
        {row}
        <BottomSheet open={sheet} onOpenChange={setSheet}>
          <BottomSheetContent title={user.user_name}>
            <BottomSheetBody>
              <div className='flex items-center gap-x3 pb-x4'>
                <Avatar name={user.user_name} size={42} />
                <div className='min-w-0'>
                  <p className='m-0 break-all text-t3 text-fg-neutral-subtle'>{user.user_id}</p>
                  {mainDeptName && <p className='m-0 text-t3 text-fg-neutral-subtle'>{t('department.members.mainOf', { dept: mainDeptName })}</p>}
                </div>
              </div>
              <div className='flex flex-col gap-x2'>
                {!isMain && (
                  <Button variant='neutralWeak' size='large' onClick={() => { setSheet(false); onSetMain(user) }}>
                    {t('department.members.setMain')}
                  </Button>
                )}
                <Button variant='ghost' ghostColor='critical' size='large' onClick={() => { setSheet(false); onRemove(user) }}>
                  {t('department.members.removeFrom', { dept: deptName })}
                </Button>
              </div>
            </BottomSheetBody>
          </BottomSheetContent>
        </BottomSheet>
      </>
    )
  }
  return (
    <ResponsiveMenu>
      <ResponsiveMenuTrigger asChild>{row}</ResponsiveMenuTrigger>
      <ResponsiveMenuContent title={user.user_name} description={mainDeptName ? t('department.members.mainOf', { dept: mainDeptName }) : undefined}>
        <ResponsiveMenuGroup>
          {!isMain && <ResponsiveMenuItem icon={<Star />} label={t('department.members.setMain')} onSelect={() => onSetMain(user)} />}
          <ResponsiveMenuItem icon={<UserMinus />} label={t('department.members.removeFrom', { dept: deptName })} tone='critical' onSelect={() => onRemove(user)} />
        </ResponsiveMenuGroup>
      </ResponsiveMenuContent>
    </ResponsiveMenu>
  )
}

/** 고른 부서의 사람 목록(E 25) — 줄을 누르면 시트 · 메뉴. 빼기는 바로 반영(확인창 없음), 주 부서로 정하기도 바로 반영 */
export function DepartmentMembers({
  deptName,
  users,
  mainDeptOf,
  onSetMain,
  onRemove,
  onAdd,
  busyIds,
}: {
  deptName: string
  users: UserInfo[]
  mainDeptOf: (userId: string) => string | null
  onSetMain: (user: UserInfo) => void
  onRemove: (user: UserInfo) => void
  onAdd: () => void
  busyIds: Set<string>
}) {
  const { t } = useTranslation('admin')
  if (users.length === 0) {
    return (
      <ResultSection
        size='medium'
        icon={<Users />}
        title={t('department.members.empty', { dept: deptName })}
        primaryAction={{ label: t('department.members.add'), onClick: onAdd }}
      />
    )
  }
  return (
    <List aria-label={t('department.members.listLabel', { dept: deptName })}>
      {users.map((u) => (
        <MemberRow key={u.user_id} user={u} deptName={deptName} mainDeptName={mainDeptOf(u.user_id)} busy={busyIds.has(u.user_id)} onSetMain={onSetMain} onRemove={onRemove} />
      ))}
    </List>
  )
}

/** 머리 줄(데스크톱) — "{부서} {n}명" + 오른쪽 [사람 추가] */
export function MembersHeader({ deptName, count, onAdd }: { deptName: string; count: number | null; onAdd: () => void }) {
  const { t } = useTranslation('admin')
  return (
    <div className='flex items-center justify-between gap-x2 px-x6 pb-x2 pt-x4'>
      <h2 className='m-0 min-w-0 break-keep text-t5 font-bold text-fg-neutral [overflow-wrap:break-word]'>
        {count == null ? deptName : t('department.members.title', { name: deptName, count })}
      </h2>
      <Button variant='neutralOutline' size='small' className='shrink-0' onClick={onAdd}>
        <Plus />
        {t('department.members.add')}
      </Button>
    </div>
  )
}
