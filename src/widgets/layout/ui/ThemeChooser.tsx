import { useTranslation } from 'react-i18next'
import { Monitor, Moon, Sun } from 'lucide-react'

import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogContent } from '@/shared/ds/dialog'
import { ListRadioGroup, ListRadioItem } from '@/shared/ds/list'
import { useTheme, type Theme } from '@/shared/ui/theme/theme-context'

const OPTIONS: { value: Theme; Icon: typeof Sun }[] = [
  { value: 'system', Icon: Monitor },
  { value: 'light', Icon: Sun },
  { value: 'dark', Icon: Moon },
]

/**
 * 화면 테마 고르기(H-A4 B) — 1280 이상 Dialog(조회 · 고르기 medium 480, 머리 닫기) · 미만 Bottom Sheet.
 * 본문은 List 라디오 줄 셋(누르는 순간 바뀌는 고르기). 누르면 바로 바뀌고 닫힌다(저장 단추 없음).
 */
export function ThemeChooser({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation('sidebar')
  const { theme, setTheme } = useTheme()
  const close = () => onOpenChange(false)

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent title={t('footer.theme')}>
        <ResponsiveDialogBody>
            <ListRadioGroup
              aria-label={t('footer.theme')}
              value={theme}
              onReselect={close}
              onValueChange={(value) => {
                setTheme(value as Theme)
                close()
              }}
            >
              {OPTIONS.map(({ value, Icon }) => (
                <ListRadioItem key={value} value={value} prefix={<Icon aria-hidden />} title={t(`theme.${value}`)} />
              ))}
            </ListRadioGroup>
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
