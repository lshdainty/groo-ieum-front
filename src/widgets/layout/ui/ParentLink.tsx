import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/ds/button'

/**
 * "‹ {부모}" — 데스크톱(768 이상) 하위 화면의 돌아가기(I-22 D 23 · 그루 담다 `ParentLink` 와 같은 꼴).
 * 라벨 = 목적지(side-navigation.md)라 기록을 되감지 않고 `to` 로 가는 링크다(지시서 G 57 의 "기록이 있으면 되감기" 는 스펙 우선으로 걷음).
 * 브라우저 뒤로 가기는 그대로 앞 화면으로 간다. 제목 줄 바로 위에 두고 그 아래 간격은 둘러싼 화면이 정한다.
 */
export function ParentLink({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant='ghost' size='small' flush='left' ghostColor='neutralSubtle'>
      <Link to={to}>
        <ChevronLeft aria-hidden />
        {label}
      </Link>
    </Button>
  )
}
