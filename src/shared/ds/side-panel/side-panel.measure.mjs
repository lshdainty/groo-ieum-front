// Side Panel 을 어디서 재나 — scripts/check-ds-spec.mjs(npm run ds:check)가 읽는다.
// 견본의 첫 요소(root)는 무대(overlay-stage.tsx) — 패널은 무대 안에 열린 모달이라 모두 선택자로 잰다. 카탈로그는 오른쪽 medium 기본 한 장.
// 재지 않는 값: root.height · root.maxWidth · root.paddingBottom(안전 영역·문장) · root.position · closeButton.top/right/touchTarget/transition*(투명 상자를 당겨 놓아 값이 다르다)
//   · divider.*(안쪽 그림자 — data-scrolled 가 나타남을 정한다) · body.overflowY · footer.buttonSize · left/fog 규칙(견본 없음)
const P = "[data-slot=side-panel-content]";
export default {
  "overlay.background": ["[data-slot=side-panel-overlay]", "color", "background-color"],
  "overlay.zIndex": ["[data-slot=side-panel-overlay]", "exact", "z-index"],
  "root.radius": [P, "px", "border-top-left-radius"],
  "root.background": [P, "color", "background-color"],
  "root.shadow": [P, "exact", "box-shadow"],
  "root.zIndex": [P, "exact", "z-index"],
  "root.width": [P, "px", "width"],
  "header.paddingTop": ["[data-slot=side-panel-header]", "px", "padding-top"],
  "header.paddingX": ["[data-slot=side-panel-header]", "px", "padding-left"],
  "header.paddingBottom": ["[data-slot=side-panel-header]", "px", "padding-bottom"],
  "header.minHeight": ["[data-slot=side-panel-header]", "px", "min-height"],
  "header.gap": ["[data-slot=side-panel-header]", "px", "row-gap"],
  "title.typography": ["[data-slot=side-panel-title]", "typography"],
  "title.fontWeight": ["[data-slot=side-panel-title]", "exact", "font-weight"],
  "title.foreground": ["[data-slot=side-panel-title]", "color", "color"],
  "description.typography": ["[data-slot=side-panel-description]", "typography"],
  "description.fontWeight": ["[data-slot=side-panel-description]", "exact", "font-weight"],
  "description.foreground": ["[data-slot=side-panel-description]", "color", "color"],
  "closeButton.size": ["[data-slot=side-panel-close]", "px", "width"],
  "closeButton.radius": ["[data-slot=side-panel-close]", "px", "border-top-left-radius"],
  "closeButton.color": ["[data-slot=side-panel-close]", "color", "color"],
  "body.paddingX": ["[data-slot=side-panel-body]", "px", "padding-left"],
  "footer.paddingTop": ["[data-slot=side-panel-footer]", "px", "padding-top"],
  "footer.paddingX": ["[data-slot=side-panel-footer]", "px", "padding-left"],
  "footer.paddingBottom": ["[data-slot=side-panel-footer]", "px", "padding-bottom"],
  "footer.gap": ["[data-slot=side-panel-footer]", "px", "column-gap"],
};
