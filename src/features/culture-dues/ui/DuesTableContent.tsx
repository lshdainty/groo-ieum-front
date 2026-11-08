import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/shared/ui/shadcn/dropdownMenu';
import { Empty, EmptyDescription, EmptyIcon, EmptyTitle } from '@/shared/ui/shadcn/empty';
import { Input } from '@/shared/ui/shadcn/input';
import { InputDatePicker } from '@/shared/ui/shadcn/inputDatePicker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/table';
import { GetYearDuesResp } from '@/entities/dues';
import { cn } from '@/shared/lib'
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy, EllipsisVertical, Pencil, Receipt, Save, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type EditableDuesData = GetYearDuesResp & { id: string; isNew?: boolean; tempId?: string };

interface DuesTableContentProps {
  data: EditableDuesData[];
  currentPage: number;
  onPageChange: (page: number) => void;
  rowsPerPage?: number;
  showPagination?: boolean;
  editingRow?: string | null;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onCopy?: (row: EditableDuesData) => void;
  onSaveRow?: (id: string) => void;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>, id: string, field: keyof GetYearDuesResp) => void;
  onSelectChange?: (value: string, id: string, field: keyof GetYearDuesResp) => void;
  onDateChange?: (value: string | undefined, id: string) => void;
  className?: string;
  stickyHeader?: boolean;
}

