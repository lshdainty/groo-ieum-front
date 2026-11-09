import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/shadcn/select';
import { EmptyProfile } from '@/features/user-profile/ui/EmptyProfile';
import { UserInfoContent } from '@/features/user-profile/ui/UserInfoContent';
import { GetUsersResp } from '@/entities/user';
import { useTranslation } from 'react-i18next';

interface UserInfoCardProps {
  title?: string;
  value: GetUsersResp[];
  selectedUserId?: string;
  onUserChange?: (userId: string) => void;
}

const UserInfoCard = ({
  title,
  value: users,
  selectedUserId,
  onUserChange,
}: UserInfoCardProps) => {
  const { t } = useTranslation('user');
  const displayTitle = title || t('info.title');
  const isSingleUser = users.length === 1;
  const selectedUser = isSingleUser
    ? users[0]
    : users.find(user => user.user_id === selectedUserId);

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
        <CardHeader className='pb-4 flex flex-row items-center justify-between'>
          <CardTitle>{displayTitle}</CardTitle>
          {!isSingleUser && onUserChange && (
            <Select onValueChange={onUserChange} value={selectedUserId}>
              <SelectTrigger className='w-[150px]'>
                <SelectValue placeholder={t('info.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.user_id} value={user.user_id}>
                    {user.user_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardHeader>
        <CardContent className='px-6 pb-6 pt-2'>
          <UserInfoContent user={selectedUser} />
        </CardContent>
      </Card>
    </div>
  )
}

export { UserInfoCard };