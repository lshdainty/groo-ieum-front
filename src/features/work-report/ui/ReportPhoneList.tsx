import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/shared/ds/button'
import { InfiniteListEnd } from '@/shared/ds/infinite-list'
import { List, ListButtonItem, ListCheckGroup, ListCheckItem, ListHeader, ListItem } from '@/shared/ds/list'
import { formatDayText } from '@/shared/lib/date-text'
import { codePath, groupByDate, rowTitle } from '../lib/report-format'
import { useReportContext } from '../model/ReportContext'
import type { WorkRow } from '../model/types'
import type { RowHandlers } from './ReportTable'

/** 폰은 쪽 넘김이 아니라 끝없이 — 받은 줄을 20개씩 더 보인다 */
const PHONE_STEP = 20
const WORD = '[overflow-wrap:break-word] [word-break:keep-all]'
/** 내용 · 이름이 길고 띄어쓰기 없는 낱말(주소 · 코드)이어도 넘치지 않게 */
const LONG = '[overflow-wrap:anywhere] [word-break:keep-all]'

/**
 * 업무 기록 폰 목록(768 미만 — I-25 H 46 · 47, HC11 A) — 날짜 묶음(List Header "10월 22일 (목)", 받은 차례 그대로) 아래 줄.
 * 줄 = 제목 내용(줄바꿈 전부 · 비면 "분류 › 파트 › 구분") · 설명 "{담당자} · {분류} › {파트} › {구분}" · 오른쪽 "{n}시간".
 * 줄 ⋮ 는 없다(11-08 A1) — 내 줄(또는 `WORK:MANAGE`)을 누르면 수정 시트(바닥 왼쪽 [삭제]), 남의 줄은 들어갈 상세가 없고 동작이 복제 하나라 줄 끝 글 단추.
 * 고르기 중이면 줄 앞 체크 · 누르면 체크(남의 줄도 고른다 — 복제는 나로 만든다). 끝 "업무 기록을 모두 봤어요."
 */
export function ReportPhoneList({ rows, handlers }: { rows: WorkRow[]; handlers: RowHandlers }) {
  const { t } = useTranslation('work')
  const { selected, setSelected, selecting } = useReportContext()
  const [shown, setShown] = useState(PHONE_STEP)
  const visible = rows.slice(0, shown)
  const groups = groupByDate(visible)

  const detailOf = (row: WorkRow) => [row.managerName, [codePath(row), row.division?.work_code_name].filter(Boolean).join(' › ')].filter(Boolean).join(' · ')
  const hours = (row: WorkRow) => <span className='text-t5 font-bold tabular-nums text-fg-neutral'>{t('rep.hoursValue', { count: row.hours })}</span>
  const toggle = (id: number, on: boolean) => setSelected(on ? [...selected, id] : selected.filter((x) => x !== id))

  return (
    <>
      {groups.map((g) => (
        <section key={g.date} data-date-group={g.date}>
          <ListHeader as='h3'>{formatDayText(g.date)}</ListHeader>
          {selecting ? (
            <ListCheckGroup aria-label={formatDayText(g.date)}>
              {g.rows.map((row) => (
                <ListCheckItem
                  key={row.id}
                  data-work-id={row.id}
                  title={<span className={LONG}>{rowTitle(row)}</span>}
                  detail={<span className={WORD}>{row.content.trim() ? detailOf(row) : row.managerName}</span>}
                  suffix={hours(row)}
                  checked={selected.includes(row.id)}
                  onCheckedChange={(on) => toggle(row.id, on === true)}
                />
              ))}
            </ListCheckGroup>
          ) : (
            <List>
              {g.rows.map((row) => {
                const actions = handlers.actionsOf(row)
                const common = {
                  'data-work-id': row.id,
                  title: <span className={LONG}>{rowTitle(row)}</span>,
                  detail: <span className={WORD}>{row.content.trim() ? detailOf(row) : row.managerName}</span>,
                  align: 'top' as const,
                }
                if (actions.edit) return <ListButtonItem key={row.id} {...common} suffix={hours(row)} aria-haspopup='dialog' onClick={() => handlers.onEdit(row)} />
                return (
                  <ListItem
                    key={row.id}
                    {...common}
                    suffix={
                      <span className='flex flex-col items-end gap-x1'>
                        {hours(row)}
                        {actions.duplicate && (
                          <Button variant='ghost' size='small' flush='right' aria-label={t('rep.duplicateFor', { date: formatDayText(row.date), name: row.managerName })} onClick={() => handlers.onDuplicate(row)} data-duplicate-row>
                            {t('rep.duplicate')}
                          </Button>
                        )}
                      </span>
                    }
                  />
                )
              })}
            </List>
          )}
        </section>
      ))}
      {rows.length > PHONE_STEP && (
        <InfiniteListEnd
          status={shown < rows.length ? 'loading' : 'end'}
          endText={t('rep.listEnd')}
          onRetry={() => setShown((n) => n + PHONE_STEP)}
          onReachEnd={() => setShown((n) => (n < rows.length ? n + PHONE_STEP : n))}
        />
      )}
    </>
  )
}
