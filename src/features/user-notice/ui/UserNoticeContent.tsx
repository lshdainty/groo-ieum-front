import { Button } from '@/shared/ui/shadcn/button'
import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary'
import { useActiveNoticesQuery } from '@/entities/notice'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { UserNoticeDetailDialog } from './UserNoticeDetailDialog'
import { UserNoticeEmpty } from './UserNoticeEmpty'
import { UserNoticeList } from './UserNoticeList'
import { UserNoticeSkeleton } from './UserNoticeSkeleton'

const PAGE_SIZE = 10

export const UserNoticeContent = () => {
  const { t } = useTranslation(['notice', 'common'])
  const [page, setPage] = useState(0)
  const [selectedNoticeId, setSelectedNoticeId] = useState<number | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const { data: noticesData, isLoading, error } = useActiveNoticesQuery(page, PAGE_SIZE)

  const handleSelectNotice = (noticeId: number) => {
    setSelectedNoticeId(noticeId)
    setIsDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setIsDetailOpen(false)
    setSelectedNoticeId(null)
  }

  const notices = noticesData?.content || []
  const totalPages = noticesData?.totalPages || 0
  const isFirst = noticesData?.first ?? true
  const isLast = noticesData?.last ?? true

  return (
    <div className="p-4 min-[40rem]:p-6 min-[48rem]:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('notice:title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('notice:description')}
        </p>
      </div>

      <QueryAsyncBoundary
        queryState={{ isLoading, error, data: noticesData }}
        loadingComponent={<UserNoticeSkeleton />}
        emptyComponent={<UserNoticeEmpty />}
        isEmpty={(data) => !data?.content || data.content.length === 0}
      >
        <UserNoticeList notices={notices} onSelectNotice={handleSelectNotice} />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={isFirst}
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common:previous')}
            </Button>
            <span className="text-sm text-muted-foreground px-4">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={isLast}
            >
              {t('common:next')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </QueryAsyncBoundary>

      <UserNoticeDetailDialog
        noticeId={selectedNoticeId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
