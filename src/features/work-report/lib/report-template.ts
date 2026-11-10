import dayjs from 'dayjs'

import type { WorkCodeResp, WorkGroupWithParts } from '@/entities/work'

/**
 * 예시 파일(엑셀로 가져오기에 붙여 넣을 모양) — 머리 한 줄 + 예시 한 줄. 쉼표로 나눈 CSV(BOM 포함 — 엑셀이 한글을 바로 읽는다).
 * 예시 줄은 지금 있는 분류 · 파트 · 구분의 첫 값으로 만들어 그대로 붙여도 오류가 나지 않는다(목록을 아직 못 받았으면 머리만).
 */
const BOM = String.fromCharCode(0xfeff)

export const templateCsv = (header: string[], groups: WorkGroupWithParts[], divisions: WorkCodeResp[], managerName: string): string => {
  const quote = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const group = groups.find((g) => g.labels.some((l) => l.parts.length > 0))
  const part = group?.labels.flatMap((l) => l.parts)[0]
  const division = divisions[0]
  const lines = [header]
  if (group && part && division) lines.push([dayjs().format('YYYY-MM-DD'), managerName, group.work_code_name, part.work_code_name, division.work_code_name, '8', ''])
  return `${BOM}${lines.map((l) => l.map(quote).join(',')).join('\r\n')}\r\n`
}
