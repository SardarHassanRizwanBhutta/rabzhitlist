"use client"

import * as React from "react"
import { User, Target, FolderOpen, Building2, GraduationCap, Award, Trophy, Check, Eye, Edit, Trash2, MoreHorizontal, MapPin, Star, Smartphone } from "lucide-react"
import { toast } from "sonner"

import { Candidate, CANDIDATE_STATUS_COLORS, CANDIDATE_STATUS_LABELS } from "@/lib/types/candidate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Separator } from "@/components/ui/separator"
import { CandidateDetailsModal } from "@/components/candidate-details-modal"
import { CandidateCreationDialog, CandidateFormData } from "@/components/candidate-creation-dialog"
import { CandidateFilters } from "@/components/candidates-filter-dialog"
import { 
  getCandidateMatchContext, 
  hasActiveFilters,
  type MatchCriterion,
  type CandidateMatchContext,
  type MatchCategory,
  type MatchItem,
} from "@/lib/utils/candidate-matches"

const defaultFilters: CandidateFilters = {
  basicInfoSearch: "",
  postingTitle: "",
  cities: [],
  status: [],
  currentSalaryMin: "",
  currentSalaryMax: "",
  expectedSalaryMin: "",
  expectedSalaryMax: "",
  employers: [],
  projects: [],
  projectStatus: [],
  projectTypes: [],
  techStacks: [],
  clientLocations: [],
  minClientLocationCount: "",
  verticalDomains: [],
  horizontalDomains: [],
  technicalAspects: [],
  startDateStart: null,
  startDateEnd: null,
  candidateTechStacks: [],
  candidateTechStacksRequireAll: false,
  candidateTechStacksRequireInBoth: false,
  techStackMinYears: {
    techStacks: [],
    minYears: ""
  },
  candidateDomains: [],
  shiftTypes: [],
  workModes: [],
  workModeMinYears: {
    workModes: [],
    minYears: ""
  },
  timeSupportZones: [],
  isCurrentlyWorking: null,
  workedWithTopDeveloper: null,
  workedWithTopDeveloperUseTolerance: true,  // Default: apply tolerance
  isTopDeveloper: null,
  jobTitle: "",
  jobTitleWorkedWith: false,
  jobTitleWorkedWithUseTolerance: true,  // Default: apply tolerance
  jobTitleStartedCareer: false,  // Default: check all jobs
  yearsOfExperienceMin: "",
  yearsOfExperienceMax: "",
  maxJobChangesInLastYears: {
    maxChanges: "",
    years: ""
  },
  minPromotionsInLastYears: {
    minPromotions: "",
    years: ""
  },
  continuousEmployment: null,
  continuousEmploymentToleranceMonths: 3,
  minPromotionsSameCompany: "",
  joinedProjectFromStart: null,
  joinedProjectFromStartToleranceDays: 30,
  projectTeamSizeMin: "",
  projectTeamSizeMax: "",
  hasPublishedProject: null,
  publishPlatforms: [],
  minProjectDownloadCount: "",
  employerStatus: [],
  employerCountries: [],
  employerCities: [],
  employerTypes: [],
  careerTransitionFromType: [],
  careerTransitionToType: [],
  careerTransitionRequireCurrent: false,
  employerSalaryPolicies: [],
  employerSizeMin: "",
  employerSizeMax: "",
  employerRankings: [],
  universities: [],
  universityCountries: [],
  universityRankings: [],
  universityCities: [],
  degreeNames: [],
  majorNames: [],
  isTopper: null,
  isCheetah: null,
  educationEndDateStart: null,
  educationEndDateEnd: null,
  certificationNames: [],
  certificationIssuingBodies: [],
  certificationLevels: [],
  competitionPlatforms: [],
  internationalBugBountyOnly: false,
  personalityTypes: [],
  organizationalRoles: {
    organizationNames: [],
    roles: []
  },
  source: [],
}

