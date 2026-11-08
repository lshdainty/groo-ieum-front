import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import { Button } from '@/shared/ui/shadcn/button'
import { Input } from '@/shared/ui/shadcn/input'
import { useUser } from '@/entities/session'
import { EmptyNotice } from '@/features/admin-notice/ui/EmptyNotice'
import { NoticeEditDialog } from '@/features/admin-notice/ui/NoticeEditDialog'
import { NoticeList } from '@/features/admin-notice/ui/NoticeList'
import { NoticeListSkeleton } from '@/features/admin-notice/ui/NoticeListSkeleton'
import { useNoticeContext } from '@/features/admin-notice/model/NoticeContext'
import {
  useCreateNoticeMutation,
  useDeleteNoticeMutation,
  useNoticesQuery,
  useSearchNoticesQuery,
  useUpdateNoticeMutation,
  type CreateNoticeReq,
  type NoticeListResp,
  type UpdateNoticeReq,
} from '@/entities/notice'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

const NoticeContent = () => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  const { isDialogOpen, setIsDialogOpen, editingNotice, setEditingNotice } = useNoticeContext()
  const { loginUser } = useUser()

  const [page, setPage] = useState(0)
  const [size] = useState(10)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const { data: noticesData, isLoading, error, refetch } = searchKeyword
    ? useSearchNoticesQuery(searchKeyword, page, size)
    : useNoticesQuery(page, size)

  const createMutation = useCreateNoticeMutation()
  const updateMutation = useUpdateNoticeMutation()
  const deleteMutation = useDeleteNoticeMutation()

  const handleSave = (data: CreateNoticeReq) => {
    const payload = {
      ...data,
      writer_id: loginUser?.user_id || '',
    }

    if (editingNotice) {
      const updateData: UpdateNoticeReq = {
        title: payload.title,
        content: payload.content,
        notice_type: payload.notice_type,
        is_pinned: payload.is_pinned,
        start_date: payload.start_date,
        end_date: payload.end_date,
      }
      updateMutation.mutate({ noticeId: editingNotice.notice_id, data: updateData }, {
        onSuccess: () => {
          refetch()
          setIsDialogOpen(false)
        }
      })
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          refetch()
          setIsDialogOpen(false)
        }
      })
    }
  }

  const handleEdit = (notice: NoticeListResp) => {
    setEditingNotice(notice)
    setIsDialogOpen(true)
  }

  const handleDelete = (noticeId: number) => {
    deleteMutation.mutate(noticeId, {
      onSuccess: () => {
        refetch()
      }
    })
  }

  const handleAddClick = () => {
    setEditingNotice(null)
    setIsDialogOpen(true)
  }

  const handleSearch = () => {
    setSearchKeyword(searchInput)
    setPage(0)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleClearSearch = () => {
    setSearchInput('')
    setSearchKeyword('')
    setPage(0)
  }

  const totalPages = noticesData?.totalPages || 0

  return (
    <div className='flex w-full h-full p-4 min-[40rem]:p-6 md:p-8'>
      <div className='w-full flex flex-col h-full'>
        <div className='flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 shrink-0'>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-card-foreground'>{t('notice.title')}</h1>
            <p className='text-sm md:text-base text-muted-foreground mt-1'>{t('notice.description')}</p>
          </div>

          <div className='flex items-center gap-2'>
            <NoticeEditDialog
              isOpen={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              editingNotice={editingNotice}
              onSave={handleSave}
              isPending={createMutation.isPending || updateMutation.isPending}
              trigger={
                <Button className='flex items-center gap-2 shrink-0' onClick={handleAddClick}>
                  {tc('add')}
                </Button>
              }
            />
          </div>
        </div>

        <div className='flex items-center gap-2 mb-4 shrink-0'>
          <div className='relative flex-1 max-w-[24rem]'>
            <Input
              placeholder={t('notice.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className='pr-10'
            />
            <Button
              variant='ghost'
              size='sm'
              className='absolute right-0 top-0 h-full px-3'
              onClick={handleSearch}
            >
              <Search className='h-4 w-4' />
            </Button>
          </div>
          {searchKeyword && (
            <Button variant='outline' size='sm' onClick={handleClearSearch}>
              {tc('clear')}
            </Button>
          )}
        </div>

        <div className='flex-1 min-h-0'>
          <QueryAsyncBoundary
            queryState={{ isLoading, error, data: noticesData }}
            loadingComponent={<NoticeListSkeleton />}
            emptyComponent={<EmptyNotice onAddClick={handleAddClick} className="h-full flex items-center justify-center" />}
            isEmpty={(data) => !data?.content || data.content.length === 0}
          >
            <NoticeList
              notices={noticesData?.content}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            {totalPages > 1 && (
              <div className='flex justify-center items-center gap-2 mt-6'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  {tc('previous')}
                </Button>
                <span className='text-sm text-muted-foreground'>
                  {page + 1} / {totalPages}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  {tc('next')}
                </Button>
              </div>
            )}
          </QueryAsyncBoundary>
        </div>
      </div>
    </div>
  )
}

export { NoticeContent }
