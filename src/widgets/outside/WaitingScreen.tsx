import { ProgressCircle } from '@/shared/ds/progress-circle'
import { useDsText } from '@/shared/ds/i18n'
import { useWaitPhase } from '@/shared/ds/skeleton'
import { usePageTitle } from '@/shared/lib/page-title'
import { OutsideShell } from './OutsideShell'

/**
 * 기다림 화면(I-22 G 33 · 34) — 흰 면 가운데 Progress Circle 40(neutral) 하나, 보이는 글 없음.
 * 시간표(progress-circle.md "기다리는 동안"): 0 ~ 1초 아무것도 그리지 않음 · 1초부터 원 · 5초에 원 아래 16 "평소보다 오래 걸리고 있어요."
 * `label` 은 원의 이름(보이지 않는다 — 화면 낭독이 읽는다). 문서 제목은 "그루 이음" 하나.
 */
export function WaitingScreen({ label }: { label: string }) {
  usePageTitle()
  const phase = useWaitPhase(true)
  const dsT = useDsText()
  return (
    <OutsideShell>
      <div aria-busy='true' className='flex flex-col items-center'>
        {phase !== 'quiet' && <ProgressCircle size='40' aria-label={label} />}
        {phase === 'slow' && (
          <p className='m-0 mt-x4 break-keep text-center text-t4 font-normal text-fg-neutral-muted [overflow-wrap:break-word]'>
            {dsT('skeleton.slow')}
          </p>
        )}
      </div>
    </OutsideShell>
  )
}
