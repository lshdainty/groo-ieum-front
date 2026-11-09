import * as React from "react";

import { cn } from "@/shared/lib/cn";

/*
 * Groo Resizable — HR 관리 화면 나누기 · 대시보드 위젯 크기(2026-10-10). 수치 원본은 specs/components/resizable.yaml.
 * SEED 에는 Resizable 이 없다(모바일 앱 중심) — 손잡이 · 범위 · 키보드 · 기억 · 위젯 크기는 groo 가 정했고, 키보드는 APG Window Splitter 다.
 * 옛 shadcn 그대로(react-resizable-panels · 가로 · 세로 · 손잡이 상자 12 × 16 · 누르는 폭 4 · 10%)를 대신한다 — 라이브러리 없이 짰다.
 *
 *   ResizablePanelGroup   나눈 자리 — storageKey(화면마다 폭을 기억할 이름 — 필수), 가로로만 나눈다. 768 이상에서만 쓴다
 *                         (768 미만은 화면이 목록 → 상세 · 탭으로 바꾼다). 나머지는 div 속성
 *   ResizablePanel        패널 — 첫째가 목록 패널: defaultSize(기본 25) · minSize(20) · maxSize(40) · id(손잡이의 aria-controls).
 *                         둘째(오른쪽 상세)는 크기를 적지 않는다 — 남는 폭이다. 패널은 나눈 자리의 바로 아래 자식으로 둔다
 *   ResizableHandle       손잡이 — label(이름 — 필수, "목록 너비") · toggleSize(누르기 · Enter 로 오가는 넓은 폭 — 기본 40)
 *   WidgetResizeHandle    위젯 모서리 손잡이 — 대시보드 격자(react-grid-layout)의 resizeHandle 로 넘긴다(<WidgetResizeHandle />).
 *                         누르는 24 × 24 · 표식 9 × 9 꺾쇠 2px stroke-neutral-solid, 보조 기술에는 숨긴다(끌지 않는 대안은 위젯 ⋮ 의 "크기" — Menu).
 *                         끄는 동안 자리표시 · 따라오는 위젯의 모양은 styles/groo-shadcn-bridge.css 가 이 스펙 값으로 덮는다
 *
 * 손잡이 — 선 1px stroke-neutral-weak(경계일 뿐) + 가운데 손잡이 표시 4 × 24 stroke-neutral-solid(대비 3 이상 — 끌 수 있는 자리를 알린다).
 *   마우스를 올리거나 키보드 초점 · 누르는 동안 선 전체가 stroke-neutral-solid 로 짙어진다(150ms). 누르는 폭은 선 가운데로 양쪽 8 — 16
 *   (768 이상 데스크톱의 마우스 경계라 44 가 아니다, 사용자 결정 12B). 키보드 포커스에만 누르는 폭 16 둘레에 링 2px(모서리 4).
 *   role="separator" · aria-orientation="vertical" · aria-valuenow(목록 %) · aria-valuemin · aria-valuemax · aria-valuetext("25%") · aria-controls(목록 패널).
 * 바꾸는 길 — 끌기: 누른 채 3px 넘게 움직이면 끈다, 포인터를 1:1 로 따라 20 ~ 40% 사이(오른쪽은 60% 아래로 줄지 않는다). 끄는 동안 화면 전체가
 *   col-resize 커서이고 글을 고르지 않는다. 누르기: 3px 안에서 놓으면 기본 25 ↔ 넓게 40(끌지 못하는 사람의 대안 — WCAG 2.5.7) —
 *   기본 폭이면 넓게, 그 밖이면 기본으로. 키보드: ← → 5%(끝에서 멈춘다) · Home 20 · End 40 · Enter 25 ↔ 40.
 *   폭이 바뀌는 모션은 없다(끄는 동안 1:1, 키보드 · 누르기는 바로).
 * 기억 — 끌기를 놓거나 누르기 · 키보드로 바꾼 폭을 화면마다 브라우저에 남긴다(localStorage "porest:resizable:{storageKey}") — 다시 열면 그 폭,
 *   없으면 기본 25. 저장소를 쓰지 못하는 브라우저는 기억 없이 쓴다.
 */

