# ds 출처
- 출처: groo-damda-front c149b5ce (origin/main, 2026-11-08) `src/shared/ds/<폴더>` (아래 38폴더 + `i18n.ts`, 테스트 제외, demo·measure 포함), `src/shared/lib/percent.ts`·`before-unload.ts`·`utils.ts`·`cn.ts` (ds 가 쓴다)
  - 들인 폴더: accordion · alert-dialog · avatar · badge · bottom-sheet · button · callout · card · catalog · checkbox · dialog · divider · field · help-bubble · infinite-list · input · input-button · list · menu · menu-sheet · notification-badge · overlay · pagination · popover · progress-circle · radio-group · result-section · scroll-fog · select · side-navigation · skeleton · snackbar · switch · table · table-pagination · tag-group · textarea · tooltip · top-navigation
  - 안 들인 것(다음 묶음이 필요할 때 같은 길로): chart · segmented-control · chip · progress · image-frame · aspect-ratio · logo-tile · date-picker · month-picker · time-picker · wheel-picker · tabs · slider · toggle · select-box · searchable-list · icon-picker · attachment-input · input-otp · quantity-picker · swipe-actions · bottom-navigation · floating-action-button · page-banner · collapsible · color-swatch · content-placeholder · institution-colors · scroll-area · scroll-auto-hide · `src/shared/ui/groo`
- footer, side-panel: groo-sso-front origin/main 1b8847c `src/shared/ds/` (그 폴더는 groo-design 3b51647 `recipes/shadcn/components/ui/` 에서 옮긴 것 — Desk ds 에 없다)
- 토큰·spec JSON: `npm run design:sync` (groo-design 5193bb3, **DESIGN.hr.md**)

## 손으로 고친 자리
1. `scripts/sync-design.mjs` — 원본 DESIGN.hr.md, prettier 단계 없음(이 레포에 prettier 가 없다), `src/shared/styles` 폴더가 없으면 만든다.
2. `i18n.ts` — Desk 판 그대로 두되 한국어 원본 읽기(`koText`)가 중첩 JSON 도 읽는다. 이 레포의 `scripts/generate-i18n.mjs` 는 키를 점(.)으로 중첩해 `ds.json` 을 만든다(Desk 는 평평). i18next 쪽은 점 구분이 기본이라 그대로 읽는다.
3. `i18n/translations.csv` · `scripts/generate-i18n.mjs` — Desk 같은 판의 `ds,` 행 138 전부를 끝에 붙였다. 이 레포 생성기가 `""` 이스케이프(RFC4180)를 몰라 Desk 판의 그 분기만 가져왔다(기존 행에 `""` 는 0 이라 다른 이름공간 출력 변화 0 — 전후 locales 바이트 비교). Desk 의 `\n` 치환은 가져오지 않았다. 생성한 `locales/{ko,en}/ds.json` 을 펴서 Desk 생성물과 대조: 138키 값 차이 0.
4. `eslint.config.js` — ds 폴더에 `_` 접두 미사용 인자 허용(Desk 와 같은 규칙).
5. `dialog/dialog.tsx` · `result-section/result-section.tsx` — Desk 판의 `useHoldReferenceNotice`(`@/shared/api`, 담다 공용 참조 실패 스낵바를 폼이 열린 동안 쉬게 하는 훅)와 그 import · 호출 · 주석(dialog 1 · result-section 1)을 걷었다. 이음에는 그 참조 알림이 없다. 다시 복사할 때마다 같은 두 자리를 걷는다.
6. `catalog/registry.ts` — Side Panel · Footer 항목을 더하고(Desk 등록부에 없다), 스펙이 없는 Month Picker 항목은 걷었다.
7. `scripts/check-ds-spec.mjs` — groo-sso-front 판(Desk 판 + `resolveState` 가 맞는 규칙의 `skipped` 칸을 잰 값에서 뺀다. 이음 DESIGN.hr.md 는 brand 칸을 싣는다 — 이 보정은 skipped 가 비면 아무 일도 안 한다).
8. `src/app/index.tsx` — `/dev/ds` 카탈로그(개발 서버 전용, `import.meta.env.DEV` 가드). 로그인·권한 확인 앞에서 그린다.
9. (sso 의 다크 틀 보정 — snackbar · menu · table-pagination · side-navigation 의 `container` 손질 — 은 가져오지 않았다. 이음은 다크가 문서 루트라 필요 없다. 화면 이관에서 필요해지면 그때 판단.)
10. `button/button-variants.ts` — 로딩 원의 `var(--color-gray-500)` 3곳을 `#8a91a0` + `dark:#656b78`(groo gray-500 라이트·다크 리터럴)로. 옛 화면이 쓰는 Tailwind gray-500 을 `index.css` 의 body 블록이 되돌리기 때문이다. 그 블록을 걷을 때 `var(--color-gray-500)` 로 되돌린다.
11. `src/index.css` — 임시 블록(글꼴 · shadow-sm~xl · 팔레트)이 옛 화면의 값을 지킨다. 전역 `word-break: keep-all` · 글리프 보충 글꼴 `GrooNumSymbols` 는 옛 화면을 바꾸므로 이 묶음에서 켜지 않았다(화면 이관 때).
