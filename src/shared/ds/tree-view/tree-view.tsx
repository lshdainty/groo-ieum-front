import * as React from "react";
import { Check, ChevronRight } from "lucide-react";

import { cn } from "@/shared/lib/cn";
import { useExpandMotion } from "@/shared/ds/accordion";

/*
 * Groo Tree View — WAI-ARIA APG Treeview(2026-10-10). 수치 원본은 specs/components/tree-view.yaml.
 * 여러 단계로 된 항목 가운데 하나를 고르는 나무 — HR 관리 > 회사 · 부서 사용자의 부서 나무. 고른 항목의 내용은 옆 패널에 보인다.
 * SEED 에는 나무가 없다 — 키보드 · 역할은 APG Treeview, 줄의 값은 Side Navigation 항목(44 · 모서리 10 · 14 / 19)과 List 의 누름이다.
 * 부모 · 하위 두 단계에서 줄이 편집을 여는 목록은 List 의 하위 줄(ListParentItem), 상세를 접어 두는 목록은 Accordion 이다.
 *
 *   TreeView   나무 — nodes(TreeNode[] — { id, label, children? }) · aria-label 또는 aria-labelledby(필수) · selectedId · onSelectedChange(id) ·
 *              expandedIds · defaultExpandedIds · onExpandedChange(ids) · icon(모든 항목의 앞 아이콘 — 부서는 Building2) ·
 *              collapsible(기본 true — false 면 늘 펼친 나무: 꺾쇠 · 꺾쇠 칸 · aria-expanded 없음), 나머지는 ul 속성.
 *              selectedId 를 주지 않으면 나무가 고름을 쥔다. 처음 펼침은 화면이 정한다(defaultExpandedIds — 부서 나무는 모두 펼친 채 연다)
 *
 * 역할 — ul[role=tree](이름 필수) > li[role=treeitem](aria-level · aria-setsize · aria-posinset · 부모만 aria-expanded · aria-selected,
 *   이름은 aria-labelledby 로 이름 글만) > 줄 + ul[role=group]. 고르기 하나(aria-multiselectable 없음). 머리말 · 항목 안 단추를 두지 않는다 —
 *   노드 동작은 나무 밖 ⋮ 하나(Button ghost · iconOnly + ResponsiveMenu, 이름 "{고른 항목} 더보기")가 고른 항목에 건다.
 * 키보드 — 나무 전체가 Tab 정지점 하나(roving tabindex): 들어오면 고른 항목(접혀 숨었으면 보이는 조상, 없으면 첫 항목), 다시 Tab 이면 나간다.
 *   ↓ ↑ 다음 · 앞 보이는 항목(끝에서 멈춘다) · → 접힌 부모는 펼치고(초점 그대로) 펼친 부모는 첫 하위로 · ← 펼친 부모는 접고 그 밖에는 부모로 ·
 *   Home · End 첫 · 마지막 보이는 항목 · Enter · Space 누르기와 같다. → ← 는 고르지 않는다. 늘 펼친 나무는 → 첫 하위 · ← 부모로 옮기기만 한다.
 *   글자로 찾기 · * 는 두지 않는다.
 * 누르기 — 줄 전체가 누르는 자리다(사용자 결정 16D — SEED Accordion "터치 영역은 Chevron 아이콘뿐만 아니라 Trigger 전체"). 잎은 누르면 고르고,
 *   부모 줄은 누르면 고르면서 접힌 하위는 펴고 펼친 하위는 접는다(onSelectedChange · onExpandedChange 를 함께 부른다 — 펼친 부모를 고르면
 *   하위가 접힌다, 한 번 더 누르면 고르며 편다). Enter · Space 도 같다. 꺾쇠는 표시만이다 — 따로 누르는 자리 · 이벤트가 없다.
 *   collapsible={false}(늘 펼친 나무)면 누르기는 고르기만 한다. ← 로 접어 고른 항목이 부모 안으로 숨으면 고름은 그대로, 그 안에 있던 초점은
 *   접은 부모로 온다.
 * 모양: 나무는 패널 가장자리에서 8 들고 마지막 줄 아래 16. 줄 최소 44 · 위아래 12 · 오른쪽 8 · 왼쪽 8 + (단계 − 1) × 20 · 모서리 10.
 *   꺾쇠 칸 20 × 19(lucide chevron-right 16 · fg-neutral-subtle — 펼치면 90°, 하위가 없으면 같은 폭의 빈 칸) · 아이콘 16(fg-neutral-subtle, 장식) ·
 *   이름 t4 14 / 19 · 400 · fg-neutral, 사이 6. 이름은 줄을 바꾼다(말줄임 · title 없음) — 꺾쇠 · 아이콘은 첫 줄에 맞춘다.
 *   호버(웹) · 누름 bg-layer-default-pressed, 누르면 꺾쇠 · 아이콘 · 이름만 2px 거리 축소(모션 줄이기면 하지 않는다). 고른 항목은
 *   bg-neutral-weak-pressed(Side Navigation 지금 항목과 같다) — 올리거나 눌러도 그대로. 키보드 포커스에만 줄 안쪽 2px 링(모서리 10).
 * 모션: 꺾쇠 회전 · 하위 묶음 높이 300ms ease-easing(Accordion 과 같다 — useExpandMotion), 모션 줄이기면 150ms 서서히 · 꺾쇠는 바로.
 */