const STORAGE_PREFIX = "porest:resizable:";
// ← → 한 번에 5%(APG Window Splitter — Shift + 화살표는 두지 않는다)
const STEP = 5;
// 누른 채 이만큼 넘게 움직이면 끌기 — 그 안에서 놓으면 누르기
const DRAG_START_PX = 3;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function readStored(key: string): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    const n = raw == null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}
function writeStored(key: string, size: number) {
  try {
    window.localStorage.setItem(STORAGE_PREFIX + key, String(Math.round(size * 100) / 100));
  } catch {
    // 저장소를 쓰지 못하는 브라우저 — 기억 없이 쓴다
  }
}

type GroupContextValue = {
  size: number;
  min: number;
  max: number;
  defaultSize: number;
  listId: string;
  groupRef: React.RefObject<HTMLDivElement | null>;
  /** 폭을 바꾼다 — persist 면 기억한다 */
  setSize: (size: number, persist: boolean) => void;
};
const GroupContext = React.createContext<GroupContextValue | null>(null);
// 패널의 자리 — 첫째는 목록(폭이 바뀐다), 그다음은 남는 폭
const PanelRoleContext = React.createContext<"list" | "fill">("fill");

export interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 목록 패널의 기본 폭 % — 기본 25 */
  defaultSize?: number;
  /** 목록 패널의 최소 % — 기본 20 */
  minSize?: number;
  /** 목록 패널의 최대 % — 기본 40(오른쪽이 60% 아래로 줄지 않는다) */
  maxSize?: number;
}

// 자식을 펼친다 — 배열 · Fragment 를 풀어 패널을 찾는다(키는 toArray 가 붙이고, Fragment 안의 키 앞에는 Fragment 의 키를 붙인다)
function flatten(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(child) || child.type !== React.Fragment) return [child];
    return flatten(child.props.children).map((c) => (React.isValidElement(c) ? React.cloneElement(c, { key: `${child.key}${c.key}` }) : c));
  });
}

export interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 화면마다 폭을 기억할 이름 — "hr-admin-company" */
  storageKey: string;
}

