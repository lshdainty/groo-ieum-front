import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'

import { Button } from '@/shared/ds/button'
import { ResultSection, type ResultSectionKind } from '@/shared/ds/result-section'
import { usePageTitle } from '@/shared/lib/page-title'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { OutsideShell } from './OutsideShell'

interface ResultScreenProps {
  kind: ResultSectionKind
  /** empty 는 무엇이 비었는지 말하는 아이콘을 꼭 준다. failure 는 안 주면 circle-alert */
  icon?: ReactNode
  title: string
  description?: ReactNode
  /** 문서 제목 앞부분 — 없으면 title */
  documentTitle?: string
  /** 버튼 이름 + 누르면(Promise 를 돌려주면 끝날 때까지 로딩) */
  action: { label: string; onClick: () => unknown; loading?: boolean }
}

// 폰 바닥 고정 버튼이 키보드 위로 올라오게 하는 높이(px) — 키보드가 가린 만큼(visualViewport). 없으면 0
const useKeyboardInset = (): number => {
  const [inset, setInset] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)))
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return inset
}

/**
 * 결과 화면(I-22 G 35 · J 40) — 흰 면 가운데 Result Section large 하나 + 버튼 하나. 카드 · 빨간 상자 없음.
 * 폰(768 미만): 바닥 고정 neutralSolid large 폭 전체(좌우 24 · 위 12 · 아래 16 + 안전 영역) · 768 이상: 묶음(최대 420) 아래 28 가운데, 글만큼의 폭.
 * 버튼을 Result Section 안에 두지 않는다 — 그 안의 버튼은 neutralWeak 라 회색 바닥이 아닌 흰 면 위여야 보이고, 이 화면은 큰 neutralSolid 를 쓴다.
 * 화면 제목은 Result Section 제목 하나(h1). 화면이 결과로 바뀌면 제목으로 초점을 옮겨 낭독이 새 화면을 알린다.
 */
export function ResultScreen({ kind, icon, title, description, documentTitle, action }: ResultScreenProps) {
  usePageTitle(documentTitle ?? title)
  const desktop = useDesktop()
  const rootRef = useRef<HTMLDivElement>(null)
  const kbInset = useKeyboardInset()

  // Result Section 은 처음 한 프레임 내용을 감추므로(visibility) 그 뒤 프레임에 초점을 옮긴다
  useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => {
        const h1 = rootRef.current?.querySelector('h1')
        if (h1) {
          h1.setAttribute('tabindex', '-1')
          h1.focus({ preventScroll: true })
        }
      })
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [])

  const shownIcon = icon ?? (kind === 'failure' ? <CircleAlert /> : undefined)
  const section =
    kind === 'empty' ? (
      <ResultSection kind='empty' icon={shownIcon} title={title} description={description} as='h1' />
    ) : (
      <ResultSection kind={kind} icon={shownIcon} title={title} description={description} as='h1' />
    )

  if (desktop) {
    return (
      <OutsideShell>
        <div ref={rootRef} className='flex w-full max-w-[420px] flex-col items-center outline-none [&_h1]:outline-none'>
          {section}
          <Button type='button' variant='neutralSolid' size='large' className='mt-x7' loading={action.loading} onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      </OutsideShell>
    )
  }
  return (
    <OutsideShell layout='page'>
      <div ref={rootRef} className='flex flex-1 flex-col [&_h1]:outline-none'>
        <div className='flex flex-1 flex-col items-stretch justify-center py-x10'>{section}</div>
        <div
          className='sticky z-(--z-sticky) flex flex-col bg-bg-layer-default pb-[calc(var(--spacing-x4)+env(safe-area-inset-bottom))] pl-[max(var(--spacing-x6),env(safe-area-inset-left))] pr-[max(var(--spacing-x6),env(safe-area-inset-right))] pt-x3'
          style={{ bottom: kbInset }}
        >
          <Button type='button' variant='neutralSolid' size='large' className='w-full' loading={action.loading} onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      </div>
    </OutsideShell>
  )
}