export interface TreeNode {
  id: string;
  label: React.ReactNode;
  children?: TreeNode[];
  /** 누를 수 없는 항목(손으로 더함 — 상위 부서 고르기의 자기 · 자손) — 고르지 못하고 fg-disabled, 키보드 초점은 받는다 */
  disabled?: boolean;
}

type TreeName = { "aria-label": string; "aria-labelledby"?: string } | { "aria-label"?: string; "aria-labelledby": string };

export type TreeViewProps = Omit<React.HTMLAttributes<HTMLUListElement>, "aria-label" | "aria-labelledby" | "children" | "defaultValue"> &
  TreeName & {
    nodes: TreeNode[];
    /** 고른 항목 — 주면 쥐고 다룬다(null 은 고르지 않음) */
    selectedId?: string | null;
    onSelectedChange?: (id: string) => void;
    /** 펼친 부모의 id — 주면 쥐고 다룬다 */
    expandedIds?: string[];
    /** 처음 펼친 부모 — 화면이 정한다 */
    defaultExpandedIds?: string[];
    onExpandedChange?: (ids: string[]) => void;
    /** 모든 항목의 앞 아이콘 — lucide 16(장식) */
    icon?: React.ReactNode;
    /** false 면 늘 펼친 나무 — 꺾쇠 · aria-expanded 없이 들임만 */
    collapsible?: boolean;
    /** 고른 항목 오른쪽에 체크 18(손으로 더함 — 고르기 표면 안의 나무) */
    selectionMark?: boolean;
  };

type FlatItem = { id: string; level: number; parentId: string | null; childIds: string[] };

// 보이는 항목을 차례대로 — 접힌 부모의 하위는 빠진다
function visibleItems(nodes: TreeNode[], expanded: Set<string>, collapsible: boolean) {
  const out: FlatItem[] = [];
  const walk = (list: TreeNode[], level: number, parentId: string | null) => {
    for (const n of list) {
      const kids = n.children ?? [];
      out.push({ id: n.id, level, parentId, childIds: kids.map((k) => k.id) });
      if (kids.length > 0 && (!collapsible || expanded.has(n.id))) walk(kids, level + 1, n.id);
    }
  };
  walk(nodes, 1, null);
  return out;
}

// id → 조상 id(가까운 쪽부터)
function ancestorsOf(nodes: TreeNode[], target: string): string[] | null {
  const path: string[] = [];
  const walk = (list: TreeNode[]): boolean => {
    for (const n of list) {
      if (n.id === target) return true;
      path.push(n.id);
      if (walk(n.children ?? [])) return true;
      path.pop();
    }
    return false;
  };
  return walk(nodes) ? [...path].reverse() : null;
}

// 누르는 순간 기준 길이 max(높이, 폭 ÷ 4, 24) 를 --press-basis 로 — 콘텐츠 층이 물려받는다
function measurePress(el: HTMLElement) {
  el.style.setProperty("--press-basis", String(Math.max(el.offsetHeight, el.offsetWidth / 4, 24)));
}

