"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { AppUser } from "@/lib/types/app-user"

interface UsersTableProps {
  users: AppUser[]
  isLoading?: boolean
  totalCount: number
  pageNumber: number
  pageSize: number
  totalPages: number
  hasPrevious: boolean
  hasNext: boolean
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  onEdit?: (user: AppUser) => void
  onDelete?: (user: AppUser) => void | Promise<void>
  /** When true, empty state uses filter-specific copy. */
  hasActiveFilters?: boolean
}

type SortKey = "fullName" | "email" | "createdAt"
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

function formatUserCreatedAt(iso: string): string {
  if (!iso.trim()) return "N/A"
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "N/A"
  return date.toLocaleDateString()
}

function sortValue(user: AppUser, key: SortKey): string | number {
  if (key === "createdAt") {
    const t = new Date(user.createdAt).getTime()
    return Number.isNaN(t) ? 0 : t
  }
  return user[key].toLowerCase()
}

export function UsersTable({
  users,
  isLoading = false,
  totalCount,
  pageNumber,
  pageSize,
  totalPages,
  hasPrevious,
  hasNext,
  onPageChange,
  onPageSizeChange,
  onEdit,
  onDelete,
  hasActiveFilters = false,
}: UsersTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("fullName")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null)

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const aValue = sortValue(a, sortKey)
      const bValue = sortValue(b, sortKey)
      if (aValue === bValue) return 0
      const comparison =
        typeof aValue === "number" && typeof bValue === "number"
          ? aValue - bValue
          : String(aValue).localeCompare(String(bValue))
      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [users, sortKey, sortDirection])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const startIndex = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1
  const endIndex = Math.min(pageNumber * pageSize, totalCount)

  const handleDeleteClick = (user: AppUser) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return
    try {
      await onDelete?.(userToDelete)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    } catch {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const SortButton = ({ column, children }: { column: SortKey; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-8 flex items-center gap-2 hover:bg-accent/50 data-[state=open]:bg-accent"
    >
      {children}
      {sortKey === column &&
        (sortDirection === "asc" ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        ))}
    </Button>
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="h-[400px] animate-pulse bg-muted" />
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    const emptyMessage = hasActiveFilters
      ? "No users match filters"
      : "No other users"
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <div className="flex h-[400px] items-center justify-center text-center">
            <p className="text-lg font-semibold text-muted-foreground">{emptyMessage}</p>
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
              <TableHead>
                <SortButton column="fullName">Full name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="email">Email</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="createdAt">Created At</SortButton>
              </TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {(pageNumber - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{formatUserCreatedAt(user.createdAt)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onEdit?.(user)}
                        className="cursor-pointer"
                      >
                        <EditIcon className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(user)}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
        Showing {totalCount === 0 ? 0 : startIndex} to {endIndex} of {totalCount} users
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove access for <strong>{userToDelete?.fullName}</strong> (
              {userToDelete?.email}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setUserToDelete(null)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
