"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { UsersTable } from "@/components/users-table"
import { UsersFilterDialog, type UserFilters } from "@/components/users-filter-dialog"
import { UserFormDialog, type UserFormData } from "@/components/user-form-dialog"
import type { AppUser } from "@/lib/types/app-user"
import {
  createUser,
  deleteUser,
  fetchUsersPage,
  updateUser,
} from "@/lib/services/users-api"

const DEFAULT_PAGE_SIZE = 20

const initialFilters: UserFilters = {
  fullNameSearch: "",
  emailSearch: "",
}

export function UsersPageClient() {
  const [filters, setFilters] = useState<UserFilters>(initialFilters)
  const [items, setItems] = useState<AppUser[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [totalPages, setTotalPages] = useState(0)
  const [hasPrevious, setHasPrevious] = useState(false)
  const [hasNext, setHasNext] = useState(false)
  const [loading, setLoading] = useState(true)

  const [editOpen, setEditOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<AppUser | null>(null)

  const hasActiveFilters =
    Boolean(filters.fullNameSearch.trim()) || Boolean(filters.emailSearch.trim())

  const loadUsers = useCallback(
    async (page: number, size: number) => {
      try {
        setLoading(true)
        const data = await fetchUsersPage({
          fullName: filters.fullNameSearch.trim() || undefined,
          email: filters.emailSearch.trim() || undefined,
          pageNumber: page,
          pageSize: size,
        })
        setItems(data.items)
        setTotalCount(data.totalCount)
        setPageNumber(data.pageNumber)
        setPageSize(data.pageSize)
        setTotalPages(data.totalPages)
        setHasPrevious(data.hasPrevious)
        setHasNext(data.hasNext)
      } catch (error) {
        console.error("Failed to fetch users:", error)
        const message = error instanceof Error ? error.message : "Failed to load users."
        toast.error(message)
      } finally {
        setLoading(false)
      }
    },
    [filters.fullNameSearch, filters.emailSearch],
  )

  useEffect(() => {
    loadUsers(pageNumber, pageSize)
  }, [loadUsers, pageNumber, pageSize])

  const handleFiltersChange = (next: UserFilters) => {
    setFilters(next)
    setPageNumber(1)
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setPageNumber(1)
  }

  const handlePageChange = (page: number) => {
    setPageNumber(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPageNumber(1)
  }

  const handleCreateOrUpdate = async (data: UserFormData, mode: "create" | "edit") => {
    try {
      if (mode === "edit" && userToEdit) {
        await updateUser(userToEdit.id, {
          fullName: data.fullName,
          email: data.email,
          ...(data.password.trim() ? { password: data.password } : {}),
        })
        toast.success(`User "${data.fullName}" has been updated.`)
        setEditOpen(false)
        setUserToEdit(null)
      } else {
        await createUser({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
        })
        toast.success(`User "${data.fullName}" has been created.`)
      }
      await loadUsers(pageNumber, pageSize)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed."
      if (message === "Not found") {
        toast.error("User not found.")
        setEditOpen(false)
        setUserToEdit(null)
      } else {
        toast.error(message)
      }
      throw err
    }
  }

  const handleEdit = (user: AppUser) => {
    setUserToEdit(user)
    setEditOpen(true)
  }

  const handleDelete = async (user: AppUser) => {
    try {
      await deleteUser(user.id)
      toast.success(`User "${user.fullName}" has been deleted.`)
      await loadUsers(pageNumber, pageSize)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete user."
      if (message === "Not found") {
        toast.error("User not found.")
      } else {
        toast.error(message)
      }
      throw err
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">All Users</h2>
        <div className="flex items-center gap-2">
          <UsersFilterDialog
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />
          <UserFormDialog onSubmit={handleCreateOrUpdate} />
        </div>
      </div>

      <UsersTable
        users={items}
        isLoading={loading}
        totalCount={totalCount}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalPages={totalPages}
        hasPrevious={hasPrevious}
        hasNext={hasNext}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
        hasActiveFilters={hasActiveFilters}
      />

      {userToEdit ? (
        <UserFormDialog
          mode="edit"
          user={userToEdit}
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open)
            if (!open) setUserToEdit(null)
          }}
          onSubmit={handleCreateOrUpdate}
        />
      ) : null}
    </div>
  )
}
