import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { EmptyPlan } from '@/features/admin-vacation-plan/ui/EmptyPlan';
import { VacationPlanDeleteDialog } from '@/features/admin-vacation-plan/ui/VacationPlanDeleteDialog';
import { VacationPlanFormDialog } from '@/features/admin-vacation-plan/ui/VacationPlanFormDialog';
import { VacationPlanPolicyDialog } from '@/features/admin-vacation-plan/ui/VacationPlanPolicyDialog';
import { type VacationPlanResp } from '@/entities/vacation-plan';
import { FileStack, Pencil, Settings2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VacationPlanListsProps {
  plans: VacationPlanResp[];
  searchQuery?: string;
}

const VacationPlanLists = ({ plans, searchQuery }: VacationPlanListsProps) => {
  const { t } = useTranslation('vacation');

  return (
    <div className="flex flex-col gap-4">
      {plans.map(plan => (
        <Card key={plan.id} className="transition-all hover:shadow-md py-0">
          <CardContent className="p-4 min-[40rem]:px-6">
            <div className="flex flex-col min-[40rem]:flex-row min-[40rem]:items-start min-[40rem]:justify-between gap-4">
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex flex-col min-[40rem]:flex-row min-[40rem]:items-center gap-2 min-[40rem]:gap-3">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <Badge variant="outline" className="text-xs w-fit">
                    {plan.code}
                  </Badge>
                </div>
                {plan.desc && (
                  <p className="text-muted-foreground text-sm">{plan.desc}</p>
                )}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileStack className="h-4 w-4" />
                    <span>
                      {plan.policies && plan.policies.length > 0
                        ? t('plan.policyCount', { count: plan.policies.length })
                        : t('plan.noPolicies')}
                    </span>
                  </div>
                </div>
                {plan.policies && plan.policies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {plan.policies.slice(0, 5).map(policy => (
                      <Badge key={policy.id} variant="secondary" className="text-xs">
                        {policy.name}
                      </Badge>
                    ))}
                    {plan.policies.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        +{plan.policies.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 self-end min-[40rem]:self-auto">
                <VacationPlanPolicyDialog
                  plan={plan}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  }
                />
                <VacationPlanFormDialog
                  isEditing
                  plan={plan}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  }
                />
                <VacationPlanDeleteDialog
                  plan={plan}
                  trigger={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {plans.length === 0 && (
        <Card>
          <CardContent className="p-0">
            <EmptyPlan isSearchResult={!!searchQuery} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { VacationPlanLists };
