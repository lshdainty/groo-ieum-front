/**
 * 폰 공지 목록의 스크롤 자리 — 상세에서 되돌아올 때(POP) 불러온 쪽(react-query 캐시)과 함께 되살린다(I-23 G 54).
 * 본문 스크롤 상자는 셸의 main 이다. 떠나는 순간에는 이미 화면이 바뀌어 scrollTop 이 0 이므로, 보는 동안 스크롤 때마다 적어 둔다.
 * 모듈 변수라 새로 고침이면 사라진다(그때는 처음부터).
 */
let saved = 0

/** 이 화면이 떠 있는 동안 본문 스크롤을 따라 적는다 — 돌려주는 함수가 멈춘다 */
export const trackNoticeScroll = (): (() => void) => {
  const main = document.querySelector('main')
  if (!main) return () => {}
  const onScroll = () => {
    saved = main.scrollTop
  }
  main.addEventListener('scroll', onScroll, { passive: true })
  return () => main.removeEventListener('scroll', onScroll)
}

export const recallNoticeScroll = (): number => saved

export const forgetNoticeScroll = (): void => {
  saved = 0
}
