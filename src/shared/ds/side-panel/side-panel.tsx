import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useLeaveConfirm } from "@/shared/ds/alert-dialog";
import { useBackClose, useRefocusAfterBusy } from "@/shared/ds/overlay";
import { useInputButtonSurface } from "@/shared/ds/input-button";
import { useScrollFog } from "@/shared/ds/scroll-fog";

/*
 * Groo Side Panel — 구조는 SEED Side Panel(2026-10-04). 수치 원본은 specs/components/side-panel.yaml. Radix Dialog 위에 짰다.
 * 옛 Sheet(shadcn — 네 방향 · 75% · 384 · 그림자 · 선)를 대신한다 — 아래에서 올라오는 것은 Bottom Sheet, 위에서 내려오는 패널은 없다.
 *
 *   SidePanel          화면 옆에서 미끄러져 나오는 모달 — open · defaultOpen · onOpenChange · form · dirty
 *   SidePanelTrigger   여는 버튼(asChild) — 닫으면 초점이 여기로 돌아온다
 *   SidePanelContent   패널 — side "left"(768 미만의 주 메뉴 서랍 — 화면 폭의 80%) · "right"(기본 — 1280 이상의 보조 작업),
 *                      size "small" 480 · "medium" 720(기본) · "large" 960(오른쪽만 — 768 미만이면 크기와 상관없이 80%),
 *                      title(필수) · description(있을 때만) · showCloseButton(기본 켬 — form 이면 그리지 않는다)
 *   SidePanelBody      본문 — 이 안에서만 스크롤, 위로 스크롤되면 머리 아래 1px 선. scrollFog 면 끝 흐림(Scroll Fog overlayBody —
 *                      늘 켜진 위 20 · 아래 80 + 본문 안 여백 위 20 · 아래 80) — 넘칠 수 있는 본문(주 메뉴 · 목록 · 긴 폼)에만
 *   SidePanelFooter    바닥 — 오른쪽 정렬, 사이 8. Button small 36 을 크기를 주지 않은 바로 아래 자식에 넣는다
 *
 * 1280 미만에서 오른쪽 패널을 Bottom Sheet 로 바꾸는 부품은 오른쪽 패널을 쓸 자리가 생길 때 Responsive Dialog 처럼 더한다.
 *
 * 닫는 길(side-panel.md Behavior — Dialog · Bottom Sheet 와 같은 규칙, 2026-10-02)
 *   - 닫기 버튼 · Esc 는 닫는다. 뒤로 가기는 1280 미만에서 닫는다(그 위에서 뒤로 가기는 "이전 페이지" — alert-dialog.tsx 의 useBackClose).
 *   - 바깥(딤) 누르기 · 붙은 쪽으로 끌기는 주 메뉴 · 조회만 닫는다. form(입력 폼)이면 둘 다 무시한다 — 머리 닫기 버튼도 없다(바닥 [취소]).
 *   - 끌기는 손가락 · 펜만(마우스로 끌면 글 고르기와 겹친다) — 가로로 10 을 먼저 움직여야 끌기로 본다(세로면 본문 스크롤).
 *     놓을 때 0.4px/ms 보다 빨랐거나 폭의 25% 이상 밀었으면 닫고, 아니면 300ms 로 제자리(Bottom Sheet 와 같은 기준). 딤은 손가락을 따라 옅어진다.
 *   - dirty 면 어느 길이든 닫기 전에 "작성한 내용이 사라져요" 를 묻는다 — [계속 작성] 이면 그대로(끌던 패널은 제자리로).
 *   - busy(저장 중)면 어느 길도 받지 않는다 — 묻지도 않는다(Esc · 바깥 · 닫기 · 끌기 무시, 뒤로 가기는 칸을 다시 쌓는다). 본문 입력도 받지 않는다(inert),
 *     content 는 aria-busy. 저장 단추의 로딩이 "기다려라" 를 말한다(Bottom Sheet 와 같은 계약 — [sso-front 판에서 손으로 더한 자리, SOURCE.md 13]).
 *   - 왼쪽 패널(주 메뉴)은 창이 768 이상으로 넓어지면 닫힌다 — 사이드바가 그 자리를 맡는다. 주 메뉴의 항목을 누르면 이동하고 닫는 것은
 *     Side Navigation 의 onNavigate 로 쓰는 쪽이 한다.
 *
 * 열면 초점은 패널(컨테이너)로 가고 열린 동안 패널 안을 돈다. 닫으면 연 자리(트리거, 없으면 열 때 초점이 있던 곳 — ☰)로 돌아간다 —
 * 닫히는 동안 다른 곳(새 화면의 제목)으로 초점을 옮겼으면 그대로 둔다. 뒤 화면은 보조 기술에서 숨기고 스크롤을 잠근다(Radix).
 * role="dialog" + aria-modal, 제목 aria-labelledby(h2) · 설명 aria-describedby(있을 때만).
 *
 * 모양: 화면 높이 전체(dvh), 붙은 쪽 끝 — 모서리 · 그림자 · 선 없이 딤(overlay-dim 라이트 0.50 · 다크 0.65)과 표면 색(bg-layer-floating)으로
 *   뜬다. 폭은 왼쪽 80% · 오른쪽 480 · 720 · 960(화면의 80% 를 넘지 않는다 — 딤이 늘 20% 남는다). 붙은 쪽 안전 영역(가로 노치)은 폭에
 *   더하고(SEED 문서), 패널 내용 맨 아래에 아래 안전 영역을 둔다(바닥이 없어도).
 *   머리 위 24(+ 위 안전 영역) · 좌우 24 · 아래 16 · 최소 70 · 사이 6, 제목 t8 22 / 30 · 700 · 설명 t5 fg-neutral-muted. 닫기 버튼이 있으면
 *   머리 오른쪽 52. 닫기 버튼은 52 투명 상자 · 아이콘 22 fg-neutral-subtle — 아이콘이 위 28 · 오른쪽 24. 누르면 bg-layer-floating-pressed +
 *   2px 거리 축소(52 → 0.962), 호버는 누름 색, 키보드 포커스에 2px 링(띄움 2). 이름 "닫기".
 *   본문 좌우 24(왼쪽 패널 — 주 메뉴는 16: Side Navigation 의 항목 좌우 8 이 들어와 아이콘이 제목과 같은 24 에 선다), 맨 끝이면 아래 24.
 *   넘쳐 스크롤할 수 있는 본문은 키보드로도 스크롤하도록 Tab 이 선다(안쪽 링). 바닥 위 16 · 좌우 24 · 아래 24.
 * [sso-front 판 — 레시피에서 손으로 고친 자리: `container`(띄울 자리, 기본 document.body) · `modal`(기본 켬)을 더했다. Desk 판 Dialog 와
 *  같은 까닭이다 — 카탈로그(/dev/ds)가 패널을 무대 안에 열어 ds:check 가 잰다. SOURCE.md 4]
 * 쌓임: 딤 z-modal 100 · 패널 z-modal-content 101(specs/z-index.md L2) — 그 안에서 연 Popover · Select 목록(L3) · Alert Dialog(L5)가 위에 뜬다.
 * 모션: 300ms enter-expressive 로 붙은 쪽에서 미끄러져 들어오고(딤 300ms enter) 300ms exit-expressive 로 나간다(딤 300ms exit).
 *   모션 줄이기면 150ms 서서히 나타나고 사라진다(미끄러지지 않는다).
 */

