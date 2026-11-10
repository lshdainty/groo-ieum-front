import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ds/card';
import { EmptyProfile } from '@/features/user-profile/ui/EmptyProfile';
import { UserInfoContent } from '@/features/user-profile/ui/UserInfoContent';
import { GetUsersResp } from '@/entities/user';
import { useTranslation } from 'react-i18next';

interface UserInfoCardProps {
  title?: string;
  value: GetUsersResp[];
}

const UserInfoCard = ({
  title,
  value: users,
}: UserInfoCardProps) => {
  const { t } = useTranslation('user');
  const displayTitle = title || t('info.title');
  const selectedUser = users[0];

  if (!selectedUser) {
    return (
      <div className='flex flex-col gap-6 h-full'>
        <Card className='h-full min-w-[350px]'>
          <CardHeader>
            <CardTitle>{displayTitle}</CardTitle>
          </CardHeader>
          <CardContent className='flex-1'>
            <EmptyProfile className='h-full' />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-6 h-full'>
      <Card className='h-full min-w-[350px]'>
        <CardHeader>
          <CardTitle>{displayTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <UserInfoContent user={selectedUser} />
        </CardContent>
      </Card>
    </div>
  )
}

export { UserInfoCard };