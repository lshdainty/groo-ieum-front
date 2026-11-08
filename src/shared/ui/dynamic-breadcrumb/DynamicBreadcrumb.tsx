'use client'

import React, { useMemo } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/shadcn/breadcrumb'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui/shadcn/dropdownMenu'
import { useTranslation } from 'react-i18next'

// 설정 파일에서 import
import { createBreadcrumbMapping, defaultRedirects, flattenRoutes, routesConfig } from '@/app/config/routes.config'

interface BreadcrumbSegment {
  title: string
  href: string
  isActive?: boolean
}

interface DynamicBreadcrumbProps {
  maxItems?: number
  showHome?: boolean
  customSeparator?: React.ReactNode
  className?: string
}

export function DynamicBreadcrumb({
  maxItems = 3,
  showHome = true,
  customSeparator,
  className,
}: DynamicBreadcrumbProps) {
  const { pathname } = useLocation()
  const { t } = useTranslation('sidebar')

  // t 함수가 변경될 때마다 breadcrumbMapping을 재생성
  const breadcrumbMapping = useMemo(() => {
    return createBreadcrumbMapping(flattenRoutes(routesConfig), t)
  }, [t])

  const generateBreadcrumbs = (): BreadcrumbSegment[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbSegment[] = []

    // Home breadcrumb 추가
    if (showHome) {
      breadcrumbs.push({
        title: t('menu.home'),
        href: '/dashboard',
        isActive: pathname === '/dashboard',
      })
    }

    // /dashboard 경로면 Home만 반환
    if (pathname === '/dashboard') {
      return breadcrumbs
    }

    // 나머지 모든 세그먼트를 breadcrumb으로 변환
    segments.forEach((segment, index) => {
      const currentPath = `/${segments.slice(0, index + 1).join('/')}`

      // breadcrumbMapping에서 찾거나 기본값 사용
      const title = breadcrumbMapping[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)

      // 마지막 세그먼트가 활성
      const isActive = index === segments.length - 1

      let href = currentPath
      if (!isActive && defaultRedirects[href]) {
        href = defaultRedirects[href]
      }

      breadcrumbs.push({
        title,
        href,
        isActive,
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // 3개 이상이면 collapse
  const shouldCollapse = breadcrumbs.length > maxItems
  let displayBreadcrumbs = breadcrumbs
  let collapsedItems: BreadcrumbSegment[] = []

  if (shouldCollapse && breadcrumbs.length > 0) {
    const firstItem = breadcrumbs[0]
    const lastTwoItems = breadcrumbs.slice(-2)

    // 중간 항목들은 collapse
    collapsedItems = breadcrumbs.slice(1, -2)

    displayBreadcrumbs = [firstItem, ...lastTwoItems]
  }

  const separator = customSeparator || <BreadcrumbSeparator />

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {displayBreadcrumbs.map((crumb, index) => {
          const isFirst = index === 0
          const isLast = index === displayBreadcrumbs.length - 1
          const shouldShowEllipsis = shouldCollapse && index === 1 && collapsedItems.length > 0

          return (
            <React.Fragment key={`${crumb.title}-${index}`}>
              {/* ellipsis 표시 */}
              {shouldShowEllipsis && (
                <>
                  <BreadcrumbItem>
                    <DropdownMenu>
                      <DropdownMenuTrigger className='flex items-center gap-1 hover:text-foreground'>
                        <BreadcrumbEllipsis className='h-4 w-4' />
                        <span className='sr-only'>Show more</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='start'>
                        {collapsedItems.map((item, itemIndex) => (
                          <DropdownMenuItem key={`${item.href}-${itemIndex}`}>
                            <BreadcrumbLink asChild>
                              <Link to={item.href}>{item.title}</Link>
                            </BreadcrumbLink>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </BreadcrumbItem>
                  {separator}
                </>
              )}

              {/* breadcrumb 항목 */}
              <BreadcrumbItem className={isFirst && showHome ? 'hidden min-[48rem]:block' : ''}>
                {crumb.isActive ? (
                  <BreadcrumbPage className='font-medium text-foreground'>
                    {crumb.title}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild className='transition-colors hover:text-foreground'>
                    <Link to={crumb.href}>
                      {isFirst && showHome ? <Home className='h-4 w-4' /> : crumb.title}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {/* 구분자 */}
              {!isLast && separator}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
