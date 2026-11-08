import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/shared/lib/cn";

/*
 * Groo Footer — 짜임은 SEED Footer(2026-10-15, 디자인 문서 "조합 예시" · registry block footer-01 ~ 04 · qvism-preset footer recipe).
 * 수치 원본은 specs/components/footer.yaml.
 * 사이트 맨 아래의 바닥 — 정해진 한 덩어리가 아니라 블록을 골라 조립한다. 필수 블록은 없고 위 → 아래 순서만 있다:
 *   탐색 영역(FooterNav — 브랜드 · 사이트맵) · 선(FooterDivider — 두 영역을 함께 쓸 때만) · 안내 영역(FooterInfo — 정책 링크 · 안내 글 ·
 *   사업자 정보 · 연락처 · 저작권 줄). 블록을 빼도 순서는 바꾸지 않는다. Desk · HR 의 제품 화면 · 앱에는 두지 않는다(정책 링크는 설정 목록의 줄).
 *   사업자 정보 · 연락처 · 소셜은 블록만 있다 — 값을 지어내 넣지 않는다(groo 에는 아직 그 값이 어디에도 없다).
 *
 *   Footer           <footer>(contentinfo — 한 페이지에 하나, article · section 안에 두지 않는다). 위 선(topLine, 기본 true — 화면 폭 전체
 *                    1px stroke-neutral-subtle)을 긋고, 안에 최대 1040(layout-max-content)의 가운데 틀 — 위아래 40 · 좌우 32(1280 미만 24 —
 *                    spacing-global-gutter) · 영역 사이 40. 바탕은 페이지 바탕 그대로(투명)
 *   FooterNav        탐색 영역 줄 — 브랜드 · 사이트맵을 한 줄에(사이 32), 넘치면 사이트맵이 브랜드 아래로(위아래도 32)
 *   FooterBrand      name(필수 — 글자 로고 "그루" t7 20 / 27 · 700 · fg-neutral) · description(소개 한 줄 — t3 13 / 18 ·
 *                    fg-neutral-subtle · 최대 340, 넘치면 줄을 바꾼다). 남은 폭을 차지하고(1 1 240) 최소 120, 이름 ↔ 소개 8
 *   FooterSitemap    <nav aria-label="사이트 지도">(기본 이름 — 머리의 주 메뉴 nav 와 이름으로 갈린다). 열을 가로로(사이 32 · 줄바꿈)
 *   FooterColumn     title(필수 — 열 제목 t3 13 / 18 · 500 · fg-neutral-muted, 머리말이 아니라 링크 목록의 이름 — aria-labelledby).
 *                    최소 100 · 제목 ↔ 링크 16 · 링크 사이 16. 안의 FooterLink 는 large. 링크가 아닌 글을 열에 넣지 않는다
 *   FooterDivider    선 — 1px stroke-neutral-subtle, 틀 안 폭. 장식(역할 없음)
 *   FooterInfo       안내 영역 — 정책 링크 줄 · 안내 글 · 저작권 줄을 세로로(사이 16)
 *   FooterLinks      정책 링크 줄 — 링크 사이 24 · 줄을 바꾸면 위아래 8(SEED 는 위아래도 24 — 비교 페이지 그림을 따랐다)
 *   FooterText       안내 글 · 사업자 정보 · 연락처 — t3 13 / 18 · fg-neutral-subtle. 사업자 정보 · 연락처는 항목을 " | " 로 잇고
 *                    묶음이 바뀌면 줄을 바꾼다(<br />)
 *   FooterBottom     저작권 줄 — 저작권(앞) · 소셜(끝)이 1280 이상은 한 줄 양 끝(사이 16 · 넘치면 줄바꿈), 1280 미만은 위아래(왼쪽 정렬)
 *   FooterCopyright  owner(필수) · year(기본 그리는 때의 해) → "© 2026 그루" — t4 14 / 19 · 500 · fg-neutral-muted. 안내 영역의 마지막
 *   FooterSocial     소셜 버튼 묶음(사이 24) — 안에는 Button ghost · large · iconOnly + 이름. 버튼마다 바깥 여백만큼 끝을 맞춘다
 *                    (SEED bleedX asPadding — 좌우 −12)
 *   FooterLink       href(필수) · size(large — 사이트맵 t5 16 / 22 · 500 · fg-neutral, 올리면 · 누르면 fg-neutral-subtle /
 *                    medium — 정책 t4 14 / 19 · 500 · fg-neutral-muted, 올리면 · 누르면 fg-neutral. 기본은 놓인 자리 — 열 안 large, 그 밖
 *                    medium) · external(새 탭 — target="_blank" · rel="noopener" · 뒤에 ↗ lucide arrow-up-right 14 · 12(장식) ·
 *                    보이지 않는 "(새 탭)"). 밑줄 없음 — 올림 · 누름은 색으로(color-transition). 키보드 포커스에만 링 2px · 띄움 2px ·
 *                    모서리 4. 같은 탭으로 가는 서비스 링크에는 ↗ 를 두지 않는다
 */

