import { GrooTree } from '@/shared/ui/groo-tree'

interface HrLogoProps {
  /** 이름 글의 태그 — 로그인은 h1(화면 제목), 강제 변경은 p(그 화면의 제목이 따로 있다) */
  as?: 'h1' | 'p'
  /** 이름 아래 한 줄 — 위 8 */
  subtitle?: string
}

/**
 * 로고(I-22 G 31) — 나무 56 + 사이 8 + 이름 "그루 이음" 가로 묶음, 부제는 아래 8. 그림 파일이 아니라 진짜 글자라 잘리지 않는다.
 * 그루 담다 로그인과 한 값(text-display-md 32 / 1.2 · 700 · 자간 −0.32px). 나무는 장식(aria-hidden). 좁거나 글자가 커지면 두 줄로 접힌다.
 */
export function HrLogo({ as: Name = 'p', subtitle }: HrLogoProps) {
  return (
    <div className='flex flex-col items-center gap-x2 text-center'>
      <div className='flex flex-wrap items-center justify-center gap-x2'>
        <GrooTree size={56} />
        <Name className='m-0 break-keep text-display-md text-fg-neutral [overflow-wrap:break-word]'>그루 이음</Name>
      </div>
      {subtitle && (
        <p className='m-0 break-keep text-t5 font-normal text-fg-neutral-muted [overflow-wrap:break-word]'>{subtitle}</p>
      )}
    </div>
  )
}
