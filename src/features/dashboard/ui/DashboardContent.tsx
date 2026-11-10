import { useMemo, useState } from 'react'
import { LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Card } from '@/shared/ds/card'
import { ResultSection } from '@/shared/ds/result-section'
import { usePermission } from '@/entities/session'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { useScreenAction } from '@/widgets/layout/lib/screen-action'
import { Band, ScreenBands } from '@/widgets/layout/ui/ScreenBands'
import { SCREEN_TITLE_BOX, ScreenBody } from '@/widgets/layout/ui/ScreenBody'
import { ScreenTitle } from '@/shared/ds/top-navigation'
import { parseHomeWidgetIds, readHomeWidgets } from '@/features/dashboard/lib/read-home-widgets'
import { canSeeWidget, widgetOf, WIDGETS } from '@/features/dashboard/lib/widgets'
import { HomeEditPanel } from '@/features/dashboard/ui/HomeEditPanel'
import { HomeSkeleton } from '@/features/dashboard/ui/HomeSkeleton'
import { WIDGET_VIEWS } from '@/features/dashboard/ui/widget-registry'

interface DashboardContentProps {
  /** 저장할 사용자 id */
  userId: string
  /** 서버에 저장된 홈 배치 글(`users.dashboard`) */
  dashboard: string | undefined
  /** 저장값(사용자 정보)을 받는 중 — 받기 전에는 위젯 차례를 모른다 */
  pending: boolean
  failed: boolean
  retrying: boolean
  onRetry: () => void
}

/**
 * 홈(I-23 B) — 정해진 자리 + 켠 위젯을 고른 차례대로. 1280 이상 2 : 1 두 열(넓은 위젯 왼쪽 · 좁은 위젯 오른쪽, 열 사이 24 · 카드 사이 8),
 * 768 ~ 1279 한 칸(최대 720), 768 미만 위젯마다 띠(사이 8). 높이는 내용만큼이다.
 * 홈 편집(켜고 끄기 · 차례 바꾸기)은 제목 줄 오른쪽 · 폰 상단 바 오른쪽 자리에 다음 묶음(23-1b)이 단다 — 이 묶음은 저장된 배치를 읽어 그리기만 한다.
 */
export const DashboardContent = ({ userId, dashboard, pending, failed, retrying, onRetry }: DashboardContentProps) => {
  const { t } = useTranslation('dashboard')
  const { t: ts } = useTranslation('sidebar')
  const { t: tc } = useTranslation('common')
  const desktop = useDesktop()
  const wide = useWide()
  const { hasAnyPermission } = usePermission()

  // 권한이 하나라도 있으면 보이는 위젯 — 권한 밖 id 는 저장값에 남고 그릴 때만 거른다
  const availableIds = useMemo(() => WIDGETS.filter((w) => canSeeWidget(w, hasAnyPermission)).map((w) => w.id), [hasAnyPermission])
  const ids = useMemo(() => readHomeWidgets(dashboard, availableIds), [dashboard, availableIds])
  const stored = useMemo(() => parseHomeWidgetIds(dashboard), [dashboard])

  // 홈 편집 — 저장값을 받은 뒤에만, 저장 권한(USER:EDIT)이 있을 때만. 열 때마다 초안을 새로 쌓는다(session)
  const canEdit = !pending && !failed && hasAnyPermission(['USER:EDIT'])
  const [edit, setEdit] = useState({ open: false, session: 0 })
  const openEdit = () => setEdit((cur) => ({ open: true, session: cur.session + 1 }))
  useScreenAction(canEdit ? { label: t('editShort'), onClick: openEdit } : null)

  const result = (node: React.ReactNode) =>
    desktop ? <Card body='content'>{node}</Card> : <Band title={ts('menu.dashboard')}>{node}</Band>

  let content: React.ReactNode
  if (failed) {
    content = result(
      <ResultSection
        kind='failure'
        size='medium'
        title={t('failureTitle')}
        description={t('widget.failureDescription')}
        primaryAction={{ label: tc('retry'), onClick: onRetry, loading: retrying }}
      />,
    )
  } else if (pending) {
    content = <HomeSkeleton />
  } else if (ids.length === 0) {
    content = result(<ResultSection size='medium' icon={<LayoutDashboard />} title={t('emptyTitle')} description={t('emptyDescription')} />)
  } else if (!desktop) {
    content = (
      <ScreenBands>
        {ids.map((id) => (
          <WidgetSlot key={id} id={id} />
        ))}
      </ScreenBands>
    )
  } else if (wide) {
    const left = ids.filter((id) => widgetOf(id)?.place === 'wide')
    const right = ids.filter((id) => widgetOf(id)?.place === 'narrow')
    content = (
      <div className='grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-x-(--layout-gutter)' data-home-columns>
        <div className='flex min-w-0 flex-col gap-x2' data-home-column='wide'>
          {left.map((id) => (
            <WidgetSlot key={id} id={id} />
          ))}
        </div>
        <div className='flex min-w-0 flex-col gap-x2' data-home-column='narrow'>
          {right.map((id) => (
            <WidgetSlot key={id} id={id} />
          ))}
        </div>
      </div>
    )
  } else {
    content = (
      <div className='flex flex-col gap-x2' data-home-columns>
        {ids.map((id) => (
          <WidgetSlot key={id} id={id} />
        ))}
      </div>
    )
  }

  return (
    <ScreenBody density='medium'>
      <div className={SCREEN_TITLE_BOX}>
        <ScreenTitle actions={
          canEdit ? (
            <Button variant='neutralOutline' size='small' onClick={openEdit} data-home-edit-entry>
              {t('edit')}
            </Button>
          ) : undefined
        }>
          {ts('menu.dashboard')}
        </ScreenTitle>
      </div>
      {content}
      {canEdit && (
        <HomeEditPanel
          sessionKey={edit.session}
          open={edit.open}
          onOpenChange={(open) => setEdit((cur) => ({ ...cur, open }))}
          userId={userId}
          visible={ids}
          stored={stored}
          availableIds={availableIds}
        />
      )}
    </ScreenBody>
  )
}

const WidgetSlot = ({ id }: { id: string }) => {
  const view = WIDGET_VIEWS[id]
  return view ? <div className='min-w-0' data-slot-id={id}>{view()}</div> : null
}
