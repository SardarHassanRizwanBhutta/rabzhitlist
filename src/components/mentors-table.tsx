"use client"

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Mentor } from "@/lib/types/mentor"

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const

function textOrNa(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed) return <span className="italic text-muted-foreground">N/A</span>
  return trimmed
}

export function MentorsTable({
  mentors,
  isLoading,
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
  onPageSizeChange,
  onOpen,
  onEdit,
  onDelete,
}: {
  mentors: Mentor[]
  isLoading: boolean
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onOpen: (mentor: Mentor) => void
  onEdit: (mentor: Mentor) => void
  onDelete: (mentor: Mentor) => void
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead className="w-[96px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Loading mentors...
                </TableCell>
              </TableRow>
            ) : mentors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  No mentors found.
                </TableCell>
              </TableRow>
            ) : (
              mentors.map((mentor) => {
                const links = mentor.linkedCandidates.filter((link) => link.candidateName.trim())
                const visibleLinks = links.slice(0, 2)
                const remainingCount = links.length - visibleLinks.length
                return (
                  <TableRow
                    key={mentor.id}
                    className="cursor-pointer"
                    onClick={() => onOpen(mentor)}
                  >
                    <TableCell className="font-medium">{mentor.name}</TableCell>
                    <TableCell>{textOrNa(mentor.designation)}</TableCell>
                    <TableCell>{textOrNa(mentor.employerName)}</TableCell>
                    <TableCell>
                      {links.length === 0 ? (
                        <span className="italic text-muted-foreground">N/A</span>
                      ) : (
                        <div className="flex min-w-0 flex-nowrap items-center gap-1">
                          {visibleLinks.map((link) => {
                            const name = link.candidateName.trim()
                            return (
                              <Badge
                                key={link.candidateId}
                                variant="secondary"
                                className="max-w-[7rem] min-w-0 shrink justify-start text-xs border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-700 dark:bg-blue-900 dark:text-blue-200"
                                title={name}
                              >
                                <span className="truncate">{name}</span>
                              </Badge>
                            )
                          })}
                          {remainingCount > 0 && (
                            <Badge variant="outline" className="shrink-0 text-xs">
                              +{remainingCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 cursor-pointer"
                          title={`View ${mentor.name}`}
                          aria-label={`View ${mentor.name}`}
                          onClick={(event) => {
                            event.stopPropagation()
                            onOpen(mentor)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={(event) => {
                                event.stopPropagation()
                                onEdit(mentor)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:text-red-600 cursor-pointer"
                              onClick={(event) => {
                                event.stopPropagation()
                                onDelete(mentor)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number.parseInt(value, 10))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                {PAGE_SIZE_OPTIONS.map((size) => (
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
                type="button"
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => onPageChange(1)}
                disabled={!hasPrevious}
              >
                <span className="sr-only">Go to first page</span>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(pageNumber - 1)}
                disabled={!hasPrevious}
              >
                <span className="sr-only">Go to previous page</span>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(pageNumber + 1)}
                disabled={!hasNext}
              >
                <span className="sr-only">Go to next page</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => onPageChange(totalPages)}
                disabled={!hasNext}
              >
                <span className="sr-only">Go to last page</span>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground px-2">
          Showing {totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1} to{" "}
          {Math.min(pageNumber * pageSize, totalCount)} of {totalCount} mentors
        </div>
      </div>
    </div>
  )
}
