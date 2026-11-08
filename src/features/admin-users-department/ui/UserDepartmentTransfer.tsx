import { Button } from '@/shared/ui/shadcn/button'
import { Checkbox } from '@/shared/ui/shadcn/checkbox'
import { Label } from '@/shared/ui/shadcn/label'
import { toast } from '@/shared/ui/shadcn/sonner'
import { Spinner } from '@/shared/ui/shadcn/spinner'
import TransferList, { type TransferItem } from '@/shared/ui/shadcn/transfer'
import { UserDepartmentTransferSkeleton } from '@/features/admin-users-department/ui/UserDepartmentTransferSkeleton'
import { useCheckUserMainDepartmentQuery } from '@/entities/department'
import { type UserInfo } from '@/entities/department'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface UserDepartmentTransferProps {
  usersInDepartment: UserInfo[]
  usersNotInDepartment: UserInfo[]
  onTransfer?: (addedUsers: UserInfo[], removedUsers: UserInfo[]) => void
  isLoading?: boolean
  isSaving?: boolean
}

const UserDepartmentTransfer = ({
  usersInDepartment,
  usersNotInDepartment,
  onTransfer,
  isLoading = false,
  isSaving = false,
}: UserDepartmentTransferProps) => {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')
  // 초기 사용자 ID 추적을 위한 상태
  const [initialLeftUserIds, setInitialLeftUserIds] = useState<Set<string>>(new Set())
  const [initialRightUserIds, setInitialRightUserIds] = useState<Set<string>>(new Set())

  const [leftItems, setLeftItems] = useState<TransferItem[]>([])
  const [rightItems, setRightItems] = useState<TransferItem[]>([])
  const [checkingUserId, setCheckingUserId] = useState<string>('')

  // 메인부서 존재 여부 확인 API
  const { data: mainDepartmentCheck, isSuccess } = useCheckUserMainDepartmentQuery(checkingUserId)

  // props가 변경될 때마다 상태 업데이트
  useEffect(() => {
    const newLeftUserIds = new Set(usersNotInDepartment.map(u => u.user_id))
    const newRightUserIds = new Set(usersInDepartment.map(u => u.user_id))

    setInitialLeftUserIds(newLeftUserIds)
    setInitialRightUserIds(newRightUserIds)

    const newLeftItems = usersNotInDepartment.map(user => ({
      key: user.user_id,
      label: user.user_name,
      selected: false,
      ...user
    }))

    const newRightItems = usersInDepartment.map(user => ({
      key: user.user_id,
      label: user.user_name,
      selected: false,
      ...user
    }))

    setLeftItems(newLeftItems)
    setRightItems(newRightItems)
  }, [usersInDepartment, usersNotInDepartment])

  // 변경사항이 있는지 확인하는 함수
  const hasChanges = () => {
    // 추가된 사용자가 있는지 확인
    const hasAddedUsers = rightItems.some(item => initialLeftUserIds.has(item.key))
    // 삭제된 사용자가 있는지 확인
    const hasRemovedUsers = leftItems.some(item => initialRightUserIds.has(item.key))

    return hasAddedUsers || hasRemovedUsers
  }

  const handleSave = () => {
    if (onTransfer) {
      // 추가된 사용자: 초기에는 왼쪽에 있었는데 현재는 오른쪽에 있는 사용자
      const addedUsers: UserInfo[] = rightItems
        .filter(item => initialLeftUserIds.has(item.key))
        .map(item => ({
          user_id: item.key,
          user_name: item.label,
          main_yn: (item.main_yn || 'N') as 'Y' | 'N'
        }))

      // 제거된 사용자: 초기에는 오른쪽에 있었는데 현재는 왼쪽에 있는 사용자
      const removedUsers: UserInfo[] = leftItems
        .filter(item => initialRightUserIds.has(item.key))
        .map(item => ({
          user_id: item.key,
          user_name: item.label,
          main_yn: 'N' as 'Y' | 'N'
        }))

      onTransfer(addedUsers, removedUsers)
    }
  }

  // API 응답 처리
  useEffect(() => {
    if (isSuccess && checkingUserId && mainDepartmentCheck) {
      const hasMainDepartment = mainDepartmentCheck.has_main_department === 'Y'

      if (hasMainDepartment) {
        // 이미 메인부서가 있는 경우 - toast 표시
        toast.error(t('user.mainDepartmentExists'))
        setCheckingUserId('') // 체크 중인 userId 초기화
        return
      }

      // 메인부서가 없는 경우 -> 체크 허용
      const updatedItems = rightItems.map((item) => {
        if (item.key === checkingUserId) {
          return { ...item, main_yn: 'Y' }
        }
        return item
      })
      setRightItems(updatedItems)
      setCheckingUserId('') // 체크 중인 userId 초기화
    }
  }, [isSuccess, checkingUserId, mainDepartmentCheck, rightItems])

  const handleMainDepartmentChange = (userId: string, isMain: boolean) => {
    // 메인부서 체크 해제하는 경우 (true -> false)
    if (!isMain) {
      const updatedItems = rightItems.map((item) => {
        if (item.key === userId) {
          return { ...item, main_yn: 'N' }
        }
        return item
      })
      setRightItems(updatedItems)
      return
    }

    // 메인부서로 체크하려는 경우 (false -> true)
    // API 호출을 위한 userId 설정
    setCheckingUserId(userId)
  }

  const renderLeftUserItem = (item: TransferItem) => {
    return (
      <div className='flex flex-col items-start'>
        <span className='font-medium'>{item.label}</span>
        <span className='text-xs text-muted-foreground'>{item.key}</span>
      </div>
    )
  }

  const renderRightUserItem = (item: TransferItem) => {
    return (
      <div className='flex items-center justify-between w-full gap-2'>
        <div className='flex flex-col items-start flex-1'>
          <span className='font-medium'>{item.label}</span>
          <span className='text-xs text-muted-foreground'>{item.key}</span>
        </div>
        <div className='flex items-center gap-2' onClick={(e) => e.stopPropagation()}>
          <Checkbox
            id={`main-${item.key}`}
            checked={item.main_yn === 'Y'}
            onCheckedChange={(checked) => handleMainDepartmentChange(item.key, checked === true)}
          />
          <Label
            htmlFor={`main-${item.key}`}
            className='text-xs text-muted-foreground cursor-pointer whitespace-nowrap'
          >
            {t('user.mainDepartment')}
          </Label>
        </div>
      </div>
    )
  }

  const filterUserItem = (item: TransferItem, search: string) => {
    const searchLower = search.toLowerCase()
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.key.toLowerCase().includes(searchLower)
    )
  }

  if (isLoading) {
    return <UserDepartmentTransferSkeleton />
  }

  return (
    <div className='w-full h-full flex flex-col gap-4 min-h-0'>
      <div className='hidden min-[48rem]:flex justify-end gap-2'>
        <Button onClick={handleSave} disabled={!hasChanges() || isSaving}>
          {isSaving && <Spinner />}
          {isSaving ? tc('processing') : tc('save')}
        </Button>
      </div>

      <TransferList
        leftItems={leftItems}
        rightItems={rightItems}
        onLeftChange={setLeftItems}
        onRightChange={setRightItems}
        leftTitle={t('user.allUsers')}
        rightTitle={t('user.usersInDepartment')}
        leftPlaceholder={t('user.searchUser')}
        rightPlaceholder={t('user.searchUser')}
        renderItem={renderLeftUserItem}
        renderRightItem={renderRightUserItem}
        filterItem={filterUserItem}
        itemClassName='border-b-0'
      />

      <div className='min-[48rem]:hidden sticky bottom-0 bg-background pt-2 pb-4 border-t -mx-4 px-4'>
        <Button onClick={handleSave} disabled={!hasChanges() || isSaving} className='w-full'>
          {isSaving && <Spinner />}
          {isSaving ? tc('processing') : tc('save')}
        </Button>
      </div>
    </div>
  )
}

export { UserDepartmentTransfer }
