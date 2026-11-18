import { useLayoutEffect, useRef, useState } from 'react'

/** 넓은 화면의 한 줄 달 수 — 1280 이상 4 · 768 이상 3 · 그 밑 2(전에 격자 클래스 grid-cols-2 · md:3 · lg:4 로 두던 값) */
const preferredColumns = (): number => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return 2
  if (window.matchMedia('(min-width: 1280px)').matches) return 4
  if (window.matchMedia('(min-width: 768px)').matches) return 3
  return 2
}

/**
 * 캘린더 년 보기의 한 줄 달 수 — groo-design #257(DESIGN.md Layout › 지원 폭): 날짜 칸이 요일 · 날짜 글보다 좁아지면 한 줄에 놓는 달 수를
 * 줄인다(… → 3 → 2 → 1). 화면은 그만큼 세로로 길어지고, 작은 달의 글은 글자 크기 설정을 그대로 따른다(상한 · 고정 없음).
 *
 * 판정 — 가장 넓은 요일 · 날짜 글(견본 `probeRef` 안의 글: 가장 짧은 꼴 요일 · 날짜 1 ~ 31 — 사용자 결정의 "가장 넓은 요일 · 날짜 글(예: 28)")이 날짜 칸에 드는가. 칸 폭은 달 수 c 에서
 *   달 폭 = (격자 폭 − (c − 1) × 달 사이) ÷ c,  칸 폭 = (달 폭 − 달 안 여백 · 테두리 − 6 × 칸 사이) ÷ 7
 * 로 센다(달 안 여백 · 테두리 · 칸 사이는 그려진 첫 달에서 잰다). 넓은 화면의 달 수에서 하나씩 줄여 처음 드는 수, 끝까지 안 들면 1.
 * 격자 폭(창 폭)과 견본 크기(글자 크기 · 언어)를 ResizeObserver 로 지켜, 페이지가 뜬 뒤 바뀌어도 다시 센다.
 */
export function useYearColumns() {
  const gridRef = useRef<HTMLDivElement>(null)
  const probeRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(preferredColumns)
  useLayoutEffect(() => {
    const grid = gridRef.current
    const probe = probeRef.current
    if (!grid || !probe) return
    const measure = () => {
      const need = Math.max(0, ...Array.from(probe.children).map((el) => el.getBoundingClientRect().width))
      const month = grid.querySelector<HTMLElement>('[data-year-month]')
      const row = month?.querySelector<HTMLElement>('[data-weekday-row]')
      const overhead = month && row ? month.getBoundingClientRect().width - row.getBoundingClientRect().width : 0
      const cellGap = row ? parseFloat(getComputedStyle(row).columnGap) || 0 : 0
      const gap = parseFloat(getComputedStyle(grid).columnGap) || 0
      const width = grid.clientWidth
      let next = preferredColumns()
      for (; next > 1; next -= 1) {
        const monthWidth = (width - (next - 1) * gap) / next
        const cell = (monthWidth - overhead - 6 * cellGap) / 7
        if (cell >= need) break
      }
      setColumns(next)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(grid)
    observer.observe(probe)
    return () => observer.disconnect()
  }, [])
  return { gridRef, probeRef, columns }
}
