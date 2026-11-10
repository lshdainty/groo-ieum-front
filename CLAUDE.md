# CLAUDE.md
이 파일은 Claude Code가 이 리포지토리의 코드를 작업할 때 가이드를 제공합니다.

> **워크스페이스 공통 규칙**(Git 작업 격리 · 스테이징 범위 · 태그·릴리스)은
> 상위 `/home/lshdainty/study/CLAUDE.md` 에 있다. Claude Code 가 디렉토리 워크업으로
> 자동 로드하므로 여기에 복사하지 않는다 — 복사본은 원문이 바뀌어도 따라오지 않는다.

## 아키텍처
React 19 + TypeScript + Vite를 사용하는 프론트엔드 프로젝트:

- **프론트엔드**: React 19, TypeScript, Vite
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand
- **라우팅**: React Router v6
- **API 통신**: Axios

## 코딩 규칙
- TypeScript strict 모드 사용
- 함수형 컴포넌트와 React Hooks 사용
- 2스페이스 들여쓰기, 세미콜론 없이
- camelCase 변수명, PascalCase 컴포넌트명
- 컴포넌트별 파일 분리
- Props 타입 정의 필수
- **export default 사용 금지**: named export 사용 (예: `export const MyComponent = ...`)
  - 이유: 다른 파일에서 import 시 이름 충돌 방지 및 명시적 이름 사용

## 프로젝트 구조
src/
├── api/          # API 서비스
├── components/   # 재사용 가능한 UI 컴포넌트
├── config/       # router 주소 등 설정 파일 모음집
├── features/     # 도메인별 메인 page
├── hooks/        # 커스텀 훅
├── utils/        # 유틸리티 함수
├── types/        # TypeScript 타입 정의
├── store/        # 전역 상태 관리

## TypeScript 설정
- strict: true
- noImplicitAny: true
- 명시적 반환 타입 선언
- 인터페이스 우선 사용

## UI 가이드라인
### ds 한 계통
- 화면은 **`src/shared/ds`**(그루 디자인 시스템 부품 — 출처 · 손댄 곳은 `src/shared/ds/SOURCE.md`)로 짠다. 새 UI 는 ds 부품을 쓰고, 없으면 먼저 디자인 시스템에 묻는다
- `src/shared/ds` 는 이 레포에서 직접 고치지 않는다(`npm run ds:check` 가 스펙과 어긋남을 잡는다)
- `src/shared/ui/shadcn/` 은 아직 ds 로 옮기지 않은 자리(관리 권한 화면 · 사용자 정보 카드 · 비밀번호 변경 대화상자 · 캘린더 주 보기 스크롤 · 접근 불가 화면)만 쓰는 잔재다(열두 파일) — **새로 쓰지 않는다.** 그 화면이 ds 로 옮겨지면 파일마다 쓰임을 grep 해 걷는다
- antd · sonner · next-themes 는 걷었다(eslint `no-restricted-imports` 가 다시 들이는 걸 막는다)

### 알림
- 성공은 ds `Snackbar`(`useSnackbar`), 저장 실패는 열린 표면 맨 위 `Callout`(칸으로 가를 수 있는 것은 그 칸 아래) — 글은 `readWriteFailure`(`shared/ui/groo/write-error.ts`)의 고정 글이다. 서버 글 · axios 영어 글은 그리지 않는다
- 호출처가 실패를 가져가지 않으면 `QueryProvider` 그물이 고정 글 Snackbar 로 알린다(`claimFailure` — `shared/api/failure.ts`)
- 토스트는 쓰지 않는다

### 디자인 토큰
- 색 · 간격 · 모서리 · 글자는 `src/shared/styles/groo-tokens.css`(역할 토큰 `bg-bg-layer-default` · `text-fg-neutral` · 간격 `x4` …)를 쓴다. 중단점은 sm 480 · md 768 · lg 1280 · xl 1440
- 다크/라이트 모드는 `shared/ui/theme` 가 맡는다

## 다국어(i18n) 작업 가이드라인

### 중요: 반드시 CSV 파일을 수정해야 함
- **마스터 파일**: `i18n/translations.csv` - 이 파일이 번역의 단일 소스(Single Source of Truth)
- **생성 파일**: `src/locales/` 폴더의 JSON 파일들은 자동 생성됨 (gitignore 대상)
- `npm run i18n:generate` 실행 시 CSV를 기준으로 JSON 파일이 덮어쓰기됨

### 컴포넌트 작업 시 다국어 처리 프로세스
1. **컴포넌트 개발**: 화면에 표시될 텍스트에 `t('namespace.key')` 형태로 번역 키 사용
2. **CSV에 키 등록**: `i18n/translations.csv`에 새로운 번역 키와 한국어/영어 값 추가
3. **다국어 파일 생성**: `npm run i18n:generate` 실행
4. **빌드 확인**: `npm run build:skip-check`로 빌드 테스트

### CSV 파일 형식
```
namespace,key,ko,en
admin,notice.title,공지사항 관리,Notice Management
common,save,저장,Save
```

### 네임스페이스 규칙
- `common`: 공통 UI 텍스트 (버튼, 상태 등)
- `admin`: 관리자 페이지
- `sidebar`: 사이드바 메뉴
- `vacation`: 휴가 관련
- `work`: 업무 관련
- `notice`: 공지사항 (사용자)
- 기타 도메인별 네임스페이스

### 주의사항
- **절대 `src/locales/` 폴더의 JSON 파일을 직접 수정하지 말 것** - 다음 생성 시 덮어씌워짐
- 새 기능 추가 시 번역 키를 CSV에 먼저 등록하는 것을 잊지 말 것
- 빌드/배포 전 `npm run i18n:generate` 실행 필수 (Jenkins에서 자동 실행됨)