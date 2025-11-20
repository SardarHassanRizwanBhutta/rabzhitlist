"use client"

import * as React from "react"
import { MoreHorizontal, Eye, Edit, ChevronUp, ChevronDown, User } from "lucide-react"

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
import { CandidateDetailsModal } from "@/components/candidate-details-modal"

interface CandidatesTableProps {
  candidates: Candidate[]
}

type SortDirection = "asc" | "desc" | null
type SortableColumn = "name" | "currentJobTitle" | "expectedSalary" | "city" | "status"

export function CandidatesTable({ candidates }: CandidatesTableProps) {
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null)
  const [sortColumn, setSortColumn] = React.useState<SortableColumn | null>(null)
  const [sortDirection, setSortDirection] = React.useState<SortDirection>(null)

  const handleEdit = (candidate: Candidate) => {
    // TODO: Implement edit functionality
    console.log("Edit candidate:", candidate)
    // Future: Open edit modal/drawer or navigate to edit page
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
      let aValue = a[sortColumn]
      let bValue = b[sortColumn]

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) {
        return sortDirection === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
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
              <SortableHeader column="currentJobTitle" className="hidden sm:table-cell">
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
                          {candidate.currentJobTitle}
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
                      <div className="truncate">{candidate.currentJobTitle}</div>
                    </div>
                  </TableCell>
                  
                  {/* Expected Salary */}
                  <TableCell 
                    className="font-medium"
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    {formatCurrency(candidate.expectedSalary)}
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
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedCandidate(candidate)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(candidate)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit candidate</span>
                      </Button>
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
    </>
  )
}
