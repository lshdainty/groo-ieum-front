import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { Callout } from '@/shared/ds/callout'
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogCancel, ResponsiveDialogContent, ResponsiveDialogFooter } from '@/shared/ds/dialog'
import { Field } from '@/shared/ds/field'
import { Select, SelectItem } from '@/shared/ds/select'
import { readWriteFailure } from '@/shared/ui/groo/write-error'
import { useUnregisteredWorkHistoryExcelDownloadMutation } from '@/entities/work'

/** 연도 선택지 — 올해 기준 5년 전 ~ 1년 뒤 */
const yearOptions = (): number[] => {
  const current = dayjs().year()
  return Array.from({ length: 7 }, (_, i) => current - 5 + i)
}

/**
 * 업무 미등록 목록 받기(I-25 H 45) — 1280 이상 대화상자 480 · 미만 시트. 연 · 월 Select 둘 + 바닥 [취소][받기](받는 중 "받는 중…").
 * 실패는 표면 맨 위 Callout(고정 글) — 닫히지 않고 다시 받을 수 있다.
 */
export function UnregisteredDownloadDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation('work')
  const { t: tc } = useTranslation('common')
  const [year, setYear] = useState(dayjs().year())
  const [month, setMonth] = useState(dayjs().month() + 1)
  const [failureKey, setFailureKey] = useState<string | null>(null)
  const download = useUnregisteredWorkHistoryExcelDownloadMutation()

  const submit = async () => {
    setFailureKey(null)
    try {
      const blob = await download.mutateAsync({ year, month })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${t('unregistered.fileNamePrefix')}_${year}${t('unregistered.fileNameYear')}_${month}${t('unregistered.fileNameMonth')}_${dayjs().format('YYYYMMDD')}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      onClose()
    } catch (error) {
      setFailureKey(readWriteFailure(error).key ?? 'failure.write')
    }
  }

  return (
    <ResponsiveDialog open={open} form busy={download.isPending} onOpenChange={(o) => !o && onClose()}>
      <ResponsiveDialogContent title={t('rep.uTitle')} description={t('rep.uDesc')}>
        <ResponsiveDialogBody>
          <div className='flex flex-col gap-x6 pb-x2'>
            {failureKey && (
              <Callout tone='critical' role='alert' data-save-failure>
                {tc(failureKey)}
              </Callout>
            )}
            <Field label={t('rep.uYear')}>
              <Select aria-label={t('rep.uYear')} value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                {yearOptions().map((y) => (
                  <SelectItem key={y} value={String(y)} label={t('rep.yearValue', { year: y })} />
                ))}
              </Select>
            </Field>
            <Field label={t('rep.uMonth')}>
              <Select aria-label={t('rep.uMonth')} value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)} label={t('rep.monthValue', { month: m })} />
                ))}
              </Select>
            </Field>
          </div>
        </ResponsiveDialogBody>
        <ResponsiveDialogFooter>
          <ResponsiveDialogCancel>{tc('cancel')}</ResponsiveDialogCancel>
          <Button variant='neutralSolid' loading={download.isPending} onClick={() => void submit()} data-unregistered-submit>
            {download.isPending ? t('rep.uDownloading') : t('rep.uSubmit')}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  )
}
