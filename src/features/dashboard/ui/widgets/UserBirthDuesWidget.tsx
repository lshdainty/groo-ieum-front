import dayjs from 'dayjs'

import { useUsersMonthBirthDuesQuery } from '@/entities/dues'
import { useUsersQuery } from '@/entities/user'
import { DuesMatrixEmpty, MatrixSkeleton } from '@/features/culture-dues/ui/DuesResults'
import { rowsOf } from '@/features/culture-dues/lib/dues-matrix'
import { Matrix } from '@/features/culture-dues/ui/DuesBirthMatrix'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 월별 생일비 입금 현황(D 28) — 올해 행렬(칸은 색만 · 범례 · 가리키면 금액). 회비 화면과 같은 부품 */
export const UserBirthDuesWidget = () => {
  const desktop = useDesktop()
  const birth = useUsersMonthBirthDuesQuery(dayjs().year(), { quiet: true })
  const users = useUsersQuery({ quiet: true })
  const rows = rowsOf(users.data, birth.data)

  return (
    <WidgetFrame id='user-birth-dues'>
      <WidgetBoundary id='user-birth-dues' queries={[birth, users]} fallback={<MatrixSkeleton />}>
        {users.data && rows.length === 0 ? <DuesMatrixEmpty /> : <Matrix rows={rows} nameColumn={desktop ? 96 : 72} />}
      </WidgetBoundary>
    </WidgetFrame>
  )
}
