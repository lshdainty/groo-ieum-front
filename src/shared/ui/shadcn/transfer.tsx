'use client'

import { Button } from '@/shared/ui/shadcn/button'
import { Checkbox } from '@/shared/ui/shadcn/checkbox'
import { Input } from '@/shared/ui/shadcn/input'
import { Label } from '@/shared/ui/shadcn/label'
import { cn } from '@/shared/lib'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon } from 'lucide-react'
import React from 'react'

export type TransferItem = {
  key: string
  label: string
  selected?: boolean
  [key: string]: any
}

export interface TransferListProps {
  leftItems: TransferItem[]
  rightItems: TransferItem[]
  onLeftChange: (items: TransferItem[]) => void
  onRightChange: (items: TransferItem[]) => void
  leftTitle?: string
  rightTitle?: string
  leftPlaceholder?: string
  rightPlaceholder?: string
  renderItem?: (item: TransferItem) => React.ReactNode
  renderRightItem?: (item: TransferItem) => React.ReactNode
  filterItem?: (item: TransferItem, search: string) => boolean
  itemClassName?: string
}

export default function TransferList({
  leftItems,
  rightItems,
  onLeftChange,
  onRightChange,
  leftTitle = 'All Items',
  rightTitle = 'Selected Items',
  leftPlaceholder = 'Search',
  rightPlaceholder = 'Search',
  renderItem,
  renderRightItem,
  filterItem,
  itemClassName,
}: TransferListProps) {
  const [leftSearch, setLeftSearch] = React.useState('')
  const [rightSearch, setRightSearch] = React.useState('')

  const moveToRight = () => {
    const selectedItems = leftItems.filter((item) => item.selected)
    if (selectedItems.length === 0) return

    const unselectedItems = selectedItems.map(item => ({ ...item, selected: false }))
    onRightChange([...rightItems, ...unselectedItems])
    onLeftChange(leftItems.filter((item) => !item.selected))
  }

  const moveToLeft = () => {
    const selectedItems = rightItems.filter((item) => item.selected)
    if (selectedItems.length === 0) return

    const unselectedItems = selectedItems.map(item => ({ ...item, selected: false }))
    onLeftChange([...leftItems, ...unselectedItems])
    onRightChange(rightItems.filter((item) => !item.selected))
  }

  const toggleLeftSelection = (key: string) => {
    const updatedList = leftItems.map((item) => {
      if (item.key === key) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    onLeftChange(updatedList)
  }

  const toggleRightSelection = (key: string) => {
    const updatedList = rightItems.map((item) => {
      if (item.key === key) {
        return { ...item, selected: !item.selected }
      }
      return item
    })
    onRightChange(updatedList)
  }

  const defaultFilterItem = (item: TransferItem, search: string) => {
    return item.label.toLowerCase().includes(search.toLowerCase())
  }

  const filterFn = filterItem || defaultFilterItem

  const defaultRenderItem = (item: TransferItem) => item.label

  return (
    <div className='flex flex-col min-[48rem]:flex-row min-[48rem]:space-x-4 gap-4 min-[48rem]:gap-0 flex-1 h-full min-h-0'>
      <div className='w-full min-[48rem]:w-1/2 bg-background rounded-sm flex flex-col h-[200px] min-[48rem]:h-full min-[48rem]:min-h-0'>
        <div className='flex items-center justify-between flex-shrink-0'>
          <Input
            placeholder={leftPlaceholder}
            className='rounded-b-none focus-visible:ring-0 focus-visible:border-blue-500'
            value={leftSearch}
            onChange={(e) => setLeftSearch(e.target.value)}
          />
        </div>
        <div className='text-xs text-muted-foreground px-3 py-1 border-l border-r bg-muted/30'>
          {leftTitle} ({leftItems.length})
        </div>
        <ul className='flex-1 border-l border-r border-b rounded-br-sm rounded-bl-sm p-2 overflow-y-auto'>
          {leftItems
            .filter((item) => filterFn(item, leftSearch))
            .map((item) => (
              <li className={cn('flex items-center gap-2 text-sm hover:bg-muted rounded-sm p-2 border-b border-border last:border-b-0', itemClassName)} key={item.key}>
                <Checkbox
                  id={`left-${item.key}`}
                  checked={item.selected}
                  onCheckedChange={() => toggleLeftSelection(item.key)}
                />
                <Label
                  htmlFor={`left-${item.key}`}
                  className='flex-1 cursor-pointer'>
                  {renderItem ? renderItem(item) : defaultRenderItem(item)}
                </Label>
              </li>
            ))}
        </ul>
      </div>

      <div className='flex flex-row min-[48rem]:flex-col items-center justify-center gap-2'>
        <Button
          onClick={moveToRight}
          size='icon'
          variant='outline'
          disabled={leftItems.filter(item => item.selected).length === 0}>
          <ChevronRightIcon className='hidden min-[48rem]:block h-4 w-4' />
          <ChevronDownIcon className='block min-[48rem]:hidden h-4 w-4' />
        </Button>
        <Button
          onClick={moveToLeft}
          size='icon'
          variant='outline'
          disabled={rightItems.filter(item => item.selected).length === 0}>
          <ChevronLeftIcon className='hidden min-[48rem]:block h-4 w-4' />
          <ChevronUpIcon className='block min-[48rem]:hidden h-4 w-4' />
        </Button>
      </div>

      <div className='w-full min-[48rem]:w-1/2 bg-background rounded-sm flex flex-col h-[200px] min-[48rem]:h-full min-[48rem]:min-h-0'>
        <div className='flex items-center justify-between flex-shrink-0'>
          <Input
            placeholder={rightPlaceholder}
            className='rounded-b-none focus-visible:ring-0 focus-visible:border-blue-500'
            value={rightSearch}
            onChange={(e) => setRightSearch(e.target.value)}
          />
        </div>
        <div className='text-xs text-muted-foreground px-3 py-1 border-l border-r bg-muted/30'>
          {rightTitle} ({rightItems.length})
        </div>
        <ul className='flex-1 border-l border-r border-b rounded-br-sm rounded-bl-sm p-2 overflow-y-auto'>
          {rightItems
            .filter((item) => filterFn(item, rightSearch))
            .map((item) => (
              <li className={cn('flex items-center gap-2 text-sm hover:bg-muted rounded-sm p-2 border-b border-border last:border-b-0', itemClassName)} key={item.key}>
                <Checkbox
                  id={`right-${item.key}`}
                  checked={item.selected}
                  onCheckedChange={() => toggleRightSelection(item.key)}
                />
                <Label
                  htmlFor={`right-${item.key}`}
                  className='flex-1 cursor-pointer'>
                  {renderRightItem ? renderRightItem(item) : (renderItem ? renderItem(item) : defaultRenderItem(item))}
                </Label>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}