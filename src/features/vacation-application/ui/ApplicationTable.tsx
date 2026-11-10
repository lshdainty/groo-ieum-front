import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card'
import { Empty, EmptyDescription, EmptyIcon, EmptyTitle } from '@/shared/ui/shadcn/empty'
import { ApplicationTableContent } from '@/features/vacation-application/ui/ApplicationTableContent'
import { RequestDetail } from '@/features/vacation-application/ui/RequestDetail'
import { usePostCancelVacationRequestMutation } from '@/entities/vacation'
import { TypeResp } from '@/entities/type'
import { type GetUserRequestedVacationsResp } from '@/entities/vacation'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { CalendarX2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ApplicationTableProps {
  vacationRequests: GetUserRequestedVacationsResp[]
  grantStatusTypes: TypeResp[]
  userId?: string
  showCancelButton?: boolean
  /** 카드 제목 — 없으면 "신청이력"(휴가 신청 화면) */
  title?: string
  /** 빈 목록 글 — 없으면 본인 신청 화면의 글(작성 권유 포함) */
  emptyTitle?: string
  emptyDescription?: string
}

const ApplicationTable = ({
  vacationRequests,
  grantStatusTypes,
  userId,
  showCancelButton = true,
  title,
  emptyTitle,
  emptyDescription
}: ApplicationTableProps) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<GetUserRequestedVacationsResp | null>(null)

  const { mutateAsync: cancelVacationRequest } = usePostCancelVacationRequestMutation()
  const cancelConfirm = useConfirmTarget<GetUserRequestedVacationsResp>()

  const handleDetailView = (request: GetUserRequestedVacationsResp) => {
    setSelectedRequest(request)
    setDetailOpen(true)
  }

  const handleDetailClose = () => {
    setDetailOpen(false)
    setSelectedRequest(null)
  }

  // 신청 취소는 여기서 한 번 더 묻는다 — 줄의 ⋮ 가 어디로 옮겨 가도 같은 확인창이다
  const handleCancelRequest = (requestId: number) => {
    if (!userId) return

    const request = vacationRequests.find(r => r.vacation_grant_id === requestId)
    if (request) cancelConfirm.ask(request)
  }

  const cancelTarget = cancelConfirm.target

  return (
    <>
      <Card className='flex-1'>
        <CardHeader>
          <CardTitle>{title ?? t('application.applicationHistory')}</CardTitle>
        </CardHeader>
        <CardContent>
          {vacationRequests.length === 0 ? (
            <div className="min-h-[300px] flex items-center justify-center">
              <Empty>
                <EmptyIcon>
                  <CalendarX2 />
                </EmptyIcon>
                <EmptyTitle>{emptyTitle ?? t('application.noRequestsTitle')}</EmptyTitle>
                <EmptyDescription>
                  {emptyDescription ?? t('application.noRequestsDescription')}
                </EmptyDescription>
              </Empty>
            </div>
          ) : (
            <ApplicationTableContent
              vacationRequests={vacationRequests}
              grantStatusTypes={grantStatusTypes}
              onDetailView={handleDetailView}
              onCancelRequest={showCancelButton ? handleCancelRequest : undefined}
            />
          )}
        </CardContent>
      </Card>

      <RequestDetail
        open={detailOpen}
        onClose={handleDetailClose}
        requestData={selectedRequest || undefined}
        cancelUserId={showCancelButton ? userId : undefined}
        latest={(id) => vacationRequests.find((r) => r.vacation_grant_id === id)}
      />

      {/* [취소] 와 [신청 취소] 가 헷갈려서 이 확인창만 닫는 단추를 "닫기" 로 한다 */}
      <ConfirmDialog
        open={cancelConfirm.open}
        onOpenChange={cancelConfirm.onOpenChange}
        kind='cancel'
        title={t('application.cancelTitle')}
        description={t('application.cancelConfirm', { title: cancelTarget?.desc || cancelTarget?.policy_name })}
        confirmLabel={t('application.cancelAction')}
        cancelLabel={tc('close')}
        onConfirm={async () => {
          if (cancelTarget && userId) {
            await cancelVacationRequest({ vacationGrantId: cancelTarget.vacation_grant_id, userId })
          }
        }}
      />
    </>
  )
}

export { ApplicationTable }
