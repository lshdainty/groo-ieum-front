import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Skeleton } from '@/shared/ui/shadcn/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/shadcn/table';
import { cn } from '@/shared/lib'
import { useTranslation } from 'react-i18next';

const DuesTableSkeleton = () => {
  const { t } = useTranslation('culture');

  return (
    <Card className='flex-1'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle>
            <Skeleton className='h-6 w-24' />
          </CardTitle>
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-12' />
            <Skeleton className='h-8 w-12' />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto'>
          <Table className='min-w-[1000px]'>
            <TableHeader>
              <TableRow>
                <TableHead className='min-w-[140px] pl-4'>{t('dues.tableDate')}</TableHead>
                <TableHead className='min-w-[120px]'>{t('dues.tableName')}</TableHead>
                <TableHead className='min-w-[250px]'>{t('dues.tableContent')}</TableHead>
                <TableHead className='min-w-[140px]'>{t('dues.tableAmount')}</TableHead>
                <TableHead className='min-w-[100px]'>{t('dues.tableType')}</TableHead>
                <TableHead className='min-w-[140px]'>{t('dues.tableTotal')}</TableHead>
                <TableHead className='min-w-[80px] pr-4'></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array(5).fill(0).map((_, i) => (
                <TableRow
                  key={i}
                  className={cn(
                    'hover:bg-muted/50 hover:text-foreground',
                    'dark:hover:bg-muted/80 dark:hover:text-foreground'
                  )}
                >
                  <TableCell className='pl-4'>
                    <Skeleton className='h-4 w-20' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-16' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-32' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-20' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-5 w-12 rounded-full' />
                  </TableCell>
                  <TableCell>
                    <Skeleton className='h-4 w-20' />
                  </TableCell>
                  <TableCell className='pr-4'>
                    <div className='flex justify-end'>
                      <Skeleton className='h-8 w-8 rounded' />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className='flex items-center justify-between p-4'>
          <div className='text-sm text-muted-foreground'>
            <Skeleton className='h-4 w-16' />
          </div>
          <div className='flex items-center space-x-6 min-[64rem]:space-x-8'>
            <div className='flex items-center space-x-2'>
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='flex items-center space-x-2'>
              <Skeleton className='h-8 w-8 rounded' />
              <Skeleton className='h-8 w-8 rounded' />
              <Skeleton className='h-8 w-8 rounded' />
              <Skeleton className='h-8 w-8 rounded' />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export { DuesTableSkeleton };