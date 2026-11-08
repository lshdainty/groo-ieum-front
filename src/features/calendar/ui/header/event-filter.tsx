import { useCalendar } from '@/features/calendar/model/calendar-context';
import { calendarTypes } from '@/features/calendar/model/types';
import { Filter as FilterIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { TEventColor } from '@/features/calendar/model/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/shadcn/avatar';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Button } from '@/shared/ui/shadcn/button';
import { Checkbox } from '@/shared/ui/shadcn/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/shadcn/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/shadcn/tabs';

const colorClassMap: Record<TEventColor, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300',
  green: 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300',
  red: 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  purple: 'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300',
  orange: 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300',
  pink: 'border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-800 dark:bg-pink-950 dark:text-pink-300',
  gray: 'border-neutral-200 bg-neutral-50 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300',
  teal: 'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300',
};

const EventFilter = () => {
  const { t } = useTranslation('calendar');
  const { users, selectedUserIds, setSelectedUserIds, selectedTypeIds, setSelectedTypeIds } = useCalendar();

  // User handlers
  const handleToggleUser = (userId: string) => {
    if (selectedUserIds === 'all') {
      setSelectedUserIds([userId]);
    } else {
      if (selectedUserIds.includes(userId)) {
        const newSelection = selectedUserIds.filter(id => id !== userId);
        setSelectedUserIds(newSelection);
      } else {
        const newSelection = [...selectedUserIds, userId];
        if (newSelection.length === users.length) {
          setSelectedUserIds('all');
        } else {
          setSelectedUserIds(newSelection);
        }
      }
    }
  };

  const handleToggleAllUsers = () => {
    if (selectedUserIds === 'all') {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds('all');
    }
  };

  // Type handlers
  const handleToggleType = (typeId: string) => {
    if (selectedTypeIds === 'all') {
      setSelectedTypeIds([typeId]);
    } else {
      if (selectedTypeIds.includes(typeId)) {
        const newSelection = selectedTypeIds.filter(id => id !== typeId);
        setSelectedTypeIds(newSelection);
      } else {
        const newSelection = [...selectedTypeIds, typeId];
        if (newSelection.length === calendarTypes.length) {
          setSelectedTypeIds('all');
        } else {
          setSelectedTypeIds(newSelection);
        }
      }
    }
  };

  const handleToggleAllTypes = () => {
    if (selectedTypeIds === 'all') {
      setSelectedTypeIds([]);
    } else {
      setSelectedTypeIds('all');
    }
  };

  const isAllUsersSelected = selectedUserIds === 'all';
  const selectedUserCount = isAllUsersSelected ? users.length : selectedUserIds.length;

  const isAllTypesSelected = selectedTypeIds === 'all';
  const selectedTypeCount = isAllTypesSelected ? calendarTypes.length : selectedTypeIds.length;

  const totalFilters = selectedUserCount + selectedTypeCount;
  const maxFilters = users.length + calendarTypes.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' className='flex-1 min-[48rem]:w-48 justify-between gap-2'>
          <div className='flex items-center gap-2'>
            <FilterIcon className='w-4 h-4' />
            <span>
              {totalFilters === maxFilters ? t('header.allFilters') : `${totalFilters} ${t('header.selected')}`}
            </span>
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-80 p-0'>
        <Tabs defaultValue='users' className='w-full'>
          <TabsList className='w-full grid grid-cols-2'>
            <TabsTrigger value='users'>{t('header.users')} ({selectedUserCount})</TabsTrigger>
            <TabsTrigger value='types'>{t('header.types')} ({selectedTypeCount})</TabsTrigger>
          </TabsList>

          <TabsContent value='users' className='p-2 space-y-1 max-h-[400px] overflow-y-auto'>
            <div
              className='flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent'
              onClick={handleToggleAllUsers}
            >
              <Checkbox
                checked={isAllUsersSelected}
                onCheckedChange={handleToggleAllUsers}
                onClick={(e) => e.stopPropagation()}
              />
              <span className='text-sm flex-1'>{t('header.allUsers')}</span>
            </div>

            {users.map(user => {
              const isSelected = isAllUsersSelected || selectedUserIds.includes(user.id);
              return (
                <div
                  key={user.id}
                  className='flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent'
                  onClick={() => handleToggleUser(user.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleUser(user.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className='flex items-center gap-2 flex-1'>
                    <Avatar className='size-6'>
                      <AvatarImage src={user.picturePath ?? undefined} alt={user.name} />
                      <AvatarFallback className='text-xxs'>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <p className='truncate text-sm'>{user.name}</p>
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value='types' className='p-2 space-y-1 max-h-[400px] overflow-y-auto'>
            <div
              className='flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent'
              onClick={handleToggleAllTypes}
            >
              <Checkbox
                checked={isAllTypesSelected}
                onCheckedChange={handleToggleAllTypes}
                onClick={(e) => e.stopPropagation()}
              />
              <span className='text-sm flex-1'>{t('header.allTypes')}</span>
            </div>

            {calendarTypes.map(type => {
              const isSelected = isAllTypesSelected || selectedTypeIds.includes(type.id);

              return (
                <div
                  key={type.id}
                  className='flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer hover:bg-accent'
                  onClick={() => handleToggleType(type.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleType(type.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Badge className={`flex-1 ${colorClassMap[type.color]}`}>
                    {t(type.nameKey)}
                  </Badge>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

export { EventFilter }
