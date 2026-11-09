import { useTranslation } from 'react-i18next'

import { CardStat } from '@/shared/ds/card'
import { LogoTile } from '@/shared/ds/logo-tile'
import type { GetUsersResp } from '@/entities/user'

export interface UserCompanyStatsItemProps {
  id: string
  name: string
  count: number
}

/**
 * 회사 한 칸의 안(I-24 F 28) — 앞 Logo Tile 32 + 회사 이름 + "{n}명". 지표 카드(사용자 관리)와 폰 띠 줄이 쓰고,
 * 홈 위젯(회사별 인원 현황)은 같은 Logo Tile 을 List 줄에 담는다. 회사 이름 · 코드로 로고 그림을 고르지 않는다 —
 * 서버가 회사 로고를 주지 않으므로 이름의 첫 글자 타일이다(Logo Tile face="name", 장식).
 */
export const UserCompanyStatsItem = ({ name, count }: UserCompanyStatsItemProps) => {
  const { t } = useTranslation('admin')
  return (
    <div className='flex items-center gap-x3'>
      <LogoTile name={name} face='name' size={32} />
      <CardStat className='min-w-0 flex-1 [overflow-wrap:anywhere]' label={name} value={t('users.peopleCount', { count })} />
    </div>
  )
}

/** 회사 코드(`user_company_type`)별 인원 — 회사 이름은 응답의 이름을 그대로 쓴다. 회사마다 표를 두지 않는다 */
export const getUserCompanyStatsConfig = (users: GetUsersResp[] = []): UserCompanyStatsItemProps[] => {
  const counts = new Map<string, UserCompanyStatsItemProps>()
  users.forEach((user) => {
    const found = counts.get(user.user_company_type)
    if (found) found.count++
    else counts.set(user.user_company_type, { id: user.user_company_type, name: user.user_origin_company_name, count: 1 })
  })
  return [...counts.values()]
}