type OpenChange = (open: boolean) => void;
type Side = "left" | "right";

// 끌기(side-panel.md Behavior — Bottom Sheet 와 같은 기준)
const DRAG_START = 10;
const CLOSE_RATIO = 0.25;
const CLOSE_VELOCITY = 0.4;

// ── 작은 도구 ─────────────────────────────────────────────────
function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

function useOpenState(prop: boolean | undefined, defaultOpen: boolean | undefined, onChange: OpenChange | undefined) {
  const [inner, setInner] = React.useState(defaultOpen ?? false);
  const controlled = prop !== undefined;
  const onChangeRef = React.useRef(onChange);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  });
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!controlled) setInner(next);
      onChangeRef.current?.(next);
    },
    [controlled],
  );
  return [controlled ? prop : inner, setOpen] as const;
}

// 바닥 버튼의 크기 — 크기를 주지 않은 바로 아래 자식(컴포넌트)에만 넣는다. Fragment 는 펼친다
function withButtonSize(children: React.ReactNode, size: "small"): React.ReactNode {
  return React.Children.map(children, (child) => {
    if (!React.isValidElement<{ size?: unknown; children?: React.ReactNode }>(child)) return child;
    if (child.type === React.Fragment) return withButtonSize(child.props.children, size);
    if (typeof child.type === "string" || child.props.size !== undefined) return child;
    return React.cloneElement(child, { size });
  });
}

