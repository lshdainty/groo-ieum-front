import type { ReactNode } from 'react'

interface OutsideShellProps {
  children: ReactNode
  /**
   * center(기본) — 본문을 남은 높이의 세로 가운데에(위아래 40 · 좌우 24): 로그인 · 강제 변경 · 결과 · 기다림.
   * page — 본문이 위부터 틀 전체 폭으로(폰 결과 화면: 바닥 고정 버튼을 아래에 붙인다).
   */
  layout?: 'center' | 'page'
}

/**
 * 앱 틀 밖 화면의 흰 면(I-22 G 32) — 카드 · 테두리 · 그림자 없는 면 하나(bg-layer-default), 세로 100dvh.
 * 로그인 · 비밀번호 강제 변경 · 결과 · 세션 확인 중 · 로그인 전 404 가 쓴다. 바닥(Footer)은 두지 않는다.
 * 노치 가로 화면에서는 좌우 · 아래 안전 영역만큼 비운다(viewport-fit=cover). 다크는 html 의 테마 클래스가 토큰을 바꾼다.
 */
export function OutsideShell({ children, layout = 'center' }: OutsideShellProps) {
  const center = layout === 'center'
  return (
    <div className='flex min-h-dvh flex-col bg-bg-layer-default pb-[env(safe-area-inset-bottom)] text-fg-neutral'>
      {center ? (
        <main
          id='main'
          className='flex flex-1 flex-col items-center justify-center pb-x10 pt-[max(var(--spacing-x10),env(safe-area-inset-top))] pl-[max(var(--spacing-x6),env(safe-area-inset-left))] pr-[max(var(--spacing-x6),env(safe-area-inset-right))]'
        >
          {children}
        </main>
      ) : (
        <main id='main' className='flex flex-1 flex-col'>
          {children}
        </main>
      )}
    </div>
  )
}
