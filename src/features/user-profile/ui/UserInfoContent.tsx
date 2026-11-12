import { useTranslation } from 'react-i18next'

import { Avatar } from '@/shared/ds/avatar'
import { config } from '@/shared/config'
import { GetUsersResp } from '@/entities/user'
import { formatWorkTime, parseBirth } from '@/features/user-profile/lib/profile-format'

interface UserInfoContentProps {
  user: GetUsersResp
}

/**
 * 내 정보(I-23 D 35) — 위: Avatar 96(사진 · 없으면 이니셜) + 이름 · 회사 / 부서(줄바꿈, 낱말 단위). 아래: 키-값 줄 여섯(라벨 84 · 값 줄 끝에서 끊김).
 * 아이디 · 메일처럼 한 낱말이 긴 칸만 글자 단위로 끊는다. 위 묶음과 사이 1px 선. 높이는 내용만큼(긴 메일이 고정 높이 밖으로 잘리지 않는다).
 */
const UserInfoContent = ({ user }: UserInfoContentProps) => {
  const { t } = useTranslation('user')
  const birth = parseBirth(user.user_birth ?? undefined)
  const org = [user.user_origin_company_name, user.main_department_name_kr].filter(Boolean).join(' / ')
  const rows: { id: string; label: string; value: string; anywhere?: boolean }[] = [
    { id: 'id', label: t('info.userId'), value: user.user_id, anywhere: true },
    { id: 'email', label: t('info.email'), value: user.user_email, anywhere: true },
    { id: 'birth', label: t('info.birthDate'), value: birth ? t('info.birthFormat', birth) : '-' },
    { id: 'company', label: t('info.company'), value: user.user_origin_company_name },
    { id: 'department', label: t('info.department'), value: user.main_department_name_kr || '-' },
    { id: 'workTime', label: t('info.workTime'), value: formatWorkTime(user.user_work_time) },
  ]

  return (
    <div className='flex flex-col' data-profile>
      <div className='flex flex-col items-center text-center'>
        <Avatar name={user.user_name} src={user.profile_url ? `${config.baseUrl}${user.profile_url}` : undefined} size={96} decorative={false} />
        <p className='m-0 mt-x2 text-t6 font-bold text-fg-neutral [overflow-wrap:break-word] [word-break:keep-all]'>{user.user_name}</p>
        {org && <p className='m-0 text-t4 font-normal text-fg-neutral-subtle [overflow-wrap:break-word] [word-break:keep-all]'>{org}</p>}
      </div>
      <dl className='m-0 mt-x4 grid grid-cols-[84px_minmax(0,1fr)] gap-x-x3 gap-y-x3 border-t border-stroke-neutral-subtle pt-x4'>
        {rows.map((row) => (
          <div key={row.id} className='contents' data-profile-row={row.id}>
            <dt className='text-t4 font-normal text-fg-neutral-subtle'>{row.label}</dt>
            <dd className={row.anywhere ? 'm-0 text-t4 text-fg-neutral [overflow-wrap:anywhere]' : 'm-0 text-t4 text-fg-neutral [overflow-wrap:break-word] [word-break:keep-all]'}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { UserInfoContent }