interface CandidatesCardsViewProps {
  candidates: Candidate[]
  filters?: CandidateFilters
  onEdit?: (candidate: Candidate) => void
  onDelete?: (candidate: Candidate) => void
}

// Helper function to get job title from first work experience
const getJobTitle = (candidate: Candidate): string => {
  return candidate.workExperiences?.[0]?.jobTitle || "N/A"
}

const getCategoryIcon = (type: string) => {
  switch (type) {
    case 'projects':
      return FolderOpen
    case 'employers':
      return Building2
    case 'education':
      return GraduationCap
    case 'certifications':
      return Award
    case 'competitions':
      return Trophy
    case 'collaboration':
      return Star // Using Star icon for top developer collaboration
    case 'published':
      return Smartphone // Using Smartphone icon for published apps
    default:
      return Target
  }
}

const getCategoryColor = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      text: 'text-blue-800 dark:text-blue-200',
      border: 'border-blue-200 dark:border-blue-800'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      text: 'text-purple-800 dark:text-purple-200',
      border: 'border-purple-200 dark:border-purple-800'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      text: 'text-green-800 dark:text-green-200',
      border: 'border-green-200 dark:border-green-800'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      text: 'text-orange-800 dark:text-orange-200',
      border: 'border-orange-200 dark:border-orange-800'
    },
    yellow: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/20',
      text: 'text-yellow-800 dark:text-yellow-200',
      border: 'border-yellow-200 dark:border-yellow-800'
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-gray-950/20',
      text: 'text-gray-800 dark:text-gray-200',
      border: 'border-gray-200 dark:border-gray-800'
    },
  }
  return colorMap[color] || colorMap.gray
}

// Color mapping for each criterion type
const getCriterionColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    // Project Expertise
    'project': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    'status': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    'type': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    'techStack': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 border-cyan-300 dark:border-cyan-700',
    'verticalDomain': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700',
    'horizontalDomain': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    'technicalAspect': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    
    // Employer Characteristics
    'employer': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    'employerStatus': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    'country': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700',
    'city': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    'salaryPolicy': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 border-pink-300 dark:border-pink-700',
    'size': 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-200 border-fuchsia-300 dark:border-fuchsia-700',
    
    // Education Background
    'university': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 border-violet-300 dark:border-violet-700',
    'ranking': 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200 border-slate-300 dark:border-slate-700',
    'degree': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-700',
    'major': 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200 border-lime-300 dark:border-lime-700',
    'isTopper': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    'isCheetah': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    'startMonth': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    'endMonth': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 border-violet-300 dark:border-violet-700',
    
    // Professional Certifications
    'certification': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-700',
    'issuingBody': 'bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-200 border-stone-300 dark:border-stone-700',
    'level': 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 border-neutral-300 dark:border-neutral-700',
    
    // Competitions
    'competitionPlatform': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    'internationalBugBounty': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700',
    
    // Candidate Tech Stacks
    'candidateTechStack': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-300 dark:border-blue-700',
    // Candidate Domains
    'candidateDomain': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
    
    // Top Developer Collaboration
    'topDeveloper': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    'sharedProject': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700',
    
    // Published Apps
    'publishedPlatform': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-300 dark:border-green-700',
    'storeLink': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200 border-teal-300 dark:border-teal-700',
    
    // Career Transition
    'careerTransition': 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 dark:from-purple-900 dark:to-blue-900 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  }
  
  return colorMap[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-300 dark:border-gray-700'
}

// Helper to get all unique criterion types from match context
const getAllCriterionTypes = (matchContext: CandidateMatchContext): MatchCriterion[] => {
  const criterionMap = new Map<string, MatchCriterion>()
  
  matchContext.categories.forEach((category: MatchCategory) => {
    category.items.forEach((item: MatchItem) => {
      item.matchedCriteria.forEach((criterion: MatchCriterion) => {
        if (!criterionMap.has(criterion.type)) {
          criterionMap.set(criterion.type, criterion)
        }
      })
    })
  })
  
  return Array.from(criterionMap.values())
}