// 본문의 스크롤 상태 — 위로 스크롤됨(data-scrolled, 머리 아래 선)과 넘침(Tab 이 서는지). Dialog 와 같다
function useBodyScroll(ref: React.RefObject<HTMLElement | null>) {
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      el.toggleAttribute("data-scrolled", el.scrollTop > 0);
      if (el.scrollHeight > el.clientHeight + 1) el.tabIndex = 0;
      else el.removeAttribute("tabindex");
    };
    const resize = new ResizeObserver(measure);
    const observeChildren = () => {
      resize.observe(el);
      for (const child of Array.from(el.children)) resize.observe(child);
    };
    const mutation = new MutationObserver(() => {
      observeChildren();
      measure();
    });
    observeChildren();
    mutation.observe(el, { childList: true });
    el.addEventListener("scroll", measure, { passive: true });
    measure();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [ref]);
}

// ── 패널 문맥 ─────────────────────────────────────────────────
type PanelContextValue = {
  form: boolean;
  /** 저장 중 — 끌기 · 본문 입력을 받지 않는다 */
  busy: boolean;
  /** 닫기를 청한다 — 바로 닫았으면 true, 바뀐 값이 있어 물었으면 false */
  requestClose: () => boolean;
  setSide: (side: Side) => void;
  contentRef: React.RefObject<HTMLDivElement | null>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  container: HTMLElement | null | undefined;
  modal: boolean;
};
const PanelContext = React.createContext<PanelContextValue | null>(null);

function usePanel(name: string) {
  const ctx = React.useContext(PanelContext);
  if (!ctx) throw new Error(`${name} 는 SidePanel 안에 둔다.`);
  return ctx;
}

const SideContext = React.createContext<Side>("right");

export interface SidePanelProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: OpenChange;
  /** 입력 폼 — 바깥(딤) 누르기 · 끌기로 닫지 않고 머리 닫기 버튼을 두지 않는다(바닥 [취소] [저장]) */
  form?: boolean;
  /** 바뀐 값이 있다 — 닫기 전에 "작성한 내용이 사라져요" 를 묻는다 */
  dirty?: boolean;
  /**
   * 저장하는 중이다(저장 단추가 로딩) — Esc · 바깥 · 닫기 · 끌기 · 뒤로 가기를 받지 않고 본문은 입력을 받지 않는다(Bottom Sheet 의 busy 와 같다).
   * 뒤로 가기는 칸을 다시 쌓아 다음 뒤로 가기도 이 패널로 온다
   */
  busy?: boolean;
  /** 띄울 자리 — 기본 document.body. 카탈로그가 무대 안에 연다 */
  container?: HTMLElement | null;
  /** false 면 초점 가둠 · 바깥 비활성 · 뒤 화면 숨김 · 스크롤 잠금을 끈다(카탈로그 · 문서 전용). 기본 켬 */
  modal?: boolean;
  children?: React.ReactNode;
}

