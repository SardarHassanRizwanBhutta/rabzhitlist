"use client"

import Link from "next/link"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  achievementTypeLabel,
  type CandidateAchievementListItem,
} from "@/lib/services/achievements-api"

interface AchievementsTableProps {
  achievements: CandidateAchievementListItem[]
  isLoading?: boolean
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

export function AchievementsTable({
  achievements,
  isLoading = false,
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
  onPageSizeChange,
}: AchievementsTableProps) {
  const startIndex = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1
  const endIndex = Math.min(pageNumber * pageSize, totalCount)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="h-[400px] bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (achievements.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="flex items-center justify-center h-[400px] text-center">
            <p className="text-lg font-semibold text-muted-foreground">No achievements found</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">No.</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Year</TableHead>
              <TableHead className="hidden lg:table-cell">Ranking</TableHead>
              <TableHead className="w-[60px]" title="View this candidate">
                <span className="sr-only">View candidate</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {achievements.map((row, index) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {(pageNumber - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="max-w-[240px]">
                  {row.description?.trim() ? (
                    <span className="block truncate" title={row.description}>
                      {row.description}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>{achievementTypeLabel(row.type)}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {row.year ?? <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {row.ranking ?? <span className="text-muted-foreground text-sm">—</span>}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 cursor-pointer"
                    asChild
                  >
                    <Link
                      href={`/candidates?candidateId=${row.candidateId}`}
                      title={`View ${row.candidateName}`}
                      aria-label={`View candidate ${row.candidateName}`}
                    >
                      <UsersIcon className="h-4 w-4" aria-hidden />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={pageSize.toString()}
            onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {ITEMS_PER_PAGE_OPTIONS.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {pageNumber} of {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(1)}
              disabled={!hasPrevious}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pageNumber - 1)}
              disabled={!hasPrevious}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(pageNumber + 1)}
              disabled={!hasNext}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => onPageChange(totalPages)}
              disabled={!hasNext}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {totalCount === 0 ? 0 : startIndex} to {endIndex} of {totalCount} achievements
      </div>
    </div>
  )
}
