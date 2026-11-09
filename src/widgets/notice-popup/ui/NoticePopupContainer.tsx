import { useActiveNoticesQuery, useNoticeQuery } from '@/entities/notice';
import { useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NoticePopup } from '@/widgets/notice-popup/ui/NoticePopup';

const STORAGE_KEY = 'notice_popup_hidden_date';

/**
 * 오늘 공지사항 팝업을 숨겼는지 확인
 */
const isAllHiddenToday = (): boolean => {
  const hiddenDate = localStorage.getItem(STORAGE_KEY);
  if (!hiddenDate) return false;
  const today = new Date().toDateString();
  return hiddenDate === today;
};

/**
 * 오늘 날짜로 공지사항 팝업 숨김 설정
 */
const hideAllToday = (): void => {
  const today = new Date().toDateString();
  localStorage.setItem(STORAGE_KEY, today);
};

/**
 * 공지사항 팝업 컨테이너
 * 불러오지 못하면(목록 · 본문) 띄우지 않고 안내도 하지 않는다 — 저절로 뜨는 보조 표면이라 사용자가 한 일이 아니다(실패는 공지사항 화면이 알린다).
 * 앱 틀이 열릴 때 활성 공지사항이 있으면 창 하나에 띄우고, 한 창 안에서 ‹ › 로 넘겨 본다.
 * 닫으면 이번 진입에서는 다시 뜨지 않고(다음 공지가 이어 뜨지 않는다), [오늘은 그만 보기] 는 이 기기의 모든 공지를 하루 가린다.
 */
export const NoticePopupContainer = () => {
  // 오늘 그만 보기로 가린 기기는 처음부터 띄우지 않는다
  const [hiddenOnLoad] = useState(() => isAllHiddenToday());
  const { data: activeNotices, isLoading: isLoadingList } = useActiveNoticesQuery(0, 50, { quiet: true });
  const [currentIndex, setCurrentIndex] = useState(0);
  // 열려 있다 — 목록이 오면 저절로 열리고, 닫으면 이번 진입에서는 다시 열지 않는다
  const [dismissed, setDismissed] = useState(false);

  // 공지사항 화면(목록 · 상세)에서는 띄우지 않는다 — 같은 공지를 팝업과 화면이 함께 받으면 조회수가 +2 가 된다
  const { pathname } = useLocation();
  const onNoticeScreen = pathname === '/notice' || pathname.startsWith('/notice/');

  // 활성 공지사항 목록
  const notices = useMemo(() => {
    if (!activeNotices?.content) return [];
    return activeNotices.content;
  }, [activeNotices]);

  const current = notices[currentIndex];

  // 현재 공지사항 상세 조회 — 보이는 것 하나씩 받는다
  const { data: currentNotice } = useNoticeQuery(!dismissed && !hiddenOnLoad && !onNoticeScreen && current ? current.notice_id : null, { quiet: true });

  // [오늘은 그만 보기]
  const handleHideToday = () => {
    hideAllToday();
    setDismissed(true);
  };

  if (hiddenOnLoad || onNoticeScreen || isLoadingList || !current) {
    return null;
  }

  return (
    <NoticePopup
      open={!dismissed}
      notice={current}
      content={currentNotice?.notice_id === current.notice_id ? currentNotice.content : undefined}
      index={currentIndex}
      total={notices.length}
      onPrev={() => setCurrentIndex((i) => Math.max(0, i - 1))}
      onNext={() => setCurrentIndex((i) => Math.min(notices.length - 1, i + 1))}
      onClose={() => setDismissed(true)}
      onHideToday={handleHideToday}
    />
  );
};
