import { useTranslation } from 'react-i18next'

import { Card } from '@/shared/ds/card'
import { List, ListItem } from '@/shared/ds/list'
import { LogoTile } from '@/shared/ds/logo-tile'
import type { GetUsersResp } from '@/entities/user'
import { UserCompanyStatsItem, getUserCompanyStatsConfig } from './UserCompanyStatsItem'

/** 회사별 인원 — 데스크톱 지표 카드(1280 넷 · 1024 둘씩, 카드 사이 24), 폰은 띠 하나의 List 줄 넷(누름 없음 · ⋮ 없음) */
export function UserCompanyCard({ value: users, desktop }: { value: GetUsersResp[]; desktop: boolean }) {
  const { t } = useTranslation('admin')
  const stats = getUserCompanyStatsConfig(users)
  if (stats.length === 0) return null
  if (desktop) {
    return (
      <div className='grid grid-cols-2 gap-x6 lg:grid-cols-4' data-company-stats>
        {stats.map((stat) => (
          <Card key={stat.id} data-company={stat.id}>
            <UserCompanyStatsItem {...stat} />
          </Card>
        ))}
      </div>
    )
  }
  return (
    <section className='bg-bg-layer-default pb-x2 pt-x1' data-company-stats>
      <h2 className='m-0 px-global-gutter pb-x1 pt-x5 text-t5 font-bold text-fg-neutral'>{t('users.statsTitle')}</h2>
      <List>
        {stats.map((stat) => (
          <ListItem
            key={stat.id}
            data-company={stat.id}
            prefix={<LogoTile name={stat.name} face='name' size={32} />}
            title={<span className='[overflow-wrap:anywhere]'>{stat.name}</span>}
            suffix={<span className='text-t5 font-normal tabular-nums text-fg-neutral'>{t('users.peopleCount', { count: stat.count })}</span>}
          />
        ))}
      </List>
    </section>
  )
}
