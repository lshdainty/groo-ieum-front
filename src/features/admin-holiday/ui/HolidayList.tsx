import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Card, CardContent } from '@/shared/ui/shadcn/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/shadcn/dropdownMenu';
import { EmptyHoliday } from '@/features/admin-holiday/ui/EmptyHoliday';
import { HolidayDeleteDialog } from '@/features/admin-holiday/ui/HolidayDeleteDialog';
import { type GetHolidaysResp } from '@/entities/holiday';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const holidayTypeColors = {
  PUBLIC: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
  ETC: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600',
  SUBSTITUTE: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-800',
};

interface HolidayListProps {
  holidays?: GetHolidaysResp[];
  onEdit: (holiday: GetHolidaysResp) => void;
  onDelete: (holiday_id: number) => Promise<unknown> | void;
  onAddClick: () => void;
}

const HolidayList = ({
  holidays,
  onEdit,
  onDelete,
  onAddClick
}: HolidayListProps) => {
  const { t } = useTranslation('admin');
  const { t: tc } = useTranslation('common');

  const holidayTypeLabels: { [key: string]: string } = {
    PUBLIC: t('holiday.typePublic'),
    ETC: t('holiday.typeEtc'),
    SUBSTITUTE: t('holiday.typeSubstitute'),
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  const formatLunarDate = (lunarDate: string) => {
    if (!lunarDate) return '';
    const date = new Date(lunarDate);
    return t('holiday.lunarDateFormat', { month: date.getMonth() + 1, day: date.getDate() });
  };

  return (
    <div className='grid gap-4'>
      {holidays?.map((holiday) => (
        <Card key={holiday.holiday_id} className='hover:shadow-md transition-shadow'>
          <CardContent className='px-6'>
            <div className='flex flex-col min-[40rem]:flex-row items-start min-[40rem]:items-center justify-between gap-4'>
              <div className='flex items-center gap-4'>
                <div className='text-3xl'>{(holiday.holiday_icon && holiday.holiday_icon.trim() !== '') ? holiday.holiday_icon : 'ㅤ'}</div>
                <div>
                  <h3 className='text-xl font-semibold text-card-foreground'>
                    {holiday.holiday_name}
                  </h3>
                  <div className='flex items-center gap-2 mt-2'>
                    <p className='text-card-foreground/70'>
                      {formatDate(holiday.holiday_date)}
                    </p>
                    {holiday.lunar_yn === 'Y' && holiday.lunar_date && (
                      <>
                        <span className='text-card-foreground/50'>•</span>
                        <p className='text-sm text-card-foreground/60'>
                          {formatLunarDate(holiday.lunar_date)}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2 w-full min-[40rem]:w-auto'>
                <Badge className={holidayTypeColors[holiday.holiday_type as keyof typeof holidayTypeColors]}>
                  {holidayTypeLabels[holiday.holiday_type as keyof typeof holidayTypeLabels]}
                </Badge>
                {holiday.lunar_yn === 'Y' && (
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-800">
                    {t('holiday.lunar')}
                  </Badge>
                )}
                {holiday.is_recurring === 'Y' && (
                  <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800">
                    {t('holiday.recurring')}
                  </Badge>
                )}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-muted ml-auto min-[40rem]:ml-0'
                    >
                      <EllipsisVertical className='w-4 h-4' />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end' className='w-32'>
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        onEdit(holiday);
                      }}
                    >
                      <Pencil className='h-4 w-4' />
                      <span>{tc('edit')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <HolidayDeleteDialog
                      holiday={holiday}
                      onDelete={onDelete}
                      trigger={
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className='text-destructive focus:text-destructive hover:!bg-destructive/20'
                        >
                          <Trash2 className='h-4 w-4' />
                          <span>{tc('delete')}</span>
                        </DropdownMenuItem>
                      }
                    />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      {(!holidays || holidays.length === 0) && (
        <Card>
          <CardContent className="p-0">
            <EmptyHoliday onAddClick={onAddClick} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export { HolidayList }