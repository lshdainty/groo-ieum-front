import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { datePickerLabels } from '@/shared/ds/date-picker'

/** 요일 글 — 지금 언어의 ds 날짜 고르기 글(`ds,datePicker.weekday.*` · `weekdayNarrow.*` · 읽는 요일). 언어를 인자로 받아 언어가 바뀌면 다시 읽는다 */
const labelsFor = (language: string) => {
  void language // 글은 ds 사전이 지금 언어로 읽는다 — 언어는 다시 읽을 열쇠로만 받는다(컴파일러가 처음 글에 묶지 않게)
  return datePickerLabels()
}

/**
 * 일곱 칸 위의 요일 머리(캘린더 월 · 년 · 주 보기, 홈 업무 미작성 달력) — groo-design #256(international-design "날짜").
 * 한국어 "일 ~ 토", 영어 두 글자 Su Mo Tu We Th Fr Sa. 칸에 들지 않는 폭 · 글자 크기에서만 한 글자 S M T W T F S 로 줄이고, 줄을 바꾸지
 * 않으며, 넓은 화면이라도 세 글자(Sun)로 늘리지 않는다. 글은 ds 날짜 고르기와 같은 사전이고, 판정도 ds `DatePicker` 의 요일 줄과 같은 셈이다
 * — 칸마다 두 글자 견본([WeekdayProbe], 보이지 않음)을 두고 그 폭이 칸 폭을 넘는 칸이 하나라도 있으면 한 글자. 줄 · 견본을 ResizeObserver 로
 * 지켜 창 폭 · 글자 크기가 바뀌면 다시 잰다. (ds 의 요일 줄 부품은 내보내지 않아 같은 셈을 여기 둔다 — 담다 ds 가 내보내면 그것으로 바꾼다)
 *
 * 쓰는 법: 줄 요소에 `rowRef`, 칸마다 `data-weekday-cell` + `relative`, 칸 안에 보이는 글 `shown[i]` 와 `<WeekdayProbe text={full[i]} />`(weekday-probe.tsx).
 */
export function useWeekdayHeader<T extends HTMLElement = HTMLDivElement>() {
  const { i18n } = useTranslation()
  const labels = labelsFor(i18n.language)
  const rowRef = useRef<T>(null)
  const [narrow, setNarrow] = useState(false)
  const key = labels.weekdays.join('\u0000')
  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row) return
    const cells = Array.from(row.querySelectorAll<HTMLElement>('[data-weekday-cell]'))
    const probes = cells.map((c) => c.querySelector<HTMLElement>('[data-weekday-probe]'))
    const measure = () =>
      setNarrow(cells.some((c, i) => (probes[i]?.getBoundingClientRect().width ?? 0) > c.getBoundingClientRect().width))
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    for (const p of probes) if (p) observer.observe(p)
    return () => observer.disconnect()
  }, [key])
  return {
    rowRef,
    narrow,
    /** 보이는 요일(일요일부터 일곱) — 두 글자, 칸에 들지 않으면 한 글자 */
    shown: narrow ? labels.weekdaysNarrow : labels.weekdays,
    /** 두 글자 요일 — 견본 */
    full: labels.weekdays,
    /** 읽는 요일 */
    long: labels.weekdaysLong,
  }
}
