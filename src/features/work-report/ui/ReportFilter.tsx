import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent } from '@/shared/ui/shadcn/card';
import {
  Collapsible,
  CollapsibleContent
} from '@/shared/ui/shadcn/collapsible';
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { GetUsersResp } from '@/entities/user';
import { WorkCodeResp, WorkGroupWithParts } from '@/entities/work';
import dayjs from 'dayjs';
import {
  Search,
  X
} from 'lucide-react';



import { useReportContext } from '@/features/work-report/model/ReportContext';
import { useTranslation } from 'react-i18next';

interface ReportFilterProps {
  workGroups: WorkGroupWithParts[];
  workDivision: WorkCodeResp[];
  users: GetUsersResp[];
}

const ReportFilter = ({
  workGroups,
  workDivision,
  users,
}: ReportFilterProps) => {
  const { t } = useTranslation('work');
  const { t: tc } = useTranslation('common');
  const {
    isFilterOpen,
    setIsFilterOpen,
    activeFiltersCount,
    handleResetFilters,
    filters,
    handleFilterChange: onFilterChange,
    handleSearch,
  } = useReportContext();
  // 선택된 업무 분류에 따른 업무 파트 목록
  const currentWorkParts = filters.selectedWorkGroup !== 'all'
    ? workGroups.find(g => g.work_code === filters.selectedWorkGroup)?.labels.flatMap(l => l.parts) || []
    : [];

  return (
    <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <CollapsibleContent>
        <Card className='shadow-sm bg-muted/10'>
          <CardContent className='pt-6 pb-6'>
            <div className='space-y-6'>
              {/* 필터 헤더 */}
              <div className='flex items-center justify-between pb-2 border-b border-border/50'>
                <div className='flex items-center gap-2'>
                  <h3 className='text-sm font-semibold text-foreground/80'>{t('report.filterTitle')}</h3>
                  {activeFiltersCount > 0 && (
                    <Badge variant='secondary' className='text-xs font-normal'>
                      {t('report.filtersApplied', { count: activeFiltersCount })}
                    </Badge>
                  )}
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleResetFilters}
                  disabled={activeFiltersCount === 0}
                  className='h-8 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors'
                >
                  <X className='w-3 h-3 mr-1' />
                  {t('report.reset')}
                </Button>
              </div>

              <div className='grid grid-cols-1 min-[40rem]:grid-cols-2 min-[64rem]:grid-cols-4 min-[80rem]:grid-cols-8 gap-4 items-end'>
                {/* 시작 날짜 */}
                <div className='space-y-2'>
                  <Label htmlFor='start-date' className='text-xs text-muted-foreground'>
                    {t('report.startDate')}
                  </Label>
                  <InputDatePicker
                    id='start-date'
                    value={filters.startDate ? dayjs(filters.startDate).format('YYYY-MM-DD') : ''}
                    onSelect={(date) => onFilterChange('startDate', date)}
                    placeholder={t('report.selectDate')}
                  />
                </div>

                {/* 종료 날짜 */}
                <div className='space-y-2'>
                  <Label htmlFor='end-date' className='text-xs text-muted-foreground'>
                    {t('report.endDate')}
                  </Label>
                  <InputDatePicker
                    id='end-date'
                    value={filters.endDate ? dayjs(filters.endDate).format('YYYY-MM-DD') : ''}
                    onSelect={(date) => onFilterChange('endDate', date)}
                    placeholder={t('report.selectDate')}
                  />
                </div>

                {/* 담당자 */}
        <div className='space-y-2'>
          <Label htmlFor='manager' className='text-xs text-muted-foreground'>{t('report.manager')}</Label>
          <Select
            value={filters.filterName || 'all'}
            onValueChange={(value) => onFilterChange('filterName', value === 'all' ? '' : value)}
          >
            <SelectTrigger id='manager' className='h-9'>
              <SelectValue placeholder={tc('all')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{tc('all')}</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.user_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

                {/* 업무 분류 */}
                <div className='space-y-2'>
                  <Label htmlFor='work-group' className='text-xs text-muted-foreground'>
                    {t('report.fieldWorkGroup')}
                  </Label>
                  <Select
                    value={filters.selectedWorkGroup}
                    onValueChange={(value) => {
                      onFilterChange('selectedWorkGroup', value);
                      onFilterChange('selectedWorkPart', 'all'); // 분류 변경 시 파트 초기화
                    }}
                  >
                    <SelectTrigger id='work-group' className='h-9'>
                      <SelectValue placeholder={tc('all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{tc('all')}</SelectItem>
                      {workGroups.map((group) => (
                        <SelectItem key={group.work_code} value={group.work_code}>
                          {group.work_code_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 업무 파트 */}
                <div className='space-y-2'>
                  <Label htmlFor='work-part' className='text-xs text-muted-foreground'>
                    {t('report.fieldWorkPart')}
                  </Label>
                  <Select
                    value={filters.selectedWorkPart}
                    onValueChange={(value) => onFilterChange('selectedWorkPart', value)}
                    disabled={filters.selectedWorkGroup === 'all'}
                  >
                    <SelectTrigger id='work-part' className='h-9'>
                      <SelectValue placeholder={filters.selectedWorkGroup === 'all' ? '-' : tc('all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{tc('all')}</SelectItem>
                      {currentWorkParts.map((part: WorkCodeResp) => (
                        <SelectItem key={part.work_code} value={part.work_code}>
                          {part.work_code_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 업무 구분 */}
                <div className='space-y-2'>
                  <Label htmlFor='work-division' className='text-xs text-muted-foreground'>
                    {t('report.fieldWorkDivision')}
                  </Label>
                  <Select value={filters.selectedWorkDivision} onValueChange={(value) => onFilterChange('selectedWorkDivision', value)}>
                    <SelectTrigger id='work-division' className='h-9'>
                      <SelectValue placeholder={tc('all')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{tc('all')}</SelectItem>
                      {workDivision.map((division) => (
                        <SelectItem key={division.work_code} value={division.work_code}>
                          {division.work_code_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 정렬 */}
                <div className='space-y-2'>
                  <Label htmlFor='sort-order' className='text-xs text-muted-foreground'>
                    {t('report.sortBy')}
                  </Label>
                  <Select value={filters.sortOrder} onValueChange={(value) => onFilterChange('sortOrder', value)}>
                    <SelectTrigger id='sort-order' className='h-9'>
                      <SelectValue placeholder={t('report.sortSelect')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='latest'>{t('report.latest')}</SelectItem>
                      <SelectItem value='oldest'>{t('report.oldest')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 조회 버튼 */}
                <div className='flex items-end'>
                  <Button onClick={handleSearch} className='w-full h-9'>
                    <Search className='w-4 h-4 mr-2' />
                    {t('report.search')}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}

export { ReportFilter }