export type FooterLinkSize = "large" | "medium";

// 바닥 — 화면 폭 전체(위 선). 틀은 안쪽 div
const ROOT = "w-full bg-transparent font-sans";
const ROOT_TOP_LINE = "border-t border-solid border-stroke-neutral-subtle";
const FRAME = "mx-auto flex w-full max-w-(--layout-max-content) flex-col gap-x10 px-global-gutter py-x10 lg:px-x8";

const NAV = "flex flex-wrap items-start gap-x8";
const BRAND = "flex min-w-[120px] flex-[1_1_240px] flex-col items-start gap-x2";
const BRAND_NAME = "m-0 text-t7 font-bold text-fg-neutral";
const BRAND_INTRO = "m-0 max-w-[340px] text-t3 font-normal text-fg-neutral-subtle";
const SITEMAP = "flex flex-wrap items-start gap-x8";
const COLUMN = "flex min-w-[100px] flex-col items-start gap-x4";
const COLUMN_TITLE = "text-t3 font-medium text-fg-neutral-muted";
const COLUMN_LINKS = "m-0 flex list-none flex-col items-start gap-x4 p-0";
const DIVIDER = "h-px w-full shrink-0 bg-stroke-neutral-subtle";
const INFO = "flex flex-col items-start gap-x4";
const LINKS = "flex flex-wrap items-center gap-x-x6 gap-y-x2";
const TEXT = "m-0 text-t3 font-normal text-fg-neutral-subtle";
const BOTTOM = "flex w-full flex-col flex-wrap items-start justify-between gap-x4 lg:flex-row lg:items-center";
const COPYRIGHT = "m-0 text-t4 font-medium text-fg-neutral-muted";
const SOCIAL = "flex items-center gap-x6 [&>*]:-mx-x3";

// 링크 — 글 + 뒤 ↗(새 탭만). 밑줄 없이 색으로 올림 · 누름
const LINK = [
  "inline-flex cursor-pointer items-center gap-x1 rounded-r1 no-underline",
  "[transition:color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
  "[&>svg]:shrink-0",
].join(" ");
const LINK_SIZE: Record<FooterLinkSize, string> = {
  large: "text-t5 font-medium text-fg-neutral hover:text-fg-neutral-subtle active:text-fg-neutral-subtle [&>svg]:size-[14px]",
  medium: "text-t4 font-medium text-fg-neutral-muted hover:text-fg-neutral active:text-fg-neutral [&>svg]:size-3",
};

// 링크의 기본 크기 — 놓인 자리가 정한다(열 안 large, 그 밖 medium)
const FooterLinkSizeContext = React.createContext<FooterLinkSize>("medium");

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  /** 위 선 — 본문과 바닥을 가른다(화면 폭 전체). 기본 true */
  topLine?: boolean;
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(({ topLine = true, className, children, ...props }, ref) => (
  <footer ref={ref} data-slot="footer" className={cn(ROOT, topLine && ROOT_TOP_LINE, className)} {...props}>
    <div data-slot="footer-frame" className={FRAME}>
      {children}
    </div>
  </footer>
));
Footer.displayName = "Footer";

const FooterNav = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="footer-nav" className={cn(NAV, className)} {...props} />
));
FooterNav.displayName = "FooterNav";

export interface FooterBrandProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** 글자 로고 — "그루" */
  name: React.ReactNode;
  /** 소개 한 줄 */
  description?: React.ReactNode;
}

const FooterBrand = React.forwardRef<HTMLDivElement, FooterBrandProps>(({ name, description, className, ...props }, ref) => (
  <div ref={ref} data-slot="footer-brand" className={cn(BRAND, className)} {...props}>
    <p data-slot="footer-brand-name" className={BRAND_NAME}>
      {name}
    </p>
    {description != null && description !== false && description !== "" && (
      <p data-slot="footer-brand-description" className={BRAND_INTRO}>
        {description}
      </p>
    )}
  </div>
));
FooterBrand.displayName = "FooterBrand";

