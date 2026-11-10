import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  {
    // 걷은 옛 UI 계통(I-25 25-5)을 다시 들여오지 않는다 — 알림은 ds Snackbar · Callout, 다크 모드는 shared/ui/theme
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'sonner', message: '토스트는 쓰지 않는다 — 성공은 ds Snackbar, 실패는 Callout · 칸 오류(write-error)' },
            { name: 'next-themes', message: '테마는 shared/ui/theme 가 맡는다' },
          ],
        },
      ],
    },
  },
  {
    // Desk 판 ds 에서 가져온 부품 — 안 쓰는 자리 인자는 `_` 로 시작한다(Desk eslint.config.js 와 같은 규칙, SOURCE.md)
    files: ['src/shared/ds/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
)
