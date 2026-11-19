#!/usr/bin/env node
/**
 * 숫자 · 돈 글자 셈을 확인한다 — 담다 시험(vitest — percent.test · format.test "퍼센트 천 단위 쉼표" · use-amount-limit)의 판정을
 * 이 레포에 옮긴 것이다. 이 레포에는 단위 테스트 러너가 없어 Vite 의 ssrLoadModule 로 src 셈 모듈을 Node 에서 그대로 부른다
 * (브라우저가 필요 없는 순수 셈이라 check-chart 처럼 Playwright 를 띄우지 않는다).
 *
 *   - 퍼센트 천 단위 쉼표(담다 3b275640) — 진행률 정수 `progressPercentText` · 비중 첫째 자리 `formatShare` · 등락률 `formatChangeRate`
 *   - 영어 금액 상한 글(groo-design #252 — 문장 속 영어 돈은 `₩10,000,000,000`, 한국어는 "…원" 그대로) `amountLimitText`
 *   - i18n/translations.csv 영어 문구에 돈 금액으로 쓴 "won" 이 없다(화폐 이름 "Korean Won" · 줄임말 "won't" 는 제외)
 *
 * 사용: node scripts/check-format.mjs  (먼저 `npm run i18n:generate` — 비중 "0.1% 미만" 글이 src/locales 에서 온다)
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fails = [];
const eq = (what, got, want) => {
  if (got !== want) fails.push(`${what}: ${JSON.stringify(got)} ≠ ${JSON.stringify(want)}`);
};

// i18n 설정이 불러올 때 문서 언어(document.documentElement.lang)를 맞춘다 — Node 에는 document 가 없어 그 자리만 둔다
globalThis.document ??= { documentElement: { lang: "ko" } };

const server = await createServer({
  root: ROOT,
  logLevel: "error",
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
try {
  const { progressPercentText } = await server.ssrLoadModule("/src/shared/lib/percent.ts");
  const { formatShare, formatChangeRate } = await server.ssrLoadModule("/src/shared/lib/groo/share.ts");
  const { amountLimitText } = await server.ssrLoadModule("/src/shared/lib/groo/use-amount-limit.ts");
  const { default: i18n } = await server.ssrLoadModule("/src/app/config/i18n.ts");

  // 퍼센트 천 단위 쉼표 — 담다 format.test 의 표 그대로 [값, share, progress, change(auto)]
  const rows = [
    [999, "999.0%", "999%", "999.00%"],
    [1000, "1,000.0%", "1,000%", "1,000.00%"],
    [1234.56, "1,234.6%", "1,235%", "1,234.56%"],
    [12345.67, "12,345.7%", "12,346%", "12,345.67%"],
    [-1234.5, "−1,234.5%", "−1,235%", "−1,234.50%"],
    [-0.04, "0.0%", "0%", "−0.04%"],
    [-0.004, "0.0%", "0%", "0.00%"],
    [999.96, "1,000.0%", "1,000%", "999.96%"],
  ];
  for (const [v, share, progress, change] of rows) {
    eq(`formatShare(${v})`, formatShare(v), share);
    eq(`progressPercentText(${v})`, progressPercentText(v), progress);
    eq(`formatChangeRate(${v})`, formatChangeRate(v), change);
  }
  // 담다 percent.test "천 단위 쉼표 — 999 · 1000 · 1234.4 · 음수"
  eq("progressPercentText(1234.4)", progressPercentText(1234.4), "1,234%");
  eq("progressPercentText(-0.2)", progressPercentText(-0.2), "0%");
  eq("progressPercentText(NaN)", progressPercentText(NaN), "—");
  eq("formatChangeRate(1234.56, always)", formatChangeRate(1234.56, { sign: "always" }), "+1,234.56%");
  eq("formatChangeRate(-1234.56, none)", formatChangeRate(-1234.56, { sign: "none" }), "1,234.56%");

  // 경계 — 0.04 는 미만 문구(쉼표 무관), 영어도 쉼표
  await i18n.changeLanguage("ko");
  eq("formatShare(0.04) ko", formatShare(0.04), "0.1% 미만");
  await i18n.changeLanguage("en");
  eq("formatShare(0.04) en", formatShare(0.04), "<0.1%");
  eq("formatShare(1234.5) en", formatShare(1234.5), "1,234.5%");
  eq("progressPercentText(1234) en", progressPercentText(1234), "1,234%");
  await i18n.changeLanguage("ko");

  // 영어 금액 상한 글 — "won" 을 붙이지 않고 ₩ 를 앞에, 줄이지 않는다. 한국어는 "…억원" 그대로
  eq("amountLimitText(1e10, en)", amountLimitText(1e10, true), "₩10,000,000,000");
  eq("amountLimitText(1e11, en)", amountLimitText(1e11, true), "₩100,000,000,000");
  eq("amountLimitText(1e10, ko)", amountLimitText(1e10, false), "100억원");
  eq("amountLimitText(1e11, ko)", amountLimitText(1e11, false), "1,000억원");
} finally {
  await server.close();
}

// CSV 영어 문구의 "won" — 돈 금액 표기로 쓴 것은 0 이어야 한다(₩ 로 쓴다)
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows;
}
const [head, ...csv] = parseCsv(readFileSync(resolve(ROOT, "i18n/translations.csv"), "utf8"));
const enAt = head.indexOf("en");
for (const r of csv) {
  const en = (r[enAt] ?? "").replace(/\bKorean Won\b/g, "").replace(/\bwon't\b/gi, "");
  if (/\bwon\b/i.test(en)) fails.push(`translations.csv ${r[0]},${r[1]} 영어에 "won": ${r[enAt]}`);
}

if (fails.length) {
  console.error(`실패 ${fails.length}건`);
  for (const f of fails) console.error(`  ✗ ${f}`);
  process.exit(1);
}
console.log("✓ 퍼센트 천 단위 쉼표 · 영어 금액 상한 ₩ · CSV 영어 \"won\" 0");
