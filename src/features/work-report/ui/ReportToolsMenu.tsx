import { Download, File, Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResponsiveMenuContent, ResponsiveMenuGroup, ResponsiveMenuItem } from '@/shared/ds/menu'

/**
 * 업무 보고 도구 ⋮ 의 내용(I-25 H 44, HC12 A) — 엑셀 넷. 1280 이상 Menu · 미만 Menu Sheet(머리 = "업무 보고").
 * [엑셀로 가져오기] 는 `WORK:WRITE` 에게만(Q1 — 일반 직원은 본인 것만 가져온다), 나머지 셋은 지금처럼 권한 없이 모두에게.
 */
export function ReportToolsMenuContent({
  canImport,
  onImport,
  onExport,
  onTemplate,
  onUnregistered,
}: {
  canImport: boolean
  onImport: () => void
  onExport: () => void
  onTemplate: () => void
  onUnregistered: () => void
}) {
  const { t } = useTranslation('work')
  return (
    <ResponsiveMenuContent title={t('rep.title')} align='end'>
      <ResponsiveMenuGroup>
        {canImport && <ResponsiveMenuItem label={t('rep.toolImport')} icon={<Upload />} onSelect={onImport} />}
        <ResponsiveMenuItem label={t('rep.toolExport')} description={t('rep.toolExportHint')} icon={<Download />} onSelect={onExport} />
        <ResponsiveMenuItem label={t('rep.toolTemplate')} icon={<File />} onSelect={onTemplate} />
        <ResponsiveMenuItem label={t('rep.toolUnregistered')} icon={<Download />} onSelect={onUnregistered} />
      </ResponsiveMenuGroup>
    </ResponsiveMenuContent>
  )
}
