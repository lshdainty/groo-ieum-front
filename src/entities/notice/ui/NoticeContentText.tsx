import { cn } from '@/shared/lib/cn'

/** 공지 본문 글 — text-article-body 16 / 24 · fg-neutral · 줄바꿈 그대로(pre-wrap) · 낱말 단위 + 긴 낱말은 anywhere(I-23 G 57 · H 61) */
export const NoticeContentText = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
  <p className={cn('m-0 whitespace-pre-wrap text-article-body text-fg-neutral [overflow-wrap:anywhere]', className)}>{children}</p>
)
