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
import { EmptyWorkCode } from '@/features/admin-work-code/ui/EmptyWorkCode';
import {
  WorkCodeResp,
  WorkGroupWithParts,
  WorkLabelWithParts,
  useWorkGroupsWithPartsQuery,
} from '@/entities/work'
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkCodeDeleteDialog } from './WorkCodeDeleteDialog';
import { WorkCodeEditDialog } from './WorkCodeEditDialog';
import { WorkCodeListSkeleton } from './WorkCodeListSkeleton';

interface WorkCodeListInnerProps {
  workGroups: WorkGroupWithParts[];
}

const WorkCodeListInner = ({ workGroups }: WorkCodeListInnerProps) => {
  const { t } = useTranslation('work');
  const [editingCode, setEditingCode] = useState<WorkCodeResp | null>(null);
  const [deletingCode, setDeletingCode] = useState<WorkCodeResp | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [parentId, setParentId] = useState<number | undefined>(undefined);

  const handleCreate = (parentId?: number) => {
    setEditingCode(null);
    setParentId(parentId);
    setIsEditOpen(true);
  };

  const handleEdit = (code: WorkCodeResp) => {
    setEditingCode(code);
    setParentId(code.parent_work_code_id);
    setIsEditOpen(true);
  };

  const handleDelete = (code: WorkCodeResp) => {
    setDeletingCode(code);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-4">
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
            {workGroups?.map((group) => (
              <Fragment key={`group-${group.work_code_id}`}>
                {/* Group Row (Option) - 최상위 그룹은 + 버튼 없음 */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium pl-4">
                    {group.work_code_name}
                  </TableCell>
                  <TableCell>{group.work_code}</TableCell>
                  <TableCell>{group.code_type}</TableCell>
                  <TableCell>{group.order_seq}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(group)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(group)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {/* Label Rows */}
                {group.labels?.map((label: WorkLabelWithParts) => (
                  <Fragment key={`label-${label.work_code_id}`}>
                    <TableRow className="bg-muted/30">
                      <TableCell className="pl-8">
                        └ {label.work_code_name}
                      </TableCell>
                      <TableCell>{label.work_code}</TableCell>
                      <TableCell>{label.code_type}</TableCell>
                      <TableCell>{label.order_seq}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCreate(label.work_code_id)}
                            title={t('addSubCode')}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(label)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(label)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Parts Rows (Option) */}
                    {label.parts?.map((part: WorkCodeResp) => (
                      <TableRow key={part.work_code_id}>
                        <TableCell className="pl-16">
                          └ {part.work_code_name}
                        </TableCell>
                        <TableCell>{part.work_code}</TableCell>
                        <TableCell>{part.code_type}</TableCell>
                        <TableCell>{part.order_seq}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(part)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(part)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      <WorkCodeEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        workCode={editingCode}
        parentWorkCodeId={parentId}
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

const WorkCodeList = () => {
  const { data: workGroups, isLoading, error } = useWorkGroupsWithPartsQuery();

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data: workGroups }}
      loadingComponent={<WorkCodeListSkeleton />}
      emptyComponent={<EmptyWorkCode />}
      isEmpty={(data) => !data || data.length === 0}
    >
      <WorkCodeListInner workGroups={workGroups || []} />
    </QueryAsyncBoundary>
  );
};

export { WorkCodeList };
