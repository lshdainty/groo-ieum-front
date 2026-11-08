import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog'
import { Button } from '@/shared/ui/shadcn/button'
import { Checkbox } from '@/shared/ui/shadcn/checkbox'
import { Badge } from '@/shared/ui/shadcn/badge'
import { ScrollArea } from '@/shared/ui/shadcn/scrollArea'
import { usePutPlanPoliciesMutation } from '@/entities/vacation-plan'
import { useVacationPoliciesQuery } from '@/entities/vacation-policy'
import { type VacationPlanResp } from '@/entities/vacation-plan'
import { Spinner } from '@/shared/ui/shadcn/spinner'

interface VacationPlanPolicyDialogProps {
  plan: VacationPlanResp
  trigger: React.ReactNode
}

const VacationPlanPolicyDialog = ({
  plan,
  trigger
}: VacationPlanPolicyDialogProps) => {
  const { t } = useTranslation('vacation')
  const { t: tc } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<number[]>([])

  const { data: allPolicies, isLoading: isPoliciesLoading } = useVacationPoliciesQuery()
  const updatePoliciesMutation = usePutPlanPoliciesMutation()

  useEffect(() => {
    if (open && plan.policies) {
      setSelectedPolicyIds(plan.policies.map(p => p.id))
    }
  }, [open, plan.policies])

  const handlePolicyToggle = (policyId: number, checked: boolean) => {
    if (checked) {
      setSelectedPolicyIds(prev => [...prev, policyId])
    } else {
      setSelectedPolicyIds(prev => prev.filter(id => id !== policyId))
    }
  }

  const handleSave = async () => {
    try {
      await updatePoliciesMutation.mutateAsync({
        code: plan.code,
        policyIds: selectedPolicyIds
      })
      setOpen(false)
    } catch (error) {
      console.error('Failed to update plan policies:', error)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen && plan.policies) {
      setSelectedPolicyIds(plan.policies.map(p => p.id))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="min-[40rem]:max-w-[32rem]">
        <DialogHeader>
          <DialogTitle>{t('plan.policyManagement')}</DialogTitle>
          <DialogDescription>
            {t('plan.policyManagementDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t('plan.availablePolicies')}</span>
            <Badge variant="secondary">
              {selectedPolicyIds.length} {t('plan.policies').toLowerCase()}
            </Badge>
          </div>

          {isPoliciesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner className="h-6 w-6 text-muted-foreground" />
            </div>
          ) : (
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-3">
                {allPolicies?.map((policy) => (
                  <div
                    key={policy.vacation_policy_id}
                    className="flex items-start space-x-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      id={`policy-${policy.vacation_policy_id}`}
                      checked={selectedPolicyIds.includes(policy.vacation_policy_id)}
                      onCheckedChange={(checked) =>
                        handlePolicyToggle(policy.vacation_policy_id, checked as boolean)
                      }
                    />
                    <div className="flex-1 space-y-1">
                      <label
                        htmlFor={`policy-${policy.vacation_policy_id}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {policy.vacation_policy_name}
                      </label>
                      {policy.vacation_policy_desc && (
                        <p className="text-xs text-muted-foreground">
                          {policy.vacation_policy_desc}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {policy.grant_method}
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          {policy.vacation_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}

                {(!allPolicies || allPolicies.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {t('policy.noPolicies')}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            {tc('cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={updatePoliciesMutation.isPending}
          >
            {updatePoliciesMutation.isPending ? tc('saving') : t('plan.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { VacationPlanPolicyDialog }
