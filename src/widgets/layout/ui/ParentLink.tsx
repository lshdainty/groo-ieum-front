import type { MouseEvent } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/shared/ds/button'
import { hasPreviousEntry } from '@/shared/ds/top-navigation/top-navigation-context'

/**
 * "‹ {부모}" — 데스크톱(768 이상) 하위 화면의 돌아가기(I-22 D 23 · 그루 담다 `ParentLink` 와 같은 꼴).
 * 누르면 기록을 되감고(앞 화면이 앱 안에 있을 때), 없으면(주소로 바로 · 새 탭) 부모 주소 `to` 로 간다. 새 탭 · 수정 키 누르기는 브라우저에 맡긴다.
 * 제목 줄 바로 위에 두고 그 아래 간격은 둘러싼 화면이 정한다.
 */
export function ParentLink({ to, label }: { to: string; label: string }) {
  const navigate = useNavigate()
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (!hasPreviousEntry()) return // 링크가 부모로 보낸다
    e.preventDefault()
    navigate(-1)
  }
  return (
    <Button asChild variant='ghost' size='small' flush='left' ghostColor='neutralSubtle'>
      <Link to={to} onClick={onClick}>
        <ChevronLeft aria-hidden />
        {label}
      </Link>
    </Button>
  )
}
