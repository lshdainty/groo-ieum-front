import type { NoticeListResp } from '@/entities/notice'

/**
 * 고정 묶음 — 서버가 고정을 먼저 준다("order by isPinned desc, createAt desc"). 순서는 바꾸지 않고 머리만 넣는다(I-23 G 56).
 * 고정이 없으면 한 묶음(머리 없음), 있으면 [고정, 나머지] 두 묶음(나머지가 없으면 고정만).
 */
export interface NoticeGroup {
  id: 'pinned' | 'all'
  items: NoticeListResp[]
  /** 머리를 그리는가 — 고정이 있는 쪽만 */
  titled: boolean
}

export function groupNotices(items: NoticeListResp[]): NoticeGroup[] {
  const pinned = items.filter((n) => n.is_pinned === 'Y')
  if (pinned.length === 0) return [{ id: 'all', items, titled: false }]
  const rest = items.filter((n) => n.is_pinned !== 'Y')
  const groups: NoticeGroup[] = [{ id: 'pinned', items: pinned, titled: true }]
  if (rest.length > 0) groups.push({ id: 'all', items: rest, titled: true })
  return groups
}
