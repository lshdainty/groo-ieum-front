import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import { EmptyWorkDivision } from '@/features/admin-work-code/ui/EmptyWorkDivision';
import { WorkCodeResp, useWorkDivisionLabelsQuery, useWorkDivisionQuery } from '@/entities/work'
import { Edit, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkCodeDeleteDialog } from './WorkCodeDeleteDialog';
import { WorkCodeEditDialog } from './WorkCodeEditDialog';
import { WorkDivisionListSkeleton } from './WorkDivisionListSkeleton';

interface WorkDivisionListInnerProps {
  workDivisions: WorkCodeResp[];
  parentWorkCodeId?: number;
}

const WorkDivisionListInner = ({ workDivisions, parentWorkCodeId }: WorkDivisionListInnerProps) => {
  const { t } = useTranslation('work');
  const [editingCode, setEditingCode] = useState<WorkCodeResp | null>(null);
  const [deletingCode, setDeletingCode] = useState<WorkCodeResp | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleCreate = () => {
    setEditingCode(null);
    setIsEditOpen(true);
  };

  const handleEdit = (code: WorkCodeResp) => {
    setEditingCode(code);
    setIsEditOpen(true);
  };

  const handleDelete = (code: WorkCodeResp) => {
    setDeletingCode(code);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('addWorkDivision')}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">{t('codeName')}</TableHead>
              <TableHead>{t('code')}</TableHead>
              <TableHead>{t('type')}</TableHead>
              <TableHead>{t('order')}</TableHead>
              <TableHead className="text-right">{t('manage')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workDivisions?.map((division) => (
              <TableRow key={division.work_code_id}>
                <TableCell className="font-medium pl-4">
                  {division.work_code_name}
                </TableCell>
                <TableCell>{division.work_code}</TableCell>
                <TableCell>{division.code_type}</TableCell>
                <TableCell>{division.order_seq}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(division)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(division)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <WorkCodeEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        workCode={editingCode}
        parentWorkCodeId={parentWorkCodeId}
        onSuccess={() => {
          // Refetch is handled by React Query invalidation
        }}
      />

      <WorkCodeDeleteDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        workCode={deletingCode}
      />
    </div>
  );
};

const WorkDivisionList = () => {
  const { data: workDivisions, isLoading, error } = useWorkDivisionQuery();
  const { data: divisionLabel } = useWorkDivisionLabelsQuery();

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: workDivisions }}
      loadingComponent={<WorkDivisionListSkeleton />}
      emptyComponent={<EmptyWorkDivision />}
      isEmpty={(data) => !data || data.length === 0}
    >
      <WorkDivisionListInner
        workDivisions={workDivisions || []}
        parentWorkCodeId={divisionLabel?.work_code_id}
      />
    </QueryAsyncBoundary>
  );
};

export { WorkDivisionList };