// 왼쪽 패널(주 메뉴)이 닫히는 폭 — 사이드바가 보이기 시작하는 breakpoint-md
const SIDEBAR_QUERY = "(min-width: 768px)";

function SidePanel({ open: openProp, defaultOpen, onOpenChange, form = false, dirty = false, busy = false, container, modal = true, children }: SidePanelProps) {
  const [open, setOpen] = useOpenState(openProp, defaultOpen, onOpenChange);
  const narrow = useInputButtonSurface() === "sheet";
  const contentRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [side, setSide] = React.useState<Side>("right");
  // busy 면 request() 가 닫지도 묻지도 않고 false 를 돌려준다 — Esc · 닫기 · 딤 · 뒤로 가기가 모두 이 한 자리를 지난다
  const leave = useLeaveConfirm({ dirty, contentRef, busy, leave: () => setOpen(false) });
  useRefocusAfterBusy(busy, contentRef);
  // 뒤로 가기(1280 미만) — 바뀐 값이 있어 물었거나 저장 중이면 칸을 다시 쌓는다
  // (Desk 판 useBackClose 는 칸을 다시 쌓는 함수를 콜백 인자로 준다 — SOURCE.md 손으로 고친 자리 5)
  useBackClose(open && narrow, (keep) => {
    if (!leave.request()) keep();
  });
  // 주 메뉴(왼쪽)는 창이 768 이상으로 넓어지면 닫힌다
  React.useEffect(() => {
    if (!open || side !== "left") return;
    const mql = window.matchMedia(SIDEBAR_QUERY);
    const check = () => {
      if (mql.matches) setOpen(false);
    };
    check();
    mql.addEventListener("change", check);
    return () => mql.removeEventListener("change", check);
  }, [open, side, setOpen]);
  const value = React.useMemo<PanelContextValue>(
    () => ({ form, busy, requestClose: leave.request, setSide, contentRef, triggerRef, container, modal }),
    [form, busy, leave.request, container, modal],
  );
  return (
    <PanelContext.Provider value={value}>
      {/* Radix 가 닫으려 할 때(Esc · 바깥 · 닫기) — 바뀐 값이 있으면 묻는다 */}
      <DialogPrimitive.Root modal={modal} open={open} onOpenChange={(next) => (next ? setOpen(true) : leave.request())}>
        {children}
      </DialogPrimitive.Root>
      {leave.node}
    </PanelContext.Provider>
  );
}
SidePanel.displayName = "SidePanel";

const SidePanelTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>
>((props, ref) => {
  const ctx = usePanel("SidePanelTrigger");
  return <DialogPrimitive.Trigger ref={mergeRefs(ref, ctx.triggerRef)} data-slot="side-panel-trigger" {...props} />;
});
SidePanelTrigger.displayName = "SidePanelTrigger";

// ── 모양 ─────────────────────────────────────────────────────
// 딤 — 300ms enter 로 나타나고 300ms exit 로 사라진다(모션 줄이기면 150ms)
const OVERLAY = [
  "fixed inset-0 z-(--z-modal) bg-[var(--overlay-dim-light)] dark:bg-[var(--overlay-dim-dark)]",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:[--tw-animation-duration:var(--motion-duration-d6)] data-[state=open]:ease-[var(--motion-ease-enter)]",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:[--tw-animation-duration:var(--motion-duration-d6)] data-[state=closed]:ease-[var(--motion-ease-exit)]",
  "motion-reduce:data-[state]:[--tw-animation-duration:var(--motion-duration-d3)]",
].join(" ");