type TreeContextValue = {
  collapsible: boolean;
  expanded: Set<string>;
  selectedId: string | null;
  tabStopId: string | null;
  icon: React.ReactNode;
  baseId: string;
  selectionMark: boolean;
  /** 누르기(마우스 · 터치 · Enter · Space) — 고르고, 부모면 펴고 접는다(늘 펼친 나무는 고르기만) */
  press: (id: string, parent: boolean) => void;
  register: (id: string, el: HTMLLIElement | null) => void;
};
const TreeContext = React.createContext<TreeContextValue | null>(null);

// 줄 — 44 · 위아래 12 · 오른쪽 8 · 모서리 10(왼쪽은 단계마다 style). 호버(웹) · 누름은 bg-layer-default-pressed, 고른 항목은 bg-neutral-weak-pressed 그대로
const ROW = [
  "relative flex min-h-11 cursor-pointer rounded-r2_5 py-x3 pr-x2",
  "[transition:background-color_var(--motion-duration-color-transition)_var(--motion-ease-easing)]",
].join(" ");
const ROW_IDLE = "[@media(hover:hover)]:hover:bg-bg-layer-default-pressed active:bg-bg-layer-default-pressed";
const ROW_SELECTED = "bg-bg-neutral-weak-pressed";
// 콘텐츠 층 — 꺾쇠 · 아이콘 · 이름 사이 6, 첫 줄에 맞춘다. 누르는 동안 이 층만 2px 거리 축소(모션 줄이기면 하지 않는다 — motion-safe 로 건다)
const CONTENT = [
  "relative flex min-w-0 flex-1 items-start gap-x1_5",
  "[transition:scale_var(--motion-duration-pressed-scale)_var(--motion-ease-pressed-scale)]",
  "motion-safe:group-active/tree-row:[scale:calc(1-2/var(--press-basis))]",
].join(" ");
// 꺾쇠 칸 20 × 19 · 아이콘 16 — 표시만(누르는 자리는 줄 전체)
const CHEVRON_CELL = "flex h-[19px] w-5 shrink-0 items-center justify-center text-fg-neutral-subtle";
const CHEVRON = "size-4 shrink-0 [transition:rotate_var(--motion-duration-d6)_var(--motion-ease-easing)] motion-reduce:transition-none";
const ICON = "flex h-[19px] shrink-0 items-center text-fg-neutral-subtle [&>svg]:size-4 [&>svg]:shrink-0";
// 이름 — t4 14 / 19 · 400 · fg-neutral, 줄을 바꾼다(단어 단위)
const LABEL = "min-w-0 flex-1 font-sans text-t4 font-normal text-fg-neutral break-keep [overflow-wrap:break-word]";

