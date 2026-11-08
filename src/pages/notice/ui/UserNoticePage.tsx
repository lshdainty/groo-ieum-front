import QueryAsyncBoundary from '@/shared/ui/async-boundary/QueryAsyncBoundary';
import { UserNoticeContent } from '@/features/user-notice/ui/UserNoticeContent';
import { UserNoticeSkeleton } from '@/features/user-notice/ui/UserNoticeSkeleton';
import { useActiveNoticesQuery } from '@/entities/notice';
import { useTranslation } from 'react-i18next';

const UserNoticePage = () => {
  const { t } = useTranslation('common');
  const { isLoading, error, data } = useActiveNoticesQuery(0, 10);

  return (
    <QueryAsyncBoundary
      queryState={{ isLoading, error, data }}
      loadingComponent={<UserNoticeSkeleton />}
      errorComponent={
        <div className="p-4 min-[40rem]:p-6 min-[48rem]:p-8">
          <div className="p-8 text-center text-red-600">
            {t('loadFailed')}
          </div>
        </div>
      }
    >
      <UserNoticeContent />
    </QueryAsyncBoundary>
  );
};

export { UserNoticePage };
