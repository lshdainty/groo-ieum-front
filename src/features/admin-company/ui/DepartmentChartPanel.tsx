import { Tree, TreeNode } from 'react-organizational-chart'

import { Building2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { ResultSection } from '@/shared/ds/result-section'
import { Skeleton } from '@/shared/ds/skeleton'
import { chartColorVar, childrenOf, deptChartColor, type Dept } from '../lib/dept-tree'

/**
 * 조직도 한 상자(D 22) — bg-layer-default · 1px stroke-neutral-weak · 모서리 r3 · 위 3px 부서 색 줄(`chart-{색}`).
 * 색이 없는 부서(옛 빈 값 · 팔레트 밖)는 중립 회색으로 그린다 — 저장 값은 바꾸지 않는다. 이름 t4 700, 설명 t3 fg-neutral-subtle(두 줄까지).
 */
function OrgBox({ dept }: { dept: Dept }) {
  return (
    <div className='flex items-center justify-center'>
      <div
        data-org-box
        className='relative w-[184px] overflow-hidden rounded-r3 border border-solid border-stroke-neutral-weak bg-bg-layer-default text-start'
      >
        <div aria-hidden className='h-[3px] w-full' style={{ backgroundColor: chartColorVar(deptChartColor(dept.color_code)) }} />
        <div className='flex flex-col gap-x1 px-x3 py-x3'>
          <h3 className='m-0 break-keep text-t4 font-bold text-fg-neutral [overflow-wrap:break-word]'>{dept.department_name_kr}</h3>
          {dept.department_desc && (
            <p className='m-0 line-clamp-2 break-keep text-t3 text-fg-neutral-subtle [overflow-wrap:break-word]'>{dept.department_desc}</p>
          )}
        </div>
      </div>
    </div>
  )
}

const renderNode = (node: Dept) => (
  <TreeNode key={node.department_id} label={<OrgBox dept={node} />}>
    {childrenOf(node).map(renderNode)}
  </TreeNode>
)

/**
 * 조직도 그림(D 22) — 회사 전체를 그린다(고른 부서와 무관). **카드 밖 틀(머리 · 테두리 · 바탕) 없이 그림만** 넘긴다 —
 * 머리는 담는 쪽(회사 관리 패널 · 홈 위젯 카드)이 그리고, 넘치면 담는 쪽이 가로 · 세로로 스크롤한다.
 */
export function DepartmentChartPanel({ departments }: { departments: Dept[] }) {
  const root = departments[0]
  if (!root) return <ChartEmpty />
  return (
    <div className='inline-block min-w-max p-x6' data-org-chart>
      <Tree
        lineWidth='1px'
        lineColor='var(--color-stroke-neutral-subtle)'
        lineBorderRadius='8px'
        nodePadding='8px'
        label={<OrgBox dept={root} />}
      >
        {childrenOf(root).map(renderNode)}
      </Tree>
    </div>
  )
}

/** 부서가 하나도 없을 때 — 빈 상자 대신 안내(홈 조직도 위젯도 같다) */
function ChartEmpty() {
  const { t } = useTranslation('admin')
  return <ResultSection size='medium' icon={<Building2 />} title={t('department.noDepartments')} />
}

/** 조직도 자리 — 상자 셋 */
export function ChartSkeleton() {
  return (
    <div className='flex flex-col items-center gap-x6 p-x6' aria-hidden>
      <Skeleton radius='12' className='block h-[64px] w-[184px]' />
      <div className='flex gap-x4'>
        <Skeleton radius='12' className='block h-[64px] w-[184px]' />
        <Skeleton radius='12' className='block h-[64px] w-[184px]' />
      </div>
    </div>
  )
}
