import { Skeleton } from '@/shared/ds/skeleton'
import { useCompanyQuery, useCompanyWithDepartmentsQuery } from '@/entities/company'
import { DepartmentChartPanel } from '@/features/admin-company/ui/DepartmentChartPanel'
import { WidgetBoundary } from '@/features/dashboard/ui/WidgetResults'
import { WidgetFrame } from '@/features/dashboard/ui/WidgetFrame'

/** 조직도(D 34) — 회사 관리의 조직도 부품을 카드에 담는다(주인 지시서 I-24 대기). 넓으면 카드 안에서 가로로 스크롤한다 */
export const DepartmentChartWidget = () => {
  const company = useCompanyQuery({ quiet: true })
  const companyId = company.data?.company_id || ''
  const departments = useCompanyWithDepartmentsQuery(companyId, { quiet: true })
  // 회사를 받은 뒤에야 부서 질의가 켜진다 — 회사가 실패하면 회사 질의만, 아니면 둘 다
  const queries = company.data ? [company, departments] : [company]

  return (
    <WidgetFrame id='department-chart'>
      <WidgetBoundary id='department-chart' queries={queries} fallback={<Skeleton radius='12' className='block h-[240px] w-full' />}>
        <div className='overflow-x-auto'>
          <DepartmentChartPanel departments={departments.data?.departments ?? []} showHeader={false} />
        </div>
      </WidgetBoundary>
    </WidgetFrame>
  )
}
