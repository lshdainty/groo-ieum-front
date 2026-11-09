/** 휴가 내역 표의 날짜 시각 글 — 2026.08.12 09:00(표 줄과 확인창이 같은 글을 쓴다) */
export const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) {
    return '';
  }
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    return dateTimeString;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}.${month}.${day} ${hours}:${minutes}`;
};