// Legend component
const FilterLegend = ({ criteria }: { criteria: MatchCriterion[] }) => {
  if (criteria.length === 0) return null
  
  return (
    <div className="mb-3 p-2 bg-muted/50 rounded-md border border-border">
      <div className="text-xs font-semibold text-muted-foreground mb-2">Filter Legend:</div>
      <div className="flex flex-wrap gap-2">
        {criteria.map((criterion) => (
          <div key={criterion.type} className="flex items-center gap-1.5">
            <Badge 
              variant="outline" 
              className={`${getCriterionColor(criterion.type)} text-xs h-5 px-2 border`}
            >
              {criterion.label}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CandidatesCardsView({ candidates, filters = defaultFilters, onEdit, onDelete }: CandidatesCardsViewProps) {
  const [selectedCandidate, setSelectedCandidate] = React.useState<Candidate | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [candidateToDelete, setCandidateToDelete] = React.useState<Candidate | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)
  const [candidateToEdit, setCandidateToEdit] = React.useState<Candidate | null>(null)

  const activeFilters = hasActiveFilters(filters)

  // Collect all unique criterion types from all candidates for the single legend
  // Must be called before any early returns (React Hooks rule)
  const allUniqueCriteria = React.useMemo(() => {
    if (!activeFilters) return []
    
    const criterionMap = new Map<string, MatchCriterion>()
    
    candidates.forEach((candidate) => {
      const matchContext = getCandidateMatchContext(candidate, filters)
      if (matchContext) {
        const criteria = getAllCriterionTypes(matchContext)
        criteria.forEach((criterion) => {
          if (!criterionMap.has(criterion.type)) {
            criterionMap.set(criterion.type, criterion)
          }
        })
      }
    })
    
    return Array.from(criterionMap.values())
  }, [candidates, filters, activeFilters])

  const handleEdit = (candidate: Candidate, e: React.MouseEvent) => {
    e.stopPropagation()
    setCandidateToEdit(candidate)
    setEditDialogOpen(true)
  }

  const handleUpdateCandidate = async (formData: CandidateFormData) => {
    // TODO: Implement actual update API call
    console.log("Update candidate:", candidateToEdit?.id, formData)
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
      toast.success(`Candidate ${candidateToDelete.name} has been deleted successfully.`)
      setDeleteDialogOpen(false)
      setCandidateToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false)
    setCandidateToDelete(null)
  }

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">No candidates found</p>
        <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters</p>
      </div>
    )
  }

  return (
    <>
      {/* Single Filter Legend at the top */}
      {activeFilters && allUniqueCriteria.length > 0 && (
        <div className="mb-4">
          <FilterLegend criteria={allUniqueCriteria} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => {
          const matchContext = activeFilters ? getCandidateMatchContext(candidate, filters) : null

          return (
            <Card 
              key={candidate.id}
              className="hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-primary/50 flex flex-col h-full overflow-hidden"
              onClick={() => setSelectedCandidate(candidate)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                    <User className="size-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <CardTitle className="text-lg truncate flex-1">{candidate.name}</CardTitle>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge 
                          variant="outline"
                          className={`${CANDIDATE_STATUS_COLORS[candidate.status]} text-xs shrink-0`}
                        >
                          {CANDIDATE_STATUS_LABELS[candidate.status]}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedCandidate(candidate)
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleEdit(candidate, e)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={(e) => handleDeleteClick(candidate, e)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="truncate">{getJobTitle(candidate)}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span>{candidate.city}</span>
                      </div>
                    </div>
                    {/* Career Transition Badge - Display prominently */}
                    {activeFilters && matchContext && filters.careerTransitionFromType.length > 0 && filters.careerTransitionToType.length > 0 && (
                      (() => {
                        const transitionItem = matchContext.categories
                          .flatMap(cat => cat.items)
                          .find(item => item.matchedCriteria.some(c => c.type === 'careerTransition'))
                        
                        if (transitionItem) {
                          const transitionValue = transitionItem.matchedCriteria
                            .find(c => c.type === 'careerTransition')?.values[0] || ''
                          return (
                            <div className="mt-2">
                              <Badge 
                                variant="outline" 
                                className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-semibold"
                              >
                                <Building2 className="h-3 w-3 mr-1" />
                                {transitionValue}
                              </Badge>
                            </div>
                          )
                        }
                        return null
                      })()
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 min-h-0 flex flex-col max-h-96 overflow-hidden">
                {/* Match Summary - Prominently displayed */}
                {activeFilters && matchContext && matchContext.totalMatches > 0 && (
                  <div className="flex-1 min-h-0 flex flex-col">
                    {/* Fixed header - doesn't scroll */}
                    <div className="flex items-center gap-2 mb-3 shrink-0">
                      <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold">
                        {matchContext.totalMatches} Match{matchContext.totalMatches !== 1 ? 'es' : ''} Found
                      </span>
                    </div>

                    {/* Scrollable content - Display ALL match details */}
                    <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-2">
                      {matchContext.categories.map((category) => {
                        const CategoryIcon = getCategoryIcon(category.type)
                        const colors = getCategoryColor(category.color)

                        return (
                          <div 
                            key={category.type}
                            className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <CategoryIcon className={`h-4 w-4 ${colors.text}`} />
                              <span className={`text-sm font-semibold ${colors.text}`}>
                                {category.label}
                              </span>
                              <Badge variant="outline" className="text-xs ml-auto">
                                {category.count}
                              </Badge>
                            </div>
                            
                            {/* Display ALL matching items - Simplified with badges */}
                            <div className="space-y-3">
                              {category.items.map((item, itemIndex) => {
                                // Collect all badges for this item
                                const allBadges: Array<{ type: string; value: string }> = []
                                item.matchedCriteria.forEach((criterion) => {
                                  criterion.values.forEach((value) => {
                                    allBadges.push({ type: criterion.type, value })
                                  })
                                })

                                // Check if this is a competitions category
                                const isCompetitions = category.type === 'competitions'
                                
                                // For competitions, check if all badge values are the same as item name (redundant)
                                const isRedundantHeading = isCompetitions && 
                                  allBadges.length > 0 && 
                                  allBadges.every(badge => badge.value === item.name)
                                
                                // Get additional context for competitions
                                const competitionContext = isCompetitions && item.context ? {
                                  ranking: item.context.ranking as string | undefined,
                                  year: item.context.year as number | undefined
                                } : null

                                return (
                                  <div key={itemIndex} className="space-y-2">
                                    {/* Only show heading if it's not redundant or if there's additional context */}
                                    {(!isRedundantHeading || (competitionContext && (competitionContext.ranking || competitionContext.year))) && (
                                      <div className="font-medium text-sm">{item.name}</div>
                                    )}
                                    
                                    {/* Display all badges in a compact row */}
                                    <div className="flex flex-wrap gap-1.5 items-center">
                                      {/* For competitions with redundant heading, show competition name as first badge */}
                                      {isRedundantHeading && !competitionContext && (
                                        <Badge 
                                          variant="outline" 
                                          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700 text-xs h-5 px-2 border font-medium"
                                        >
                                          {item.name}
                                        </Badge>
                                      )}
                                      
                                      {allBadges.map((badge, badgeIndex) => (
                                        <Badge 
                                          key={badgeIndex}
                                          variant="outline" 
                                          className={`${getCriterionColor(badge.type)} text-xs h-5 px-2 border`}
                                        >
                                          {badge.value}
                                        </Badge>
                                      ))}
                                      
                                      {/* Show additional context for competitions (ranking, year) */}
                                      {competitionContext && (
                                        <>
                                          {competitionContext.ranking && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                              {competitionContext.ranking}
                                            </span>
                                          )}
                                          {competitionContext.year && (
                                            <span className="text-xs text-muted-foreground">
                                              ({competitionContext.year})
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    
                                    {itemIndex < category.items.length - 1 && (
                                      <Separator className="my-2" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
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