// 패널 — 높이 전체, 모서리 · 그림자 · 선 없음, 아래 안전 영역. 가로 손가락 끌기를 받도록 세로 스크롤 · 확대만 브라우저에 맡긴다
const CONTENT = [
  "fixed inset-y-0 z-(--z-modal-content) flex h-dvh max-h-dvh flex-col bg-bg-layer-floating pb-[env(safe-area-inset-bottom)] font-sans text-fg-neutral outline-none",
  "[touch-action:pan-y_pinch-zoom]",
  "data-[state=open]:animate-in data-[state=closed]:animate-out",
  "data-[state=open]:[--tw-animation-duration:var(--motion-duration-d6)] data-[state=open]:ease-[var(--motion-ease-enter-expressive)]",
  "data-[state=closed]:[--tw-animation-duration:var(--motion-duration-d6)] data-[state=closed]:ease-[var(--motion-ease-exit-expressive)]",
  // 모션 줄이기 — 미끄러지지 않고 150ms 서서히
  "motion-reduce:data-[state=open]:fade-in-0 motion-reduce:data-[state=closed]:fade-out-0 motion-reduce:data-[state]:[--tw-animation-duration:var(--motion-duration-d3)] motion-reduce:data-[state]:ease-[var(--motion-ease-enter)]",
].join(" ");

// 붙은 쪽 — 폭에 그쪽 안전 영역을 더하고 그만큼 안쪽 여백을 둔다. 왼쪽은 화면 폭의 80%
const SIDE: Record<Side, string> = {
  left: [
    "left-0 w-[calc(80%+env(safe-area-inset-left))] pl-[env(safe-area-inset-left)]",
    "motion-safe:data-[state=open]:slide-in-from-left motion-safe:data-[state=closed]:slide-out-to-left",
  ].join(" "),
  right: [
    "right-0 max-w-[calc(80%+env(safe-area-inset-right))] pr-[env(safe-area-inset-right)] max-md:w-[calc(80%+env(safe-area-inset-right))]",
    "motion-safe:data-[state=open]:slide-in-from-right motion-safe:data-[state=closed]:slide-out-to-right",
  ].join(" "),
};

// 오른쪽 패널의 폭 — 1280 이상의 보조 작업. 화면의 80% 를 넘지 않는다
const SIZE = {
  small: "w-[calc(480px+env(safe-area-inset-right))]",
  medium: "w-[calc(720px+env(safe-area-inset-right))]",
  large: "w-[calc(960px+env(safe-area-inset-right))]",
} as const;

// 머리 — 위 24(+ 위 안전 영역) · 좌우 24 · 아래 16 · 최소 70 · 사이 6. 본문이 위로 스크롤되면 안쪽 아래 1px stroke-neutral-subtle(150ms) —
// 본문이 흐림 마스크를 걸어도 선이 흐려지지 않게 머리에 그린다
const HEADER = [
  "flex min-h-[calc(70px+env(safe-area-inset-top))] shrink-0 flex-col gap-x1_5 px-x6 pb-x4 pt-[calc(var(--spacing-x6)+env(safe-area-inset-top))]",
  "[transition:box-shadow_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
  "[&:has(~[data-slot=side-panel-body][data-scrolled])]:shadow-[inset_0_-1px_0_0_var(--color-stroke-neutral-subtle)]",
].join(" ");

// 닫기 — 52 투명 상자 · 아이콘 22 fg-neutral-subtle. 아이콘이 위 28 · 오른쪽 24 에 오도록 상자를 (52 − 22) ÷ 2 = 15 만큼 당긴다.
// 누르면 bg-layer-floating-pressed + 2px 거리 축소(기준 52 → 0.962)
const CLOSE = [
  "absolute top-[calc(var(--spacing-x7)-15px+env(safe-area-inset-top))] flex size-13 cursor-pointer items-center justify-center",
  "rounded-r3 border-0 bg-transparent p-0 text-fg-neutral-subtle [&>svg]:size-[22px]",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing),scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  "hover:bg-bg-layer-floating-pressed active:bg-bg-layer-floating-pressed active:[scale:calc(1-2/52)] motion-reduce:active:[scale:1]",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stroke-focus-ring",
].join(" ");
const CLOSE_SIDE: Record<Side, string> = {
  left: "right-[calc(var(--spacing-x6)-15px)]",
  right: "right-[calc(var(--spacing-x6)-15px+env(safe-area-inset-right))]",
};

