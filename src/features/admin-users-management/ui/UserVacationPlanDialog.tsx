import {
  useUserVacationPlansQuery,
  useVacationPlansQuery,
  usePostAssignPlansToUserMutation,
  useDeleteRevokePlanFromUserMutation
} from '@/entities/vacation-plan'
import { Badge } from '@/shared/ui/shadcn/badge'
import { Button } from '@/shared/ui/shadcn/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog'
import TransferList, { type TransferItem } from '@/shared/ui/shadcn/transfer'
import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface UserVacationPlanDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName?: string
}

const UserVacationPlanDialog = ({
  open,
  onOpenChange,
  userId,
  userName
}: UserVacationPlanDialogProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const [leftItems, setLeftItems] = useState<TransferItem[]>([])
  const [rightItems, setRightItems] = useState<TransferItem[]>([])
  const [initialLeftPlanCodes, setInitialLeftPlanCodes] = useState<Set<string>>(new Set())
  const [initialRightPlanCodes, setInitialRightPlanCodes] = useState<Set<string>>(new Set())

  // API 호출
  const { data: allPlans, isLoading: isLoadingAll } = useVacationPlansQuery()
  const { data: userPlans, isLoading: isLoadingUser } = useUserVacationPlansQuery(userId)

  // 휴가 플랜 할당/회수 API
  const assignPlansMutation = usePostAssignPlansToUserMutation()
  const revokePlanMutation = useDeleteRevokePlanFromUserMutation()

  const isLoading = isLoadingAll || isLoadingUser

  // 데이터 로드 및 초기화
  useEffect(() => {
    if (!open || !allPlans || !userPlans) return

    // 사용자에게 할당된 플랜 코드 Set
    const userPlanCodes = new Set(userPlans.map(p => p.code))

    // 미할당 플랜 (왼쪽)
    const unassignedPlans = allPlans.filter(p => !userPlanCodes.has(p.code))
    // 할당된 플랜 (오른쪽)
    const assignedPlans = userPlans

    const newLeftPlanCodes = new Set(unassignedPlans.map(p => p.code))
    const newRightPlanCodes = new Set(assignedPlans.map(p => p.code))

    setInitialLeftPlanCodes(newLeftPlanCodes)
    setInitialRightPlanCodes(newRightPlanCodes)

    const newLeftItems = unassignedPlans.map(plan => ({
      key: plan.code,
      label: plan.name,
      selected: false,
      desc: plan.desc,
      policyCount: plan.policies?.length || 0
    }))

    const newRightItems = assignedPlans.map(plan => ({
      key: plan.code,
      label: plan.name,
      selected: false,
      desc: plan.desc,
      policyCount: plan.policies?.length || 0
    }))

    setLeftItems(newLeftItems)
    setRightItems(newRightItems)
  }, [open, userId, allPlans, userPlans])

  // 변경사항이 있는지 확인
  const hasChanges = () => {
    const hasAddedPlans = rightItems.some(item => initialLeftPlanCodes.has(item.key))
    const hasRemovedPlans = leftItems.some(item => initialRightPlanCodes.has(item.key))
    return hasAddedPlans || hasRemovedPlans
  }

  const handleSave = async () => {
    // 추가된 플랜
    const addedPlanCodes = rightItems
      .filter(item => initialLeftPlanCodes.has(item.key))
      .map(item => item.key)

    // 제거된 플랜
    const removedPlanCodes = leftItems
      .filter(item => initialRightPlanCodes.has(item.key))
      .map(item => item.key)

    try {
      // 추가된 플랜이 있으면 할당 API 호출
      if (addedPlanCodes.length > 0) {
        await assignPlansMutation.mutateAsync({
          userId: userId,
          planCodes: addedPlanCodes
        })
      }

      // 제거된 플랜이 있으면 회수 API 호출 (개별 호출)
      for (const code of removedPlanCodes) {
        await revokePlanMutation.mutateAsync({
          userId: userId,
          code: code
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error(t('user.planSaveError'), error)
    }
  }

  const renderPlanItem = (item: TransferItem) => {
    return (
      <div className='flex flex-col gap-2'>
        <div className='flex items-center gap-2'>
          <span className='font-medium text-sm'>{item.label}</span>
          <Badge variant='outline' className='text-[10px] h-4 px-1.5'>
            <FileText className='h-3 w-3 mr-1' />
            {t('user.planPolicyCount', { count: item.policyCount as number })}
          </Badge>
        </div>
        {item.desc && (
          <p className='text-xs text-muted-foreground'>{item.desc}</p>
        )}
      </div>
    )
  }

  const filterPlanItem = (item: TransferItem, search: string) => {
    const searchLower = search.toLowerCase()
    return (
      item.label.toLowerCase().includes(searchLower) ||
      (item.desc as string)?.toLowerCase().includes(searchLower)
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl max-h-[90vh] flex flex-col'>
        <DialogHeader className='shrink-0'>
          <DialogTitle>
            {t('user.vacationPlanTitle')} {userName && `- ${userName}`}
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 min-h-0 overflow-y-auto py-4'>
          <div className='h-[500px] min-[48rem]:h-full min-h-[400px] flex flex-col'>
            {isLoading ? (
              <div className='flex items-center justify-center h-full'>
                <div className='text-foreground/70'>{tc('loading')}</div>
              </div>
            ) : (
              <TransferList
                leftItems={leftItems}
                rightItems={rightItems}
                onLeftChange={setLeftItems}
                onRightChange={setRightItems}
                leftTitle={t('user.unassignedPlans')}
                rightTitle={t('user.assignedPlans')}
                leftPlaceholder={t('user.searchPlan')}
                rightPlaceholder={t('user.searchPlan')}
                renderItem={renderPlanItem}
                renderRightItem={renderPlanItem}
                filterItem={filterPlanItem}
              />
            )}
          </div>
        </div>

        <DialogFooter className='shrink-0'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {tc('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges()}>
            {tc('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { UserVacationPlanDialog }
