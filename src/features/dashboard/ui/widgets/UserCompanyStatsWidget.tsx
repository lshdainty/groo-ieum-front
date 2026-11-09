import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { List, ListItem } from '@/shared/ds/list'
import { LogoTile } from '@/shared/ds/logo-tile'
import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { useUsersQuery } from '@/entities/user'
import { getUserCompanyStatsConfig } from '@/features/admin-users-management/ui/UserCompanyStatsItem'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/**
 * 회사별 인원 현황(D 29) — 회사마다 List 줄(Logo Tile 32 + 회사 이름 + 뒤 "{n}명" 700). 회사 로고를 서버가 주지 않아 첫 글자 타일이다(이름 · 코드로 그림을 고르지 않는다).
 * 깨진 그림 · "{회사} logo" 글이 보이지 않는다. 지표 카드(회사 관리 · 사용자 관리)와 한 부품은 I-24 몫이라 홈은 줄로 담는다.
 */
export const UserCompanyStatsWidget = () => {
  const { t } = useTranslation('admin')
  const { t: td } = useTranslation('dashboard')
  const query = useUsersQuery({ quiet: true })
  const stats = getUserCompanyStatsConfig(query.data)

  return (
    <WidgetFrame id='user-company-stats' body='list'>
      <WidgetBoundary id='user-company-stats' queries={[query]} fallback={<CompanyStatsSkeleton />}>
        {query.data && stats.length === 0 ? (
          <ResultSection size='medium' icon={<Building2 />} title={t('user.companyStats.empty.title')} description={t('user.companyStats.empty.description')} />
        ) : (
          <List>
            {stats.map((stat) => (
              <ListItem
                key={stat.id}
                data-company={stat.id}
                prefix={<LogoTile name={stat.name} face='name' size={32} />}
                title={stat.name}
                suffix={<span className='text-t5 font-bold tabular-nums text-fg-neutral'>{td('companyCount', { count: stat.count })}</span>}
              />
            ))}
          </List>
        )}
      </WidgetBoundary>
    </WidgetFrame>
  )
}

const CompanyStatsSkeleton = () => (
  <div className='flex flex-col'>
    {[0, 1, 2].map((i) => (
      <div key={i} className='flex items-center gap-x3 px-x6 py-x3'>
        <Skeleton radius='8' className='size-x8 shrink-0' />
        <Skeleton text='t5' className='block w-1/2' />
      </div>
    ))}
  </div>
)