export interface SidePanelContentProps extends Omit<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>, "title"> {
  /** 제목 — 무엇을 하는 패널인지. 주 메뉴 서랍은 서비스 이름("그루 이음") */
  title: React.ReactNode;
  /** 설명 — 덧붙일 말이 있을 때만 한 문장 */
  description?: React.ReactNode;
  /** left — 768 미만의 주 메뉴 서랍 · right(기본) — 1280 이상의 보조 작업 */
  side?: Side;
  /** 오른쪽 패널의 폭 — small 480 · medium 720(기본) · large 960 */
  size?: keyof typeof SIZE;
  /** 머리 닫기 버튼(기본 켬) — form 이면 그리지 않는다(바닥 [취소]) */
  showCloseButton?: boolean;
}

// 닫힌 뒤 초점 — 닫히는 동안 다른 곳(새 화면의 제목)으로 옮겼으면 그대로, 아니면 연 자리(트리거, 없으면 열 때 초점이 있던 곳)로
function focusOpener(panel: HTMLElement | null, trigger: HTMLElement | null, opener: Element | null) {
  const doc = panel?.ownerDocument ?? document;
  const active = doc.activeElement;
  if (active && active !== doc.body && !panel?.contains(active)) return;
  const target =
    trigger?.isConnected ? trigger : opener instanceof HTMLElement && opener.isConnected && opener !== doc.body ? opener : null;
  target?.focus({ preventScroll: true });
}

