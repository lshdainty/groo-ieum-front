import { Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { Badge } from '@/shared/ds/badge'
import { Button } from '@/shared/ds/button'
import { List, ListItem } from '@/shared/ds/list'
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
 * 고른 부서의 사람 목록(E 25) — 줄: 앞 Avatar 42 · 이름 · 아이디 · 주 부서면 Badge "주 부서" · 줄 끝 [빼기].
 * 줄 끝 ⋮ 를 두지 않는다 — 동작이 하나(빼기)이고 들어갈 상세가 없는 목록 줄은 줄 끝 글 단추(10-25 줄 끝 ⋮ 원칙 · 11-08 A1).
 * 빼기는 바로 반영한다(H-D11 A "저장이 그때그때" — 다시 넣을 수 있다). "주 부서로 정하기" 는 24-0 서버가 dev 에 돈 뒤 더한다.
 */
export function DepartmentMembers({
  deptName,
  users,
  onRemove,
  onAdd,
  removing,
}: {
  deptName: string
  users: UserInfo[]
  onRemove: (user: UserInfo) => void
  onAdd: () => void
  removing: string | null
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
        <ListItem
          key={u.user_id}
          data-member-row={u.user_id}
          prefix={<Avatar name={u.user_name} size={42} />}
          title={u.user_name}
          detail={<span className='break-all'>{u.user_id}</span>}
          suffix={
            <>
              {u.main_yn === 'Y' && <Badge variant='weak' tone='neutral'>{t('department.members.main')}</Badge>}
              <Button
                variant='ghost'
                size='small'
                ghostColor='critical'
                loading={removing === u.user_id}
                aria-label={t('department.members.removeFor', { name: u.user_name, dept: deptName })}
                onClick={() => onRemove(u)}
              >
                {t('department.members.remove')}
              </Button>
            </>
          }
        />
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
