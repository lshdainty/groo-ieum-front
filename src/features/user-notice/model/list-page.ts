/**
 * 들어올 때의 목록 쪽 — 상세의 "‹ 공지사항" 이 그 쪽(`/notice?page=n`)으로 돌려보낸다. 라벨 = 목적지(side-navigation.md)라 되감지 않고 링크다.
 * 탭 안에서만 산다(sessionStorage) — 주소로 바로 들어온 새 탭에는 없어 쪽 없이 `/notice` 다. 저장소를 못 쓰면 쪽 없음.
 */
const KEY = 'notice_list_page'

export const rememberNoticeListPage = (page: number): void => {
  try {
    if (page > 1) sessionStorage.setItem(KEY, String(page))
    else sessionStorage.removeItem(KEY)
  } catch {
    /* 저장소를 못 쓰면 기억하지 않는다 */
  }
}

export const noticeListHref = (): string => {
  try {
    const n = Number(sessionStorage.getItem(KEY))
    return Number.isInteger(n) && n > 1 && n <= 2147483647 ? `/notice?page=${n}` : '/notice'
  } catch {
    return '/notice'
  }
}