function TreeItem({ node, level, posinset, setsize }: { node: TreeNode; level: number; posinset: number; setsize: number }) {
  const ctx = React.useContext(TreeContext)!;
  const kids = node.children ?? [];
  const parent = kids.length > 0;
  const open = !ctx.collapsible || ctx.expanded.has(node.id);
  const selected = ctx.selectedId === node.id;
  const disabled = node.disabled === true;
  const labelId = `${ctx.baseId}-${node.id}-label`;
  const groupId = `${ctx.baseId}-${node.id}-group`;
  const register = ctx.register;
  const liRef = React.useCallback((el: HTMLLIElement | null) => register(node.id, el), [register, node.id]);
  // 왼쪽 여백 8 + (단계 − 1) × 20
  const indent = `calc(var(--spacing-x2) + ${level - 1} * var(--spacing-x5))`;
  return (
    <li
      ref={liRef}
      role="treeitem"
      tabIndex={ctx.tabStopId === node.id ? 0 : -1}
      aria-level={level}
      aria-setsize={setsize}
      aria-posinset={posinset}
      aria-expanded={ctx.collapsible && parent ? open : undefined}
      aria-selected={selected}
      aria-disabled={disabled || undefined}
      aria-labelledby={labelId}
      data-slot="tree-view-item"
      data-id={node.id}
      className="m-0 list-none p-0 outline-none [&:focus-visible>[data-slot=tree-view-row]]:outline-2 [&:focus-visible>[data-slot=tree-view-row]]:-outline-offset-2 [&:focus-visible>[data-slot=tree-view-row]]:outline-stroke-focus-ring"
    >
      <div
        data-slot="tree-view-row"
        data-selected={selected ? "" : undefined}
        className={cn("group/tree-row", ROW, selected ? ROW_SELECTED : disabled ? "cursor-default" : ROW_IDLE)}
        style={{ paddingLeft: indent }}
        onPointerDown={(e) => measurePress(e.currentTarget)}
        onClick={() => {
          if (!disabled) ctx.press(node.id, parent);
        }}
      >
        <span data-slot="tree-view-row-content" className={CONTENT}>
          {ctx.collapsible && (
            <span aria-hidden data-slot="tree-view-chevron" className={CHEVRON_CELL}>
              {parent && <ChevronRight strokeWidth={2} className={cn(CHEVRON, open && "rotate-90")} />}
            </span>
          )}
          {ctx.icon != null && (
            <span aria-hidden data-slot="tree-view-icon" className={ICON}>
              {ctx.icon}
            </span>
          )}
          <span id={labelId} data-slot="tree-view-label" className={cn(LABEL, disabled && "text-fg-disabled")}>
            {node.label}
          </span>
          {ctx.selectionMark && selected && (
            <span aria-hidden data-slot="tree-view-check" className="flex h-[19px] shrink-0 items-center text-fg-neutral">
              <Check className="size-[18px]" strokeWidth={2} />
            </span>
          )}
        </span>
      </div>
      {parent && <TreeGroup id={groupId} open={open} nodes={kids} level={level + 1} />}
    </li>
  );
}

// 하위 묶음 — role=group. 접히면 그리지 않는다(hidden) — 높이 300ms, 모션 줄이기면 150ms 서서히
function TreeGroup({ id, open, nodes, level }: { id: string; open: boolean; nodes: TreeNode[]; level: number }) {
  const { ref, hidden } = useExpandMotion<HTMLUListElement>(open);
  return (
    <ul ref={ref} id={id} role="group" data-slot="tree-view-group" data-state={open ? "open" : "closed"} hidden={hidden} className="m-0 list-none p-0">
      {nodes.map((n, i) => (
        <TreeItem key={n.id} node={n} level={level} posinset={i + 1} setsize={nodes.length} />
      ))}
    </ul>
  );
}

const KEYS = new Set(["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End", "Enter", " "]);

