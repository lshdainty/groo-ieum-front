/** 두 글자 견본 — 칸에 들어가는지 재는 데만 쓴다(보이지 않고 읽히지 않는다). 칸은 `relative` */
export function WeekdayProbe({ text }: { text: string }) {
  return (
    <span aria-hidden data-weekday-probe className='invisible absolute whitespace-nowrap'>
      {text}
    </span>
  )
}
