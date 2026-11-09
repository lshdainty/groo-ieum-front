import { Card, CardHeader } from '@/shared/ds/card'
import { Skeleton } from '@/shared/ds/skeleton'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { useWide } from '@/widgets/layout/lib/use-wide'
import { Band, ScreenBands } from '@/widgets/layout/ui/ScreenBands'

/** 카드 · 띠 하나 자리 — 머리 + 줄 셋 */
const SkeletonWidget = ({ rows = 3 }: { rows?: number }) => {
  const desktop = useDesktop()
  const body = (
    <div className='flex flex-col gap-x3'>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} text='t5' className='block w-full' />
      ))}
    </div>
  )
  if (desktop) {
    return (
      <Card>
        <CardHeader>
          <Skeleton text='t5' className='block w-1/3' />
        </CardHeader>
        {body}
      </Card>
    )
  }
  return (
    <Band title={<Skeleton text='t5' className='inline-block w-24' />}>{body}</Band>
  )
}

/**
 * 저장된 홈 배치를 받는 동안(B 11) — 카드 셋 자리. 1280 이상은 2 : 1 왼쪽 둘 · 오른쪽 하나, 그 밖은 한 칸, 폰은 띠 셋.
 * 받기 전에는 위젯 차례를 모르므로 기본 배치를 가정해 그리지 않는다(저장값 차례가 처음부터 그려지게).
 */
export const HomeSkeleton = () => {
  const desktop = useDesktop()
  const wide = useWide()
  if (!desktop) {
    return (
      <ScreenBands>
        <SkeletonWidget />
        <SkeletonWidget />
        <SkeletonWidget />
      </ScreenBands>
    )
  }
  if (wide) {
    return (
      <div className='grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start gap-x-(--layout-gutter)'>
        <div className='flex flex-col gap-x2'>
          <SkeletonWidget />
          <SkeletonWidget />
        </div>
        <div className='flex flex-col gap-x2'>
          <SkeletonWidget />
        </div>
      </div>
    )
  }
  return (
    <div className='flex flex-col gap-x2'>
      <SkeletonWidget />
      <SkeletonWidget />
      <SkeletonWidget />
    </div>
  )
}
