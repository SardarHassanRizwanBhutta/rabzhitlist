"use client"

import * as React from "react"
import { MoreHorizontal, Eye, Edit, ChevronUp, ChevronDown, User, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Candidate, CANDIDATE_STATUS_COLORS, CANDIDATE_STATUS_LABELS } from "@/lib/types/candidate"
import { Badge } from "@/components/ui/badge"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CandidateDetailsModal } from "@/components/candidate-details-modal"
import { CandidateCreationDialog } from "@/components/candidate-creation-dialog"

interface CandidatesTableProps {
  candidates: Candidate[]
}

type SortDirection = "asc" | "desc" | null
type SortableColumn = "name" | "jobTitle" | "expectedSalary" | "city" | "status"

// Helper function to get job title from first work experience
const getJobTitle = (candidate: Candidate): string => {
  return candidate.workExperiences?.[0]?.jobTitle || "N/A"
}

export function CandidatesTable({ candidates }: CandidatesTableProps) {
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null)
  const [sortColumn, setSortColumn] = React.useState<SortableColumn | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [candidateToDelete, setCandidateToDelete] = React.useState<Candidate | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [candidateToEdit, setCandidateToEdit] = React.useState<Candidate | null>(null)

  const handleEdit = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation()
    setCandidateToEdit(candidate)
    setEditDialogOpen(true)
  }

  const handleUpdateCandidate = async (formData: any) => {
    // TODO: Implement actual update API call
    console.log("Update candidate:", candidateToEdit?.id, formData)
    // For now, just close the dialog
    setEditDialogOpen(false)
    setCandidateToEdit(null)
  }

  const handleDeleteClick = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation()
    setCandidateToDelete(candidate)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (candidateToDelete) {
      // TODO: Implement actual delete API call
      console.log("Delete candidate:", candidateToDelete)
      
      // Show success toast
      toast.success(`Candidate ${candidateToDelete.name} has been deleted successfully.`)
      
      // Close dialog and reset state
      setDeleteDialogOpen(false)
      setCandidateToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setCandidateToDelete(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc")
      } else if (sortDirection === "desc") {
        setSortColumn(null)
        setSortDirection(null)
      } else {
        setSortDirection("asc")
      }
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const sortedCandidates = React.useMemo(() => {
    if (!sortColumn || !sortDirection) return candidates

    return [...candidates].sort((a, b) => {
      let aValue: string | number | null
      let bValue: string | number | null

      // Handle jobTitle separately since it's not a direct property
      if (sortColumn === "jobTitle") {
        aValue = getJobTitle(a)
        bValue = getJobTitle(b)
      } else {
        // TypeScript type narrowing for other sort columns
        const sortKey = sortColumn as "name" | "expectedSalary" | "city" | "status"
        aValue = a[sortKey]
        bValue = b[sortKey]
      }

      // Handle null values - nulls should be sorted last
      if (aValue === null && bValue === null) return 0
      if (aValue === null) return 1
      if (bValue === null) return -1

      // At this point, both values are non-null
      let aCompare: string | number = aValue
      let bCompare: string | number = bValue

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aCompare = aValue.toLowerCase()
        bCompare = bValue.toLowerCase()
      }

      if (aCompare < bCompare) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (aCompare > bCompare) {
        return sortDirection === "asc" ? 1 : -1
      }
      return 0
    })
  }, [candidates, sortColumn, sortDirection])

  const SortIcon = ({ column }: { column: SortableColumn }) => {
    if (sortColumn !== column) return null
    if (sortDirection === "asc") return <ChevronUp className="size-4" />
    if (sortDirection === "desc") return <ChevronDown className="size-4" />
    return null
  }
  
  const SortableHeader = ({ 
    column, 
    children, 
    className 
  }: { 
    column: SortableColumn
    children: React.ReactNode
    className?: string 
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => handleSort(column)}
      >
        {children}
        <SortIcon column={column} />
      </Button>
    </TableHead>
  )

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {/* Name - Always visible */}
              <SortableHeader column="name">
                Name
              </SortableHeader>
              
              {/* Job Title - Hidden on mobile */}
              <SortableHeader column="jobTitle" className="hidden sm:table-cell">
                Job Title
              </SortableHeader>
              
              {/* Expected Salary - Always visible */}
              <SortableHeader column="expectedSalary">
                Expected Salary
              </SortableHeader>
              
              {/* Status - Always visible */}
              <SortableHeader column="status">
                Status
              </SortableHeader>
              
              {/* City - Hidden on mobile */}
              <SortableHeader column="city" className="hidden md:table-cell">
                City
              </SortableHeader>
              
              {/* Actions - Always visible */}
              <TableHead className="w-[70px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCandidates.length === 0 ? (
              <TableRow>
                <TableCell 
                  colSpan={6} 
                  className="h-32 text-center text-muted-foreground"
                >
                  No candidates found.
                </TableCell>
              </TableRow>
            ) : (
              sortedCandidates.map((candidate) => (
                <TableRow 
                  key={candidate.id}
                  className="hover:bg-muted/50 cursor-pointer"
                >
                  {/* Name with Avatar */}
                  <TableCell 
                    className="font-medium"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <User className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{candidate.name}</div>
                        <div className="text-sm text-muted-foreground truncate sm:hidden">
                          {getJobTitle(candidate)}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Job Title - Hidden on mobile */}
                  <TableCell 
                    className="hidden sm:table-cell"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="max-w-[200px]">
                      <div className="truncate">{getJobTitle(candidate)}</div>
                    </div>
                  </TableCell>
                  
                  {/* Expected Salary */}
                  <TableCell 
                    className="font-medium"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    {candidate.expectedSalary !== null ? formatCurrency(candidate.expectedSalary) : "N/A"}
                  </TableCell>
                  
                  {/* Status */}
                  <TableCell onClick={() => setSelectedCandidate(candidate)}>
                    <Badge 
                      variant="outline"
                      className={CANDIDATE_STATUS_COLORS[candidate.status]}
                    >
                      {CANDIDATE_STATUS_LABELS[candidate.status]}
                    </Badge>
                  </TableCell>
                  
                  {/* City - Hidden on mobile */}
                  <TableCell 
                    className="hidden md:table-cell"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    {candidate.city}
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCandidate(candidate)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={(e) => handleEdit(candidate, e)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer"
                            variant="destructive"
                            onClick={(e) => handleDeleteClick(candidate, e)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CandidateDetailsModal
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedCandidate(null)
          }
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{candidateToDelete?.name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer transition-transform duration-200 hover:scale-105"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Candidate Dialog */}
      <CandidateCreationDialog
        mode="edit"
        candidateData={candidateToEdit || undefined}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={handleUpdateCandidate}
      />
    </>
  )
}