const DuesTableContent = ({
  data,
  currentPage,
  onPageChange,
  rowsPerPage = 5,
  showPagination = true,
  editingRow,
  onEdit,
  onDelete,
  onCopy,
  onSaveRow,
  onInputChange,
  onSelectChange,
  onDateChange,
  className,
  stickyHeader = false
}: DuesTableContentProps) => {
  const { t } = useTranslation('culture');
  const { t: tc } = useTranslation('common');
  const totalPages = data.length > 0 ? Math.ceil(data.length / rowsPerPage) : 1;
  const paginatedData = showPagination
    ? data.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
    : data;

  if (data.length === 0) {
    return (
      <div className={cn('w-full h-full flex items-center justify-center min-h-[200px]', className)}>
        <Empty>
          <EmptyIcon>
            <Receipt />
          </EmptyIcon>
          <EmptyTitle>{t('dues.noDataTitle')}</EmptyTitle>
          <EmptyDescription>
            {t('dues.noDataDescription')}
          </EmptyDescription>
        </Empty>
      </div>
    )
  }

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('overflow-x-auto', stickyHeader && 'h-full')}>
        <Table className='min-w-[1000px]' wrapperClassName={stickyHeader ? 'h-full overflow-auto' : undefined}>
          <TableHeader className={stickyHeader ? 'sticky top-0 bg-background z-10' : undefined}>
            <TableRow>
              <TableHead className='min-w-[140px] pl-4'>{t('dues.tableDate')}</TableHead>
              <TableHead className='min-w-[120px]'>{t('dues.tableName')}</TableHead>
              <TableHead className='min-w-[120px]'>{t('dues.tableCategory')}</TableHead>
              <TableHead className='min-w-[200px]'>{t('dues.tableContent')}</TableHead>
              <TableHead className='min-w-[140px]'>{t('dues.tableAmount')}</TableHead>
              <TableHead className='min-w-[100px]'>{t('dues.tableType')}</TableHead>
              <TableHead className='min-w-[140px]'>{t('dues.tableTotal')}</TableHead>
              <TableHead className='min-w-[80px] pr-4'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row) => {
              const isEditing = editingRow === row.id;
              return (
                <TableRow
                  key={row.id}
                  className={cn(
                    'hover:bg-muted/50 hover:text-foreground',
                    'dark:hover:bg-muted/80 dark:hover:text-foreground'
                  )}
                >
                  <TableCell className='pl-4'>
                    {isEditing && onDateChange ? (
                      <InputDatePicker
                        value={dayjs(row.dues_date).format('YYYY-MM-DD')}
                        onValueChange={(value) => onDateChange(value, row.id)}
                      />
                    ) : (
                      dayjs(row.dues_date).format('YYYY-MM-DD')
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && onInputChange ? (
                      <Input
                        value={row.dues_user_name}
                        onChange={(e) => onInputChange(e, row.id, 'dues_user_name')}
                      />
                    ) : (
                      row.dues_user_name
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && onSelectChange ? (
                      <Select
                        value={row.dues_type}
                        onValueChange={(value) => onSelectChange(value, row.id, 'dues_type')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('dues.typeSelect')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='OPERATION'>{t('dues.typeOperation')}</SelectItem>
                          <SelectItem value='BIRTH'>{t('dues.typeBirth')}</SelectItem>
                          <SelectItem value='FINE'>{t('dues.typeFine')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className='text-xs whitespace-nowrap'>
                        {row.dues_type === 'OPERATION' ? t('dues.typeOperation') : row.dues_type === 'BIRTH' ? t('dues.typeBirth') : t('dues.typeFine')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && onInputChange ? (
                      <Input
                        value={row.dues_detail}
                        onChange={(e) => onInputChange(e, row.id, 'dues_detail')}
                      />
                    ) : (
                      <div>
                        <p className='font-medium'>{row.dues_detail}</p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className={cn(row.dues_calc === 'PLUS' ? 'text-blue-500' : 'text-red-500')}>
                    {isEditing && onInputChange ? (
                      <Input
                        type='number'
                        value={row.dues_amount}
                        onChange={(e) => onInputChange(e, row.id, 'dues_amount')}
                      />
                    ) : (
                      `${Math.abs(row.dues_amount).toLocaleString('ko-KR')}원`
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing && onSelectChange ? (
                      <Select
                        value={row.dues_calc}
                        onValueChange={(value) => onSelectChange(value, row.id, 'dues_calc')}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('dues.calcTypeSelect')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='PLUS'>{t('dues.calcPlus')}</SelectItem>
                          <SelectItem value='MINUS'>{t('dues.calcMinus')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={cn(
                        'text-xs whitespace-nowrap',
                        row.dues_calc === 'PLUS'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      )}>
                        {row.dues_calc === 'PLUS' ? t('dues.calcPlus') : t('dues.calcMinus')}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className='font-medium whitespace-nowrap'>
                      {row.total_dues.toLocaleString('ko-KR')}원
                    </span>
                  </TableCell>
                  <TableCell className='pr-4'>
                    {(onEdit || onDelete || onCopy) && (
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
                            {isEditing ? (
                              <DropdownMenuItem onClick={() => onSaveRow?.(row.id)}>
                                <Save className='h-4 w-4' />
                                <span>{tc('save')}</span>
                              </DropdownMenuItem>
                            ) : (
                              onEdit && (
                                <DropdownMenuItem onClick={() => onEdit(row.id)}>
                                  <Pencil className='h-4 w-4' />
                                  <span>{tc('edit')}</span>
                                </DropdownMenuItem>
                              )
                            )}
                            {onCopy && (
                              <DropdownMenuItem onClick={() => onCopy(row)}>
                                <Copy className='h-4 w-4' />
                                <span>{tc('copy')}</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {onDelete && (
                              <DropdownMenuItem
                                className='text-destructive focus:text-destructive hover:!bg-destructive/20'
                                onClick={() => onDelete(row.id)}
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
              )
            })}
          </TableBody>
        </Table>
      </div>
      {showPagination && (
        <div className='flex items-center justify-between p-4'>
          <div className='text-sm text-muted-foreground'>
            {data.length} row(s)
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
                onClick={() => onPageChange(1)}
                disabled={currentPage <= 1}
              >
                <span className='sr-only'>Go to first page</span>
                <ChevronsLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                className='h-8 w-8 p-0'
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
              >
                <span className='sr-only'>Go to previous page</span>
                <ChevronLeft className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                className='h-8 w-8 p-0'
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <span className='sr-only'>Go to next page</span>
                <ChevronRight className='h-4 w-4' />
              </Button>
              <Button
                variant='outline'
                className='h-8 w-8 p-0'
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage >= totalPages}
              >
                <span className='sr-only'>Go to last page</span>
                <ChevronsRight className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { DuesTableContent };