const SidePanelContent = React.forwardRef<React.ElementRef<typeof DialogPrimitive.Content>, SidePanelContentProps>(
  (
    {
      title,
      description,
      side = "right",
      size = "medium",
      showCloseButton = true,
      className,
      style,
      children,
      onOpenAutoFocus,
      onCloseAutoFocus,
      onInteractOutside,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      ...props
    },
    ref,
  ) => {
    const ctx = usePanel("SidePanelContent");
    const { setSide } = ctx;
    React.useLayoutEffect(() => setSide(side), [setSide, side]);
    const openerRef = React.useRef<Element | null>(null);
    const overlayRef = React.useRef<HTMLDivElement>(null);
    const showClose = showCloseButton && !ctx.form;

    // ── 끌기(손가락 · 펜) ──
    const dragRef = React.useRef<{ id: number; x: number; y: number; t: number; axis: "x" | "y" | null; dx: number; width: number } | null>(null);
    const resetDrag = (animate: boolean) => {
      const panel = ctx.contentRef.current;
      const overlay = overlayRef.current;
      if (!panel) return;
      if (!animate) {
        panel.style.removeProperty("transition");
        panel.style.removeProperty("transform");
        overlay?.style.removeProperty("transition");
        overlay?.style.removeProperty("opacity");
        return;
      }
      // 제자리로 — 닫힘과 같은 300ms exit-expressive, 다 돌아오면 인라인 값을 지운다
      const move = "var(--motion-duration-d6) var(--motion-ease-exit-expressive)";
      panel.style.setProperty("transition", `transform ${move}`);
      panel.style.setProperty("transform", "translateX(0px)");
      if (overlay) {
        overlay.style.setProperty("transition", `opacity ${move}`);
        overlay.style.setProperty("opacity", "1");
      }
      const done = () => {
        panel.removeEventListener("transitionend", done);
        if (dragRef.current) return;
        resetDrag(false);
      };
      panel.addEventListener("transitionend", done);
      window.setTimeout(done, 400);
    };
    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || e.pointerId !== drag.id) return;
      dragRef.current = null;
      if (drag.axis !== "x") return;
      const velocity = Math.abs(drag.dx) / Math.max(e.timeStamp - drag.t, 1);
      if (e.type === "pointerup" && (Math.abs(drag.dx) >= drag.width * CLOSE_RATIO || velocity > CLOSE_VELOCITY) && drag.dx !== 0) {
        // 닫는다 — 끈 자리에서 나간다(바뀐 값이 있어 물었으면 제자리로)
        if (ctx.requestClose()) return;
      }
      resetDrag(true);
    };

    return (
      <SideContext.Provider value={side}>
        <DialogPrimitive.Portal container={ctx.container}>
          {ctx.modal ? (
            <DialogPrimitive.Overlay ref={overlayRef} data-slot="side-panel-overlay" className={OVERLAY} />
          ) : (
            <div ref={overlayRef} data-slot="side-panel-overlay" data-state="open" className={OVERLAY} />
          )}
          <DialogPrimitive.Content
            ref={mergeRefs(ref, ctx.contentRef)}
            data-slot="side-panel-content"
            data-side={side}
            data-size={side === "right" ? size : undefined}
            data-form={ctx.form || undefined}
            aria-modal="true"
            aria-busy={ctx.busy || undefined}
            {...(description == null ? { "aria-describedby": undefined } : null)}
            className={cn(CONTENT, SIDE[side], side === "right" && SIZE[size], className)}
            style={style}
            // 처음 초점은 패널 — Radix 기본(첫 칸)을 쓰지 않는다
            onOpenAutoFocus={(e) => {
              openerRef.current = document.activeElement;
              onOpenAutoFocus?.(e);
              if (e.defaultPrevented) return;
              e.preventDefault();
              ctx.contentRef.current?.focus({ preventScroll: true });
            }}
            onCloseAutoFocus={(e) => {
              onCloseAutoFocus?.(e);
              if (e.defaultPrevented) return;
              e.preventDefault();
              focusOpener(ctx.contentRef.current, ctx.triggerRef.current, openerRef.current);
            }}
            // 입력 폼은 바깥(딤)을 눌러도 닫히지 않는다
            onInteractOutside={(e) => {
              onInteractOutside?.(e);
              if (ctx.form) e.preventDefault();
            }}
            onPointerDown={(e) => {
              onPointerDown?.(e);
              if (ctx.form || ctx.busy || e.pointerType === "mouse" || e.button !== 0 || e.defaultPrevented) return;
              dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, axis: null, dx: 0, width: e.currentTarget.getBoundingClientRect().width };
            }}
            onPointerMove={(e) => {
              onPointerMove?.(e);
              const drag = dragRef.current;
              if (!drag || e.pointerId !== drag.id) return;
              const mx = e.clientX - drag.x;
              const my = e.clientY - drag.y;
              if (drag.axis === null) {
                if (Math.abs(mx) < DRAG_START && Math.abs(my) < DRAG_START) return;
                drag.axis = Math.abs(mx) > Math.abs(my) ? "x" : "y";
                if (drag.axis === "x") {
                  try {
                    e.currentTarget.setPointerCapture(e.pointerId);
                  } catch {
                    // 합성 포인터 · 이미 놓은 포인터 — 잡지 못해도 끌기는 이어진다
                  }
                }
              }
              if (drag.axis !== "x") return;
              // 붙은 쪽으로만 — 왼쪽 패널은 왼쪽(음수), 오른쪽 패널은 오른쪽(양수)
              const dx = side === "left" ? Math.min(mx, 0) : Math.max(mx, 0);
              drag.dx = dx;
              const panel = e.currentTarget;
              panel.style.transition = "none";
              panel.style.transform = `translateX(${dx}px)`;
              const overlay = overlayRef.current;
              if (overlay) {
                overlay.style.transition = "none";
                overlay.style.opacity = String(Math.max(1 - Math.abs(dx) / drag.width, 0));
              }
            }}
            onPointerUp={(e) => {
              onPointerUp?.(e);
              endDrag(e);
            }}
            onPointerCancel={(e) => {
              onPointerCancel?.(e);
              endDrag(e);
            }}
            {...props}
          >
            <div data-slot="side-panel-header" className={cn(HEADER, showClose && "pr-x13")}>
              <DialogPrimitive.Title data-slot="side-panel-title" className="m-0 text-t8 font-bold text-fg-neutral">
                {title}
              </DialogPrimitive.Title>
              {description != null && (
                <DialogPrimitive.Description data-slot="side-panel-description" className="m-0 text-t5 font-normal text-fg-neutral-muted">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            {showClose && (
              <DialogPrimitive.Close aria-label="닫기" data-slot="side-panel-close" className={cn(CLOSE, CLOSE_SIDE[side])}>
                <X aria-hidden strokeWidth={2} />
              </DialogPrimitive.Close>
            )}
            {children}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </SideContext.Provider>
    );
  },
);
SidePanelContent.displayName = "SidePanelContent";

