import { useId, type HTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/shared/lib/cn'
import { CARD_TITLE } from '@/shared/ds/card/card-variants'

/**
 * 폰(768 미만) 띠 화면의 틀(I-23 T1 · T2 · T3) — 자식 하나 = 띠 하나, 띠 사이 8(회색 바닥이 비친다), 맨 위 · 맨 아래 틈 0.
 * 데스크톱에서는 같은 자식을 카드로 그리므로 이 틀을 쓰지 않는다(카드 사이 8 은 쓰는 쪽이 flex gap 으로).
 */
export function ScreenBands({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-col gap-x2', className)}>{children}</div>
}

/**
 * 띠 하나(흰 면, 좌우 끝까지). 머리 = 글 위 24 · 좌우 24 · 아래 4(T4), 본문 = 머리 ↔ 본문 8 · 좌우 24 · 아래 24(T5).
 * body "list" 는 List 를 바로 담는다 — 머리 ↔ 첫 줄 4 · 줄 사이 0 · 아래 12(T6, 줄이 가장자리까지).
 * 제목은 h2(화면 제목 h1 은 상단 바), 이름은 aria-labelledby 로 잇는다.
 */
export function Band({
  title,
  action,
  leading,
  body = 'content',
  children,
  className,
  ...rest
}: Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title: ReactNode
  action?: ReactNode
  /** 머리 위의 줄 — 화면 전체를 바꾸는 조절(연도 · 달)을 첫 띠 안 맨 위에(위 16 · 좌우 24, 머리 위 24 는 그대로) */
  leading?: ReactNode
  body?: 'content' | 'list'
  children: ReactNode
  className?: string
}) {
  const titleId = useId()
  return (
    <section aria-labelledby={titleId} data-band className={cn('bg-bg-layer-default', className)} {...rest}>
      {leading != null && <div className='px-x6 pt-x4'>{leading}</div>}
      <div className='flex items-center justify-between gap-x2 px-x6 pb-x1 pt-x6'>
        <h2 id={titleId} className={CARD_TITLE}>
          {title}
        </h2>
        {action != null && <div className='flex shrink-0 items-center'>{action}</div>}
      </div>
      <div className={body === 'list' ? 'pb-x3' : 'px-x6 pb-x6 pt-x2'}>{children}</div>
    </section>
  )
}