const TreeView = React.forwardRef<HTMLUListElement, TreeViewProps>(
  (
    {
      nodes,
      selectedId: selectedProp,
      onSelectedChange,
      expandedIds,
      defaultExpandedIds,
      onExpandedChange,
      icon,
      collapsible = true,
      selectionMark = false,
      className,
      onKeyDown,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const baseId = React.useId();
    const [innerExpanded, setInnerExpanded] = React.useState<string[]>(defaultExpandedIds ?? []);
    const expandedList = expandedIds ?? innerExpanded;
    const expanded = React.useMemo(() => new Set(expandedList), [expandedList]);
    const [innerSelected, setInnerSelected] = React.useState<string | null>(null);
    const selectedId = selectedProp !== undefined ? selectedProp : innerSelected;
    const [focusedId, setFocusedId] = React.useState<string | null>(null);
    const elements = React.useRef(new Map<string, HTMLLIElement>());

    const visible = React.useMemo(() => visibleItems(nodes, expanded, collapsible), [nodes, expanded, collapsible]);
    const isVisible = React.useCallback((id: string | null) => id != null && visible.some((v) => v.id === id), [visible]);

    // Tab 정지점 — 나무 안에 초점이 있으면 그 항목, 아니면 고른 항목(숨었으면 보이는 가장 가까운 조상), 없으면 첫 항목
    const tabStopId = React.useMemo(() => {
      if (isVisible(focusedId)) return focusedId;
      if (selectedId != null) {
        if (isVisible(selectedId)) return selectedId;
        const up = ancestorsOf(nodes, selectedId)?.find((a) => isVisible(a));
        if (up) return up;
      }
      return visible[0]?.id ?? null;
    }, [focusedId, selectedId, nodes, visible, isVisible]);

    const setExpanded = React.useCallback(
      (next: string[]) => {
        if (expandedIds === undefined) setInnerExpanded(next);
        onExpandedChange?.(next);
      },
      [expandedIds, onExpandedChange],
    );
    const toggle = React.useCallback(
      (id: string) => setExpanded(expanded.has(id) ? expandedList.filter((x) => x !== id) : [...expandedList, id]),
      [expanded, expandedList, setExpanded],
    );
    const select = React.useCallback(
      (id: string) => {
        if (selectedProp === undefined) setInnerSelected(id);
        onSelectedChange?.(id);
      },
      [selectedProp, onSelectedChange],
    );
    // 누르기 — 고르고, 부모면 펴고 접는다(16D). 늘 펼친 나무는 고르기만
    const press = React.useCallback(
      (id: string, parent: boolean) => {
        select(id);
        if (collapsible && parent) toggle(id);
      },
      [select, toggle, collapsible],
    );
    const register = React.useCallback((id: string, el: HTMLLIElement | null) => {
      if (el) elements.current.set(id, el);
      else elements.current.delete(id);
    }, []);
    const focusItem = React.useCallback((id: string | undefined) => {
      if (!id) return;
      setFocusedId(id);
      elements.current.get(id)?.focus();
    }, []);

    // 접혀 숨은 항목에 초점이 남으면 보이는 가장 가까운 조상(접은 부모)으로 옮긴다
    React.useLayoutEffect(() => {
      const active = document.activeElement as HTMLElement | null;
      const id = active?.getAttribute("data-id");
      if (!active || !id || elements.current.get(id) !== active || isVisible(id)) return;
      const up = ancestorsOf(nodes, id)?.find((a) => isVisible(a));
      if (up) focusItem(up);
    }, [nodes, isVisible, focusItem]);

    const ctx = React.useMemo(
      () => ({ collapsible, expanded, selectedId, tabStopId, icon, baseId, selectionMark, press, register }),
      [collapsible, expanded, selectedId, tabStopId, icon, baseId, selectionMark, press, register],
    );

    return (
      <TreeContext.Provider value={ctx}>
        <ul
          ref={ref}
          role="tree"
          data-slot="tree-view"
          data-collapsible={collapsible ? undefined : "false"}
          className={cn("m-0 list-none px-x2 pb-x4 pt-0", className)}
          onFocus={(e) => {
            onFocus?.(e);
            const target = e.target as HTMLElement;
            const id = target.getAttribute("data-id");
            if (id && elements.current.get(id) === target) setFocusedId(id);
          }}
          onBlur={(e) => {
            onBlur?.(e);
            // 나무 밖으로 나가면 다음에 들어올 때 고른 항목이 정지점이다
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusedId(null);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented || !KEYS.has(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
            const li = e.target as HTMLElement;
            const id = li.getAttribute("data-id");
            if (!id || elements.current.get(id) !== li) return;
            const i = visible.findIndex((v) => v.id === id);
            const item = visible[i];
            if (!item) return;
            e.preventDefault();
            const parent = item.childIds.length > 0;
            switch (e.key) {
              case "ArrowDown":
                focusItem(visible[i + 1]?.id);
                break;
              case "ArrowUp":
                focusItem(visible[i - 1]?.id);
                break;
              case "ArrowRight":
                if (!parent) break;
                if (collapsible && !expanded.has(id)) toggle(id);
                else focusItem(item.childIds[0]);
                break;
              case "ArrowLeft":
                if (collapsible && parent && expanded.has(id)) toggle(id);
                else if (item.parentId) focusItem(item.parentId);
                break;
              case "Home":
                focusItem(visible[0]?.id);
                break;
              case "End":
                focusItem(visible[visible.length - 1]?.id);
                break;
              default:
                // Enter · Space — 누르기와 같다(누를 수 없는 항목은 아무 일도 없다)
                if (!li.hasAttribute("aria-disabled")) press(id, parent);
            }
          }}
          {...props}
        >
          {nodes.map((n, i) => (
            <TreeItem key={n.id} node={n} level={1} posinset={i + 1} setsize={nodes.length} />
          ))}
        </ul>
      </TreeContext.Provider>
    );
  },
);
TreeView.displayName = "TreeView";

export { TreeView };
