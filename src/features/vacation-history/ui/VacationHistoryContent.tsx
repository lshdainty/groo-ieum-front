import { Button } from '@/shared/ui/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/shadcn/dropdownMenu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';
import { VacationHistoryEmpty } from '@/features/vacation-history/ui/VacationHistoryEmpty';
import { type GetUserVacationHistoryResp } from '@/entities/vacation';
import { cn } from '@/shared/lib'
import { formatDateTime } from '@/features/vacation-history/lib/formatDateTime'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VacationHistoryContentProps {
  data: GetUserVacationHistoryResp;
  onEdit?: (item: any) => void;
  onDelete?: (id: number) => void;
  showPagination?: boolean;
  rowsPerPage?: number;
  className?: string;
  stickyHeader?: boolean;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
};

const VacationHistoryContent = ({
  data,
  onEdit,
  onDelete,
  showPagination = true,
  rowsPerPage = 5,
  className,
  stickyHeader = false
}: VacationHistoryContentProps) => {
  const { t } = useTranslation('vacation');
  const { t: tc } = useTranslation('common');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('usages');

  const grants = data?.grants || [];
  const usages = data?.usages || [];

  const currentData = activeTab === 'grants' ? grants : usages;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const totalPages = currentData.length > 0 ? Math.ceil(currentData.length / rowsPerPage) : 1;
  const paginatedData = showPagination
    ? currentData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : currentData;

  return (
    <div className={cn('w-full', className, stickyHeader && 'flex flex-col h-full overflow-hidden')}>
      <Tabs defaultValue="usages" className={cn('w-full', stickyHeader && 'flex flex-col h-full')} onValueChange={setActiveTab}>
        <div className={cn(stickyHeader && 'shrink-0 p-4 pb-0')}>
          <TabsList>
            <TabsTrigger value="usages">{t('history.usageTab')}</TabsTrigger>
            <TabsTrigger value="grants">{t('history.grantTab')}</TabsTrigger>
          </TabsList>
        </div>

        <div className={cn('mt-4 overflow-x-auto relative min-h-[300px]', stickyHeader && 'flex-1 overflow-auto mt-0 pt-4')}>
          <TabsContent value="usages" className={stickyHeader ? 'h-full' : undefined}>
            {usages.length === 0 ? (
              <div className="h-full flex items-center justify-center min-h-[200px]">
                <VacationHistoryEmpty type="usage" />
              </div>
            ) : (
            <Table className='min-w-[800px]' wrapperClassName={stickyHeader ? 'h-full overflow-auto' : undefined}>
              <TableHeader className={stickyHeader ? 'sticky top-0 bg-background z-10' : undefined}>
                <TableRow>
                  <TableHead className='min-w-[200px] pl-4'>{t('history.usagePeriod')}</TableHead>
                  <TableHead className='min-w-[150px]'>{t('history.vacationType')}</TableHead>
                  <TableHead className='min-w-[100px]'>{t('history.usageTime')}</TableHead>
                  <TableHead className='min-w-[300px]'>{t('history.content')}</TableHead>
                  <TableHead className='min-w-[80px] pr-4'></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item: any) => (
                    <TableRow
                      key={item.vacation_usage_id}
                      className={cn(
                        'hover:bg-muted/50 hover:text-foreground',
                        'dark:hover:bg-muted/80 dark:hover:text-foreground',
                        'h-16'
                      )}
                    >
                      <TableCell className='pl-4'>
                        {formatDateTime(item.start_date)} ~ {formatDateTime(item.end_date)}
                      </TableCell>
                      <TableCell>
                        {item.vacation_time_type_name}
                      </TableCell>
                      <TableCell>
                        {item.used_time_str}
                      </TableCell>
                      <TableCell>
                        <div className='max-w-[300px]'>
                          <p className='font-medium truncate'>{item.vacation_usage_desc}</p>
                        </div>
                      </TableCell>
                      <TableCell className='pr-4'>
                        {(onEdit || onDelete) && (
                          <div className='flex justify-end'>
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='sm'
                                  className='h-8 w-8 p-0 data-[state=open]:bg-muted hover:bg-muted'
                                >
                                  <EllipsisVertical className='w-4 h-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end' className='w-32'>
                                {onEdit && (
                                  <DropdownMenuItem onClick={() => onEdit(item)}>
                                    <Pencil className='h-4 w-4' />
                                    <span>{tc('edit')}</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {onDelete && (
                                  <DropdownMenuItem
                                    className='text-destructive focus:text-destructive hover:!bg-destructive/20'
                                    onClick={() => onDelete(item.vacation_usage_id)}
                                  >
                                    <Trash2 className='h-4 w-4' />
                                    <span>{tc('delete')}</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            )}
          </TabsContent>

          <TabsContent value="grants" className={stickyHeader ? 'h-full' : undefined}>
            {grants.length === 0 ? (
              <div className="h-full flex items-center justify-center min-h-[200px]">
                <VacationHistoryEmpty type="grant" />
              </div>
            ) : (
            <Table className='min-w-[800px]' wrapperClassName={stickyHeader ? 'h-full overflow-auto' : undefined}>
              <TableHeader className={stickyHeader ? 'sticky top-0 bg-background z-10' : undefined}>
                <TableRow>
                  <TableHead className='min-w-[150px] pl-4'>{t('history.vacationType')}</TableHead>
                  <TableHead className='min-w-[250px]'>{t('history.content')}</TableHead>
                  <TableHead className='min-w-[100px]'>{t('history.grantTime')}</TableHead>
                  <TableHead className='min-w-[100px]'>{t('history.remainTime')}</TableHead>
                  <TableHead className='min-w-[150px]'>{t('history.grantDate')}</TableHead>
                  <TableHead className='min-w-[150px]'>{t('history.expiryDate')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item: any) => (
                    <TableRow
                      key={item.vacation_grant_id}
                      className={cn(
                        'hover:bg-muted/50 hover:text-foreground',
                        'dark:hover:bg-muted/80 dark:hover:text-foreground',
                        'h-16'
                      )}
                    >
                      <TableCell className='pl-4'>
                        {item.vacation_type_name}
                      </TableCell>
                      <TableCell>
                        <div className='max-w-[250px]'>
                          <p className='font-medium truncate'>{item.vacation_grant_desc}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.grant_time_str}
                      </TableCell>
                      <TableCell>
                        {item.remain_time_str}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.grant_date)}
                      </TableCell>
                      <TableCell>
                        {formatDate(item.expiry_date)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            )}
          </TabsContent>
        </div>

        {showPagination && (
          <div className='flex items-center justify-between p-4 border-t'>
            <div className='text-sm text-muted-foreground'>
              {currentData.length} row(s)
            </div>
            <div className='flex items-center space-x-6 min-[64rem]:space-x-8'>
              <div className='flex items-center space-x-2'>
                <p className='text-sm font-medium'>
                  Page {currentPage} of {totalPages}
                </p>
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1}
                >
                  <span className='sr-only'>Go to first page</span>
                  <ChevronsLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                >
                  <span className='sr-only'>Go to previous page</span>
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  <span className='sr-only'>Go to next page</span>
                  <ChevronRight className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  className='h-8 w-8 p-0'
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages}
                >
                  <span className='sr-only'>Go to last page</span>
                  <ChevronsRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
};

export { VacationHistoryContent }
