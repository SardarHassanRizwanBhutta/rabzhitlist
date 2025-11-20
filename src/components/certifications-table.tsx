"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  ChevronUpIcon,
  ChevronDownIcon,
  MoreHorizontalIcon,
  SearchIcon,
  PlusIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  UsersIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  Certification,
  CERTIFICATION_LEVEL_COLORS,
  CERTIFICATION_LEVEL_LABELS,
} from "@/lib/types/certification"
import { useRouter } from "next/navigation"

interface CertificationsTableProps {
  certifications: Certification[]
  isLoading?: boolean
  onAdd?: () => void
  onView?: (certification: Certification) => void
  onEdit?: (certification: Certification) => void
  onDelete?: (certification: Certification) => void
}

type SortKey = keyof Certification
type SortDirection = "asc" | "desc"

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50]

export function CertificationsTable({
  certifications,
  isLoading = false,
  onAdd,
  onView,
  onEdit,
  onDelete,
}: CertificationsTableProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("certificationName")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const router = useRouter()
  // Filtering
  const filteredCertifications = useMemo(() => {
    if (!searchQuery) return certifications

    return certifications.filter(
      (cert) =>
        cert.certificationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.issuingBody.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificationLevel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [certifications, searchQuery])

  const handleViewCandidates = (certification: Certification) => {
    // Navigate to projects page with employer filter
    const params = new URLSearchParams({
      certificationFilter: certification.certificationName,
      certificationId: certification.id 
    })
    router.push(`/candidates?${params.toString()}`)
  }

  // Sorting
  const sortedCertifications = useMemo(() => {
    return [...filteredCertifications].sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]

      if (aValue === bValue) return 0

      let comparison = 0
      if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime()
      } else {
        comparison = String(aValue).localeCompare(String(bValue))
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredCertifications, sortKey, sortDirection])

  // Pagination
  const totalPages = Math.ceil(sortedCertifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedCertifications = sortedCertifications.slice(startIndex, endIndex)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDirection("asc")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(parseInt(value))
    setCurrentPage(1)
  }

  const SortButton = ({ column, children }: { column: SortKey; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-8 data-[state=open]:bg-accent flex items-center gap-2 hover:bg-accent/50"
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

  const formatDate = (date: Date | undefined) => {
    if (!date) return "N/A"
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-10 w-[300px] bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-[130px] bg-muted animate-pulse rounded"></div>
        </div>
        <div className="rounded-md border">
          <div className="h-[400px] bg-muted animate-pulse"></div>
        </div>
      </div>
    )
  }

  if (certifications.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative">
            <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search certifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
          {onAdd && (
            <Button onClick={onAdd}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Certification
            </Button>
          )}
        </div>
        <div className="rounded-md border">
          <div className="flex items-center justify-center h-[400px] text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold">No certifications found</p>
              <p className="text-muted-foreground">Get started by adding your first certification.</p>
              {onAdd && (
                <Button 
                  onClick={onAdd} 
                  className="mt-4 transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Certification
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search certifications..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-8 w-[300px]"
          />
        </div>
        {onAdd && (
          <Button 
            onClick={onAdd}
            className="transition-all duration-200 ease-in-out hover:scale-105 hover:shadow-md cursor-pointer"
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Certification
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">
                <SortButton column="id">ID</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="certificationName">Name</SortButton>
              </TableHead>
              <TableHead>
                <SortButton column="issuingBody">Issuing Body</SortButton>
              </TableHead>
              <TableHead className="w-[120px]">
                <SortButton column="certificationLevel">Level</SortButton>
              </TableHead>
              <TableHead className="w-[60px]" title="View Candidates">Candidates</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCertifications.map((certification) => (
              <TableRow key={certification.id}>
                <TableCell className="font-mono text-xs">
                  {certification.id.split('-')[1]}
                </TableCell>
                <TableCell className="font-medium">
                  {certification.certificationName}
                </TableCell>
                <TableCell>{certification.issuingBody}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={CERTIFICATION_LEVEL_COLORS[certification.certificationLevel]}
                  >
                    {CERTIFICATION_LEVEL_LABELS[certification.certificationLevel]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400 cursor-pointer"
                    onClick={() => handleViewCandidates(certification)}
                    title={`View candidates for ${certification.certificationName}`}
                  >
                    <UsersIcon className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
                      {onView && (
                        <DropdownMenuItem onClick={() => onView(certification)}>
                          <EyeIcon className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      )}
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(certification)}>
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(certification)}
                          className="text-red-600"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {ITEMS_PER_PAGE_OPTIONS.map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {currentPage} of {totalPages || 1}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="text-xs text-muted-foreground">
        Showing {startIndex + 1} to {Math.min(endIndex, sortedCertifications.length)} of{" "}
        {sortedCertifications.length} entries
        {searchQuery && ` (filtered from ${certifications.length} total entries)`}
      </div>
    </div>
  )
}