// 본문 — 좌우 24(왼쪽 패널 16), 이 안에서만 스크롤. 맨 끝 자식(바닥이 없으면)이면 아래 24. 손가락 가로 끌기는 패널이 받는다.
// 끝에 닿아도 뒤 화면이 따라 스크롤되지 않는다(overscroll-behavior: contain — Scroll Area 의 옆 패널, 2026-10-10)
const BODY = [
  "min-h-0 flex-1 overflow-y-auto overscroll-contain [touch-action:pan-y_pinch-zoom]",
  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-stroke-focus-ring",
].join(" ");
const BODY_SIDE: Record<Side, string> = { left: "px-x4", right: "px-x6" };
const BODY_PLAIN = "last:pb-x6";
// 끝 흐림(scrollFog) — 본문 안 여백 위 20 · 아래 80(바닥이 있어도), 스크롤 여유도 위 20 · 아래 80
const BODY_FOG = "pt-[20px] pb-[80px] scroll-pt-[20px] scroll-pb-[80px]";

export interface SidePanelBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 끝 흐림(Scroll Fog overlayBody — 위 20 · 아래 80, 늘 켜짐) — 넘칠 수 있는 본문(주 메뉴 · 목록 · 긴 폼)에만 */
  scrollFog?: boolean;
}

const SidePanelBody = React.forwardRef<HTMLDivElement, SidePanelBodyProps>(({ scrollFog = false, className, ...props }, ref) => {
  const side = React.useContext(SideContext);
  const busy = React.useContext(PanelContext)?.busy ?? false;
  const own = React.useRef<HTMLDivElement>(null);
  useBodyScroll(own);
  useScrollFog(own, scrollFog ? "overlayBody" : null);
  return (
    <div
      ref={mergeRefs(ref, own)}
      // 저장 중 — 본문은 입력을 받지 않는다(모양은 그대로)
      inert={busy || undefined}
      data-slot="side-panel-body"
      data-scroll-fog={scrollFog ? "overlayBody" : undefined}
      className={cn(BODY, BODY_SIDE[side], scrollFog ? BODY_FOG : BODY_PLAIN, className)}
      {...props}
    />
  );
});
SidePanelBody.displayName = "SidePanelBody";

// 바닥 — 위 16 · 좌우 24 · 아래 24, 오른쪽 정렬 [취소] [저장], 사이 8. Button small 36
const SidePanelFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} data-slot="side-panel-footer" className={cn("flex shrink-0 items-center justify-end gap-x2 px-x6 pb-x6 pt-x4", className)} {...props}>
    {withButtonSize(children, "small")}
  </div>
));
SidePanelFooter.displayName = "SidePanelFooter";

export { SidePanel, SidePanelTrigger, SidePanelContent, SidePanelBody, SidePanelFooter };
