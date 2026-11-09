import { Button } from '@/shared/ui/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card'
import { Empty, EmptyDescription, EmptyIcon, EmptyTitle } from '@/shared/ui/shadcn/empty'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs'
import { usePermission } from '@/entities/session'
import { ApplicationTableContent } from '@/features/vacation-application/ui/ApplicationTableContent'
import { VacationApprovalForm } from '@/features/vacation-application/ui/VacationApprovalForm'
import { VacationGrantDialog } from '@/features/vacation-application/ui/VacationGrantDialog'
import { usePostCancelVacationRequestMutation } from '@/entities/vacation'
import { TypeResp } from '@/entities/type'
import { type GetUserRequestedVacationsResp } from '@/entities/vacation'
import { ConfirmDialog, useConfirmTarget } from '@/shared/ui/confirm'
import { CalendarX2 } from 'lucide-react'
import { Activity, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ApplicationTableProps {
  vacationRequests: GetUserRequestedVacationsResp[]
  grantStatusTypes: TypeResp[]
  userId?: string
  showGrantButton?: boolean
  showCancelButton?: boolean
  approvalRequests?: GetUserRequestedVacationsResp[]
  showApprovalTab?: boolean
}

const ApplicationTable = ({
  vacationRequests,
  grantStatusTypes,
  userId,
  showGrantButton = false,
  showCancelButton = true,
  approvalRequests = [],
  showApprovalTab = false
}: ApplicationTableProps) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<GetUserRequestedVacationsResp | null>(null)
  const [grantDialogOpen, setGrantDialogOpen] = useState(false)
  const { hasAnyPermission } = usePermission()

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
          <div className='flex items-center justify-between'>
            <CardTitle>{t('application.applicationHistory')}</CardTitle>
            <Activity mode={showGrantButton && hasAnyPermission(['VACATION:GRANT', 'VACATION:MANAGE']) ? 'visible' : 'hidden'}>
              <Button
                onClick={() => setGrantDialogOpen(true)}
                className='bg-blue-600 hover:bg-blue-700 text-white'
              >
                {t('application.grantVacation')}
              </Button>
            </Activity>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="requests">
            <TabsList>
              <TabsTrigger value="requests">{t('application.requestTab')}</TabsTrigger>
              <Activity mode={showApprovalTab ? 'visible' : 'hidden'}>
                <TabsTrigger value="approvals">{t('application.approvalTab')}</TabsTrigger>
              </Activity>
            </TabsList>

            <TabsContent value="requests" className="mt-4">
              {vacationRequests.length === 0 ? (
                <div className="min-h-[300px] flex items-center justify-center">
                  <Empty>
                    <EmptyIcon>
                      <CalendarX2 />
                    </EmptyIcon>
                    <EmptyTitle>{t('application.noRequestsTitle')}</EmptyTitle>
                    <EmptyDescription>
                      {t('application.noRequestsDescription')}
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
            </TabsContent>

            <Activity mode={showApprovalTab ? 'visible' : 'hidden'}>
              <TabsContent value="approvals" className="mt-4">
                {approvalRequests.length === 0 ? (
                  <div className="min-h-[300px] flex items-center justify-center">
                    <Empty>
                      <EmptyIcon>
                        <CalendarX2 />
                      </EmptyIcon>
                      <EmptyTitle>{t('application.noApprovalsTitle')}</EmptyTitle>
                      <EmptyDescription>
                        {t('application.noApprovalsDesc')}
                      </EmptyDescription>
                    </Empty>
                  </div>
                ) : (
                  <ApplicationTableContent
                    vacationRequests={approvalRequests}
                    grantStatusTypes={grantStatusTypes}
                    onDetailView={handleDetailView}
                  />
                )}
              </TabsContent>
            </Activity>
          </Tabs>
        </CardContent>
      </Card>

      <VacationApprovalForm
        open={detailOpen}
        onClose={handleDetailClose}
        requestData={selectedRequest || undefined}
      />

      <VacationGrantDialog
        open={grantDialogOpen}
        onClose={() => setGrantDialogOpen(false)}
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
        onConfirm={() =>
          cancelVacationRequest({ vacationGrantId: cancelTarget!.vacation_grant_id, userId: userId! })
        }
      />
    </>
  )
}

export { ApplicationTable }