const ResizablePanelGroup = React.forwardRef<HTMLDivElement, ResizablePanelGroupProps>(({ storageKey, className, children, ...props }, ref) => {
  const items = flatten(children);
  const isPanel = (c: React.ReactNode): c is React.ReactElement<ResizablePanelProps> => React.isValidElement(c) && c.type === ResizablePanel;
  const list = items.find(isPanel)?.props ?? {};
  const defaultSize = list.defaultSize ?? 25;
  const min = list.minSize ?? 20;
  const max = list.maxSize ?? 40;
  const autoId = React.useId();
  const listId = list.id ?? `${autoId}list`;
  const [stored, setStored] = React.useState<number>(() => (typeof window === "undefined" ? defaultSize : (readStored(storageKey) ?? defaultSize)));
  // 다른 화면 이름이 오면 그 화면이 기억한 폭으로
  const lastKey = React.useRef(storageKey);
  React.useEffect(() => {
    if (lastKey.current === storageKey) return;
    lastKey.current = storageKey;
    setStored(readStored(storageKey) ?? defaultSize);
  }, [storageKey, defaultSize]);
  const size = clamp(stored, min, max);
  const groupRef = React.useRef<HTMLDivElement | null>(null);
  const setSize = React.useCallback(
    (next: number, persist: boolean) => {
      const v = clamp(next, min, max);
      setStored(v);
      if (persist) writeStored(storageKey, v);
    },
    [min, max, storageKey],
  );
  const ctx = React.useMemo(() => ({ size, min, max, defaultSize, listId, groupRef, setSize }), [size, min, max, defaultSize, listId, setSize]);
  let panelIndex = 0;
  return (
    <GroupContext.Provider value={ctx}>
      <div
        ref={(node) => {
          groupRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        data-slot="resizable-panel-group"
        className={cn("flex h-full w-full", className)}
        {...props}
      >
        {items.map((child, i) =>
          isPanel(child) ? (
            <PanelRoleContext.Provider key={child.key ?? `panel-${i}`} value={panelIndex++ === 0 ? "list" : "fill"}>
              {child}
            </PanelRoleContext.Provider>
          ) : (
            child
          ),
        )}
      </div>
    </GroupContext.Provider>
  );
});
ResizablePanelGroup.displayName = "ResizablePanelGroup";

const ResizablePanel = React.forwardRef<HTMLDivElement, ResizablePanelProps>(
  ({ defaultSize: _defaultSize, minSize: _minSize, maxSize: _maxSize, id, className, style, ...props }, ref) => {
    const role = React.useContext(PanelRoleContext);
    const group = React.useContext(GroupContext);
    if (role === "list" && group) {
      return (
        <div
          ref={ref}
          id={group.listId}
          data-slot="resizable-panel"
          data-panel="list"
          className={cn("min-w-0 shrink-0 grow-0 overflow-hidden", className)}
          style={{ ...style, flexBasis: `${group.size}%` }}
          {...props}
        />
      );
    }
    return <div ref={ref} id={id} data-slot="resizable-panel" data-panel="fill" className={cn("min-w-0 flex-1 overflow-hidden", className)} style={style} {...props} />;
  },
);
ResizablePanel.displayName = "ResizablePanel";

export interface ResizableHandleProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** 손잡이의 이름 — 바뀌는 것을 말한다("목록 너비") */
  label: string;
  /** 누르기 · Enter 로 오가는 넓은 폭 % — 기본 40 */
  toggleSize?: number;
}

// 선 1px — 올리거나(마우스) 키보드 초점 · 누르는 동안 손잡이 표시와 같은 색
const LINE = [
  "group/resizable-handle relative z-[1] w-px shrink-0 self-stretch bg-stroke-neutral-weak",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
  "[@media(hover:hover)]:hover:bg-stroke-neutral-solid has-[:focus-visible]:bg-stroke-neutral-solid data-[active]:bg-stroke-neutral-solid",
].join(" ");
// 누르는 폭 16 — 선 가운데로 양쪽 8. 키보드 포커스에만 둘레 링 2px · 모서리 4
const SEPARATOR = [
  "absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 cursor-col-resize touch-none rounded-r1",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-stroke-focus-ring",
].join(" ");
// 손잡이 표시 4 × 24 — 선 가운데(패널 높이의 가운데)
const GRIP = "pointer-events-none absolute left-1/2 top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 rounded-r0_5 bg-stroke-neutral-solid";

type Press = { pointerId: number; startX: number; startSize: number; dragging: boolean; last: number; restore: (() => void) | null };

const ResizableHandle = React.forwardRef<HTMLDivElement, ResizableHandleProps>(
  ({ label, toggleSize = 40, className, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onKeyDown, ...props }, ref) => {
    const group = React.useContext(GroupContext);
    const press = React.useRef<Press | null>(null);
    const [active, setActive] = React.useState(false);
    React.useEffect(() => () => press.current?.restore?.(), []);
    if (!group) throw new Error("[Resizable] ResizableHandle 은 ResizablePanelGroup 안에 둔다.");
    const { size, min, max, defaultSize, listId, groupRef, setSize } = group;
    // 기본 폭이면 넓게, 그 밖이면 기본으로(25 ↔ 40)
    const toggle = () => setSize(Math.abs(size - defaultSize) < 0.5 ? toggleSize : defaultSize, true);
    const end = (commit: boolean) => {
      const p = press.current;
      if (!p) return;
      press.current = null;
      setActive(false);
      p.restore?.();
      if (!commit) return;
      // 끌었으면 마지막 폭을 기억한다(그 뒤 다시 그려지기 전에 놓아도 같은 폭)
      if (p.dragging) setSize(p.last, true);
      else toggle();
    };
    return (
      <div ref={ref} data-slot="resizable-handle" data-active={active ? "" : undefined} className={cn(LINE, className)} {...props}>
        <div
          role="separator"
          tabIndex={0}
          aria-label={label}
          aria-orientation="vertical"
          aria-valuenow={Math.round(size)}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={`${Math.round(size)}%`}
          aria-controls={listId}
          data-slot="resizable-separator"
          className={SEPARATOR}
          onPointerDown={(e) => {
            onPointerDown?.(e);
            if (e.defaultPrevented || e.button !== 0) return;
            e.currentTarget.setPointerCapture?.(e.pointerId);
            press.current = { pointerId: e.pointerId, startX: e.clientX, startSize: size, dragging: false, last: size, restore: null };
            setActive(true);
          }}
          onPointerMove={(e) => {
            onPointerMove?.(e);
            const p = press.current;
            if (!p || p.pointerId !== e.pointerId) return;
            const dx = e.clientX - p.startX;
            if (!p.dragging) {
              if (Math.abs(dx) <= DRAG_START_PX) return;
              p.dragging = true;
              // 끄는 동안 화면 전체 — col-resize 커서 · 글을 고르지 않는다
              const root = document.documentElement;
              const prev = { cursor: root.style.cursor, userSelect: root.style.userSelect };
              root.style.cursor = "col-resize";
              root.style.userSelect = "none";
              p.restore = () => {
                root.style.cursor = prev.cursor;
                root.style.userSelect = prev.userSelect;
              };
            }
            const width = groupRef.current?.getBoundingClientRect().width ?? 0;
            if (width <= 0) return;
            p.last = clamp(p.startSize + (dx / width) * 100, min, max);
            setSize(p.last, false);
          }}
          onPointerUp={(e) => {
            onPointerUp?.(e);
            if (press.current?.pointerId === e.pointerId) end(true);
          }}
          onPointerCancel={(e) => {
            onPointerCancel?.(e);
            // 끌던 폭은 남기고, 누르기는 하지 않는다
            const p = press.current;
            if (p?.pointerId !== e.pointerId) return;
            if (p.dragging) end(true);
            else end(false);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
            let next: number | null = null;
            if (e.key === "ArrowLeft") next = size - STEP;
            else if (e.key === "ArrowRight") next = size + STEP;
            else if (e.key === "Home") next = min;
            else if (e.key === "End") next = max;
            else if (e.key === "Enter") {
              e.preventDefault();
              toggle();
              return;
            }
            if (next == null) return;
            e.preventDefault();
            setSize(next, true);
          }}
        >
          <span aria-hidden data-slot="resizable-grip" className={GRIP} />
        </div>
      </div>
    );
  },
);
ResizableHandle.displayName = "ResizableHandle";

export interface WidgetResizeHandleProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** react-resizable 이 넘기는 손잡이 방향 — 오른쪽 아래(se)만 그린다 */
  handleAxis?: string;
}

// 위젯 모서리 손잡이 — 오른쪽 아래 누르는 24 × 24 · 표식 9 × 9(오른쪽 · 아래 두 변만, 2px stroke-neutral-solid, 끝에서 6).
// react-grid-layout 이 ref · 끄는 이벤트를 붙인다 — 받은 속성을 그대로 span 에 넘긴다
const WidgetResizeHandle = React.forwardRef<HTMLSpanElement, WidgetResizeHandleProps>(({ handleAxis: _handleAxis, className, ...props }, ref) => (
  <span
    ref={ref}
    aria-hidden
    data-slot="widget-resize-handle"
    className={cn("absolute bottom-0 right-0 z-[1] size-6 cursor-se-resize touch-none", className)}
    {...props}
  >
    <span data-slot="widget-resize-mark" className="pointer-events-none absolute bottom-[6px] right-[6px] size-[9px] border-0 border-b-2 border-r-2 border-solid border-stroke-neutral-solid" />
  </span>
));
WidgetResizeHandle.displayName = "WidgetResizeHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle, WidgetResizeHandle };
