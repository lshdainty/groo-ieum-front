import { useRef, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { config } from '@/shared/config'
import { Avatar } from '@/shared/ds/avatar'
import { Badge } from '@/shared/ds/badge'
import { Button } from '@/shared/ds/button'
import { Card, CardHeader, CardTitle } from '@/shared/ds/card'
import { List, ListButtonItem, ListItem } from '@/shared/ds/list'
import { ResponsiveMenu } from '@/shared/ds/menu'
import { ResultSection } from '@/shared/ds/result-section'
import {
  Table,
  TableBody,
  TableCell,
  TableCellContent,
  TableHead,
  TableHeader,
  TableMoreCell,
  TableMoreHead,
  TableRow,
  TableRowHeader,
} from '@/shared/ds/table'
import { TablePagination, type TablePaginationValue } from '@/shared/ds/table-pagination'
import { usePermission } from '@/entities/session'
import type { GetUsersResp } from '@/entities/user'
import { useDesktop } from '@/widgets/layout/lib/use-desktop'
import { formatWorkTime, hasUserActions, userActionsOf, userStatusOf } from '../lib/user-format'
import { useManagementContext } from '../model/ManagementContext'
import { UserRowMenuContent } from './UserRowMenu'

/** 쪽 크기 선택지 — 가장 작은 쪽 크기 이하면 넘김 줄을 두지 않는다 */
const PAGE_SIZES = [10, 25, 50] as const
const WORD = '[overflow-wrap:break-word] [word-break:keep-all]'
const LONG = '[overflow-wrap:anywhere]'

const photoOf = (u: GetUsersResp): string | undefined => (u.profile_url ? `${config.baseUrl}${u.profile_url}` : undefined)

export const UserStatusBadge = ({ status }: { status: string | undefined }) => {
  const { t } = useTranslation('admin')
  const s = userStatusOf(status)
  if (!s) return <span className='text-fg-neutral-subtle'>-</span>
  return (
    <Badge tone={s.tone} data-user-status={status} className='whitespace-nowrap'>
      {t(s.key)}
    </Badge>
  )
}

const UsersEmpty = () => {
  const { t } = useTranslation('admin')
  return <ResultSection size='medium' icon={<Users />} title={t('users.emptyTitle')} description={t('users.emptyDescription')} />
}

/**
 * 사용자 목록 카드 "사용자 {n}명"(I-24 F 28 · 30 · 31) — 데스크톱: 머리 [초대] + ds Table 여섯 열 + ⋮ + Table Pagination(받은 목록을 화면에서 자른다).
 * 폰: 띠 하나 — 머리 + List 줄(Avatar 42 · 이름 · "{아이디} · {주 부서}" · 상태). 11-08 A1 — 줄에 ⋮ 를 두지 않고 줄을 누르면 그 사람의 동작 시트가 열린다.
 * 표 rich 줄은 ds 가 칸 높이 최소 72 + 위아래 12 를 지킨다(TABLE_BODY_RICH — 칸마다 여백을 따로 주지 않는다).
 */
export function UserListCard({ users }: { users: GetUsersResp[] }) {
  const { t } = useTranslation('admin')
  const desktop = useDesktop()
  const { hasPermission } = usePermission()
  const ctx = useManagementContext()
  const manage = hasPermission('USER:MANAGE')
  const manageVacation = hasPermission('VACATION:MANAGE')
  const [pageValue, setPageValue] = useState<TablePaginationValue>({ page: 1, pageSize: PAGE_SIZES[0] })
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const tableRef = useRef<HTMLDivElement>(null)

  const can = { manage, manageVacation }
  const showPagination = users.length > PAGE_SIZES[0]
  const lastPage = Math.max(1, Math.ceil(users.length / pageValue.pageSize))
  const page = showPagination ? Math.min(pageValue.page, lastPage) : 1
  const pageRows = users.slice((page - 1) * pageValue.pageSize, page * pageValue.pageSize)
  const anyMenu = users.some((u) => hasUserActions(userActionsOf(u, can)))
  const menuUser = users.find((u) => u.user_id === menuFor)

  const invite = manage ? (
    <Button variant='neutralOutline' size='small' data-user-invite onClick={() => ctx.setShowInviteDialog(true)}>
      <Plus />
      {t('user.invite')}
    </Button>
  ) : null

  const header = (
    <CardHeader className='flex items-center justify-between gap-x3'>
      <CardTitle>{t('users.listTitle', { count: users.length })}</CardTitle>
      {invite}
    </CardHeader>
  )

  const body =
    users.length === 0 ? (
      <UsersEmpty />
    ) : desktop ? (
      <Table
        ref={tableRef}
        caption={t('users.listCaption')}
        rowHeight='rich'
        pagination={
          showPagination ? (
            <TablePagination value={{ ...pageValue, page }} onValueChange={setPageValue} totalItems={users.length} pageSizeOptions={PAGE_SIZES} scrollTarget={tableRef} />
          ) : undefined
        }
      >
        <TableHeader>
          <TableRow>
            <TableHead>{t('users.colName')}</TableHead>
            <TableHead>{t('users.colId')}</TableHead>
            <TableHead>{t('users.colWorkTime')}</TableHead>
            <TableHead>{t('users.colCompany')}</TableHead>
            <TableHead>{t('users.colStatus')}</TableHead>
            {anyMenu && <TableMoreHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map((u) => {
            const actions = userActionsOf(u, can)
            return (
              <TableRow key={u.user_id} data-user-id={u.user_id}>
                <TableRowHeader className='min-w-[180px]'>
                  <TableCellContent
                    media={<Avatar name={u.user_name} src={photoOf(u)} size={42} />}
                    title={<span className={WORD}>{u.user_name}</span>}
                    detail={<span className={`${LONG} whitespace-normal`}>{u.user_email || '-'}</span>}
                  />
                </TableRowHeader>
                <TableCell className={`max-w-[160px] whitespace-normal ${LONG}`}>{u.user_id}</TableCell>
                <TableCell className='whitespace-nowrap'>{formatWorkTime(u.user_work_time)}</TableCell>
                <TableCell className='max-w-[200px] whitespace-normal'>
                  <TableCellContent
                    title={<span className={WORD}>{u.user_origin_company_name}</span>}
                    detail={<span className={WORD}>{u.main_department_name_kr || '-'}</span>}
                  />
                </TableCell>
                <TableCell className='whitespace-nowrap'>
                  <UserStatusBadge status={u.invitation_status} />
                </TableCell>
                {anyMenu &&
                  (hasUserActions(actions) ? (
                    <TableMoreCell label={u.user_name}>
                      <UserRowMenuContent user={u} actions={actions} />
                    </TableMoreCell>
                  ) : (
                    <TableCell />
                  ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    ) : (
      <>
        <List>
          {users.map((u) => {
            const actions = userActionsOf(u, can)
            const common = {
              'data-user-id': u.user_id,
              prefix: <Avatar name={u.user_name} src={photoOf(u)} size={42} />,
              title: <span className={WORD}>{u.user_name}</span>,
              detail: <span className={LONG}>{u.main_department_name_kr ? `${u.user_id} · ${u.main_department_name_kr}` : u.user_id}</span>,
              suffix: <UserStatusBadge status={u.invitation_status} />,
              align: 'top' as const,
            }
            return hasUserActions(actions) ? (
              <ListButtonItem key={u.user_id} {...common} aria-haspopup='dialog' onClick={() => setMenuFor(u.user_id)} />
            ) : (
              <ListItem key={u.user_id} {...common} />
            )
          })}
        </List>
        {menuUser && (
          <ResponsiveMenu open onOpenChange={(open) => !open && setMenuFor(null)}>
            <UserRowMenuContent user={menuUser} actions={userActionsOf(menuUser, can)} />
          </ResponsiveMenu>
        )}
      </>
    )

  return desktop ? (
    <Card body='list' data-user-list>
      {header}
      {body}
    </Card>
  ) : (
    <section className='bg-bg-layer-default pb-x2 pt-x1' data-user-list>
      <div className='flex items-center justify-between gap-x3 px-global-gutter pb-x1 pt-x5'>
        <h2 className='m-0 text-t5 font-bold text-fg-neutral'>{t('users.listTitle', { count: users.length })}</h2>
        {invite}
      </div>
      {body}
    </section>
  )
}