const FooterSitemap = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, "aria-label": ariaLabel = "사이트 지도", ...props }, ref) => (
    <nav ref={ref} data-slot="footer-sitemap" aria-label={ariaLabel} className={cn(SITEMAP, className)} {...props} />
  ),
);
FooterSitemap.displayName = "FooterSitemap";

export interface FooterColumnProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** 열 제목 — 링크 목록의 이름("서비스" · "계정") */
  title: React.ReactNode;
}

// 열 — 제목은 머리말이 아니라 목록의 이름이다(aria-labelledby). 링크는 하나씩 <li> 로 감싼다
const FooterColumn = React.forwardRef<HTMLDivElement, FooterColumnProps>(({ title, className, children, ...props }, ref) => {
  const titleId = React.useId();
  return (
    <div ref={ref} data-slot="footer-column" className={cn(COLUMN, className)} {...props}>
      <span id={titleId} data-slot="footer-column-title" className={COLUMN_TITLE}>
        {title}
      </span>
      <FooterLinkSizeContext.Provider value="large">
        <ul aria-labelledby={titleId} data-slot="footer-column-links" className={COLUMN_LINKS}>
          {React.Children.toArray(children).map((child, i) => (
            <li key={React.isValidElement(child) && child.key != null ? child.key : i} className="flex">
              {child}
            </li>
          ))}
        </ul>
      </FooterLinkSizeContext.Provider>
    </div>
  );
});
FooterColumn.displayName = "FooterColumn";

const FooterDivider = React.forwardRef<HTMLDivElement, Omit<React.HTMLAttributes<HTMLDivElement>, "children">>(({ className, ...props }, ref) => (
  <div ref={ref} aria-hidden data-slot="footer-divider" className={cn(DIVIDER, className)} {...props} />
));
FooterDivider.displayName = "FooterDivider";

const FooterInfo = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="footer-info" className={cn(INFO, className)} {...props} />
));
FooterInfo.displayName = "FooterInfo";

const FooterLinks = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="footer-links" className={cn(LINKS, className)} {...props} />
));
FooterLinks.displayName = "FooterLinks";

const FooterText = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => (
  <p ref={ref} data-slot="footer-text" className={cn(TEXT, className)} {...props} />
));
FooterText.displayName = "FooterText";

const FooterBottom = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="footer-bottom" className={cn(BOTTOM, className)} {...props} />
));
FooterBottom.displayName = "FooterBottom";

export interface FooterCopyrightProps extends Omit<React.HTMLAttributes<HTMLParagraphElement>, "children"> {
  /** 저작권자 — "그루" */
  owner: string;
  /** 해 — 기본은 그리는 때의 해(박아 두지 않는다) */
  year?: number;
}

const FooterCopyright = React.forwardRef<HTMLParagraphElement, FooterCopyrightProps>(({ owner, year, className, ...props }, ref) => (
  <p ref={ref} data-slot="footer-copyright" className={cn(COPYRIGHT, className)} {...props}>
    © {year ?? new Date().getFullYear()} {owner}
  </p>
));
FooterCopyright.displayName = "FooterCopyright";

const FooterSocial = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} data-slot="footer-social" className={cn(SOCIAL, className)} {...props} />
));
FooterSocial.displayName = "FooterSocial";

export interface FooterLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  /** large(사이트맵) · medium(정책) — 기본은 놓인 자리(열 안 large, 그 밖 medium) */
  size?: FooterLinkSize;
  /** 새 탭으로 연다 — 처리방침처럼 읽고 돌아오는 문서 · 다른 사이트. ↗ + 보이지 않는 "(새 탭)" */
  external?: boolean;
}

const FooterLink = React.forwardRef<HTMLAnchorElement, FooterLinkProps>(({ size: sizeProp, external = false, className, children, ...props }, ref) => {
  const placed = React.useContext(FooterLinkSizeContext);
  const size = sizeProp ?? placed;
  return (
    <a
      ref={ref}
      data-slot="footer-link"
      data-size={size}
      className={cn(LINK, LINK_SIZE[size], className)}
      {...(external ? { target: "_blank", rel: "noopener" } : {})}
      {...props}
    >
      {children}
      {external && (
        <>
          <ArrowUpRight aria-hidden data-slot="footer-link-icon" />
          <span className="sr-only"> (새 탭)</span>
        </>
      )}
    </a>
  );
});
FooterLink.displayName = "FooterLink";

export {
  Footer,
  FooterNav,
  FooterBrand,
  FooterSitemap,
  FooterColumn,
  FooterDivider,
  FooterInfo,
  FooterLinks,
  FooterText,
  FooterBottom,
  FooterCopyright,
  FooterSocial,
  FooterLink,
};
