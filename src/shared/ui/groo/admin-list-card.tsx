import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

import { Card, CardHeader, CardTitle } from '@/shared/ds/card'
import { Input } from '@/shared/ds/input'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'

/**
 * 관리 화면 목록 면(I-24 H 36 · I 41) — 1280 · 1024: Card `list`(머리 "정책 {n}개" → 밑줄 검색칸 → 줄) / 폰: 흰 면 위에 같은 머리 · 검색칸 · 줄.
 * 정책 · 플랜이 같은 틀을 쓴다. 줄은 `children`(List)이 그린다.
 */
export function AdminListCard({
  heading,
  searchLabel,
  searchPlaceholder,
  query,
  onQueryChange,
  showSearch = true,
  children,
}: {
  heading: string
  searchLabel: string
  searchPlaceholder: string
  query: string
  onQueryChange: (query: string) => void
  /** 줄이 하나도 없으면(빈 화면) 검색칸을 두지 않는다 */
  showSearch?: boolean
  children: ReactNode
}) {
  const desktop = useDesktop()
  const search = showSearch ? (
    <div className='px-x6 pb-x2 pt-x1'>
      <Input
        variant='underline'
        type='search'
        aria-label={searchLabel}
        placeholder={searchPlaceholder}
        prefixIcon={<Search className='size-[18px]' aria-hidden />}
        clearable
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        data-admin-search
      />
    </div>
  ) : null
  if (desktop) {
    return (
      <Card body='list' data-admin-list-card>
        <CardHeader>
          <CardTitle>{heading}</CardTitle>
        </CardHeader>
        {search}
        {children}
      </Card>
    )
  }
  return (
    <div className='bg-bg-layer-default pb-x2' data-admin-list-card>
      <h2 className='m-0 px-x6 pb-x1 pt-x4 text-t5 font-bold text-fg-neutral'>{heading}</h2>
      {search}
      {children}
    </div>
  )
}
