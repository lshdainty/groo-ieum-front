import { List, ListItem } from '@/shared/ds/list'
import { CheckSelectBox, CheckSelectBoxGroup, RadioSelectBox, RadioSelectBoxGroup } from '@/shared/ds/select-box'
import { Skeleton } from '@/shared/ds/skeleton'

/*
 * 줄 묶음의 기다림 자리(skeleton.md "틀은 먼저, 데이터 자리만 스켈레톤" · "크기 — 글은 글줄 높이") — 블록 하나로 덮지 않고, 실제 줄과
 * 같은 부품(List 줄 · Select Box 상자)에 글 줄만 스켈레톤으로 넣는다. 그래서 100% 에서는 실제 줄과 높이가 같고, 글자를 키우면 글 줄과
 * 함께 커진다. 상자 · 컨트롤(라디오 · 체크)은 실제 부품이 그리는 막힌 모양 그대로다. 누르거나 읽히지 않게 묶음째 inert · aria-hidden.
 */

const TITLE_WIDTHS = ['w-[128px]', 'w-[96px]', 'w-[112px]', 'w-[80px]']
const DETAIL_WIDTHS = ['w-[96px]', 'w-[144px]', 'w-[120px]', 'w-[104px]']
const at = (list: string[], i: number) => list[i % list.length]!

/** List 줄 자리 — 제목 t5 · 설명 t3(있으면) · 오른쪽 값 t5(있으면). 실제 줄의 앞 · 뒤 여백 · 최소 높이를 List 가 그대로 준다 */
export function ListRowsSkeleton({ count, detail = true, suffix = false }: { count: number; detail?: boolean; suffix?: boolean }) {
  return (
    <div aria-hidden inert data-skeleton-rows='list'>
      <List>
        {Array.from({ length: count }, (_, i) => (
          <ListItem
            key={i}
            title={<Skeleton text='t5' className={`${at(TITLE_WIDTHS, i)} max-w-full`} />}
            detail={detail ? <Skeleton text='t3' className={`${at(DETAIL_WIDTHS, i)} max-w-full`} /> : undefined}
            suffix={suffix ? <Skeleton text='t5' className='w-[80px]' /> : undefined}
            suffixText={suffix || undefined}
          />
        ))}
      </List>
    </div>
  )
}

/** Select Box 상자 자리 — 이름 t5 · 설명 t3(있으면). 오른쪽 라디오 · 체크는 막힌 실제 컨트롤이다 */
export function SelectBoxRowsSkeleton({ count, control, description = true }: { count: number; control: 'radio' | 'check'; description?: boolean }) {
  const label = (i: number) => <Skeleton text='t5' className={`${at(TITLE_WIDTHS, i)} max-w-full`} />
  const desc = (i: number) => (description ? <Skeleton text='t3' className={`${at(DETAIL_WIDTHS, i)} max-w-full`} /> : undefined)
  return (
    <div aria-hidden inert data-skeleton-rows='select-box'>
      {control === 'radio' ? (
        <RadioSelectBoxGroup disabled aria-label=''>
          {Array.from({ length: count }, (_, i) => (
            <RadioSelectBox key={i} value={`skeleton-${i}`} label={label(i)} description={desc(i)} />
          ))}
        </RadioSelectBoxGroup>
      ) : (
        <CheckSelectBoxGroup disabled aria-label=''>
          {Array.from({ length: count }, (_, i) => (
            <CheckSelectBox key={i} label={label(i)} description={desc(i)} checked={false} />
          ))}
        </CheckSelectBoxGroup>
      )}
    </div>
  )
}
