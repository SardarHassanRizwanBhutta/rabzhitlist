"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  ExternalLink, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  Github, 
  Linkedin, 
  User, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  GraduationCap,
  Award,
  Building2,
  ChevronDown,
  ChevronRight,
  Code,
  FolderOpen,
  Clock,
  Globe
} from "lucide-react"

import { Candidate, CANDIDATE_STATUS_COLORS, CANDIDATE_STATUS_LABELS } from "@/lib/types/candidate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { sampleEmployers } from "@/lib/sample-data/employers"
import { sampleUniversities } from "@/lib/sample-data/universities"
import { sampleCertifications } from "@/lib/sample-data/certifications"
import { sampleProjects } from "@/lib/sample-data/projects"

interface CandidateDetailsModalProps {
  candidate: Candidate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Helper function to get job title from first work experience
const getJobTitle = (candidate: Candidate): string => {
  return candidate.workExperiences?.[0]?.jobTitle || "N/A"
}

export function CandidateDetailsModal({ 
  candidate, 
  open, 
  onOpenChange 
}: CandidateDetailsModalProps) {
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["basic", "work-experience", "independent-projects", "education", "certifications"]))

  if (!candidate) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Present"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    }).format(date)
  }

  const formatMonth = (date: Date | undefined) => {
    if (!date) return "Present"
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short'
    }).format(date)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handleEmployerClick = (employerName: string) => {
    // Find employer by name
    const employer = sampleEmployers.find(emp => 
      emp.name.trim().toLowerCase() === employerName.trim().toLowerCase()
    )
    if (employer) {
      const params = new URLSearchParams({
        employerFilter: employer.name,
        employerId: employer.id
      })
      router.push(`/employers?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const handleUniversityClick = (universityLocationId: string) => {
    // Find university by location ID
    const university = sampleUniversities.find(uni =>
      uni.locations.some(loc => loc.id === universityLocationId)
    )
    if (university) {
      const params = new URLSearchParams({
        universityFilter: university.name,
        universityId: university.id
      })
      router.push(`/universities?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const handleCertificationClick = (certificationId: string, certificationName: string) => {
    // Find certification by ID or name
    const certification = sampleCertifications.find(cert =>
      cert.id === certificationId || 
      cert.certificationName.trim().toLowerCase() === certificationName.trim().toLowerCase()
    )
    if (certification) {
      const params = new URLSearchParams({
        certificationFilter: certification.certificationName,
        certificationId: certification.id
      })
      router.push(`/certifications?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const handleProjectClick = (projectName: string) => {
    // Find project by name
    const project = sampleProjects.find(proj => 
      proj.projectName.trim().toLowerCase() === projectName.trim().toLowerCase()
    )
    if (project) {
      const params = new URLSearchParams({
        projectFilter: project.projectName,
        projectId: project.id
      })
      router.push(`/projects?${params.toString()}`)
      onOpenChange(false) // Close modal after navigation
    }
  }

  const workExperiences = candidate.workExperiences || []
  const independentProjects = candidate.projects || []
  const educations = candidate.educations || []
  const certifications = candidate.certifications || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[95vw] sm:!max-w-6xl lg:!max-w-4xl max-h-[95vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-8 pt-8 pb-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="size-14 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="size-7 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold mb-1">
                  {candidate.name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mb-2">{getJobTitle(candidate)}</p>
                <Badge className={CANDIDATE_STATUS_COLORS[candidate.status]}>
                  {CANDIDATE_STATUS_LABELS[candidate.status]}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 mr-12">
              {candidate.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${candidate.email}`}>
                    <Mail className="size-4" />
                  </a>
                </Button>
              )}
              {candidate.mobileNo && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${candidate.mobileNo}`}>
                    <Phone className="size-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-6">
          {/* Basic Information */}
          <Collapsible 
            open={expandedSections.has("basic")} 
            onOpenChange={() => toggleSection("basic")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="size-5" />
                      Basic Information
                    </CardTitle>
                    {expandedSections.has("basic") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <p className="text-base font-medium">{candidate.name}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">City</label>
                      <p className="text-base flex items-center gap-2">
                        <MapPin className="size-4" />
                        {candidate.city}
                      </p>
                    </div>
                    <div className="space-y-2 md:col-span-2 lg:col-span-1">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-base break-words">{candidate.email}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Contact Number</label>
                      <p className="text-base">{candidate.mobileNo}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">CNIC</label>
                      <p className="text-base font-mono">{candidate.cnic || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Posting Title</label>
                      <p className="text-base">{candidate.postingTitle || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Current Salary</label>
                      <p className="text-base flex items-center gap-2">
                        <DollarSign className="size-4" />
                        {candidate.currentSalary ? formatCurrency(candidate.currentSalary) : "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Expected Salary</label>
                      <p className="text-base flex items-center gap-2">
                        <DollarSign className="size-4" />
                        {candidate.expectedSalary ? formatCurrency(candidate.expectedSalary) : "N/A"}
                      </p>
                    </div>
                  </div>

                  {(candidate.githubUrl || candidate.linkedinUrl || candidate.resume) && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground">Links & Resources</label>
                        <div className="flex flex-wrap gap-2">
                          {candidate.githubUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer">
                                <Github className="size-4" />
                                GitHub
                                <ExternalLink className="size-3" />
                              </a>
                            </Button>
                          )}
                          {candidate.linkedinUrl && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                                <Linkedin className="size-4" />
                                LinkedIn
                                <ExternalLink className="size-3" />
                              </a>
                            </Button>
                          )}
                          {candidate.resume && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={candidate.resume} target="_blank" rel="noopener noreferrer">
                                <Download className="size-4" />
                                Resume
                                <ExternalLink className="size-3" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Source</label>
                      <p className="text-base">{candidate.source}</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Applied On</label>
                      <p className="text-base flex items-center gap-2">
                        <Calendar className="size-4" />
                        {formatDate(candidate.createdAt)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                      <p className="text-base flex items-center gap-2">
                        <Calendar className="size-4" />
                        {formatDate(candidate.updatedAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Work Experience */}
          <Collapsible 
            open={expandedSections.has("work-experience")} 
            onOpenChange={() => toggleSection("work-experience")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="size-5" />
                      Work Experience
                      {workExperiences.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {workExperiences.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("work-experience") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {workExperiences.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No work experience recorded</p>
                  ) : (
                    workExperiences.map((experience, idx) => (
                      <div key={experience.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Building2 className="size-5 text-muted-foreground" />
                                <button
                                  onClick={() => handleEmployerClick(experience.employerName)}
                                  className="font-semibold text-lg hover:text-primary hover:underline transition-colors text-left cursor-pointer"
                                  title={`View ${experience.employerName} details`}
                                >
                                  {experience.employerName}
                                </button>
                              </div>
                              <p className="text-base text-muted-foreground ml-7">{experience.jobTitle}</p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              <p>{formatDate(experience.startDate)} - {formatDate(experience.endDate)}</p>
                            </div>
                          </div>

                          <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {experience.shiftType && (
                              <div className="flex items-center gap-2">
                                <Clock className="size-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Shift:</span>
                                <span>{experience.shiftType}</span>
                              </div>
                            )}
                            {experience.workMode && (
                              <div className="flex items-center gap-2">
                                <Globe className="size-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Mode:</span>
                                <span>{experience.workMode}</span>
                              </div>
                            )}
                            {experience.timeSupportZones.length > 0 && (
                              <div className="flex items-center gap-2 sm:col-span-2">
                                <Globe className="size-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Time Zones:</span>
                                <div className="flex gap-1.5">
                                  {experience.timeSupportZones.map((zone, i) => (
                                    <Badge key={i} variant="outline" className="text-sm">
                                      {zone}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {experience.techStacks.length > 0 && (
                            <div className="ml-7">
                              <div className="flex items-center gap-2 mb-3">
                                <Code className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Tech Stacks</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {experience.techStacks.map((tech, i) => (
                                  <Badge key={i} variant="secondary" className="text-sm">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {experience.projects.length > 0 && (
                            <div className="ml-7 space-y-3">
                              <div className="flex items-center gap-2 mb-3">
                                <FolderOpen className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-muted-foreground">Projects ({experience.projects.length})</span>
                              </div>
                              <div className="space-y-3">
                                {experience.projects.map((project) => (
                                  <div key={project.id} className="border rounded-md p-4 bg-muted/30">
                                    <button
                                      onClick={() => handleProjectClick(project.projectName)}
                                      className="text-base font-medium mb-2 hover:text-primary hover:underline transition-colors text-left cursor-pointer block"
                                      title={`View ${project.projectName || "Unnamed Project"} details`}
                                    >
                                      {project.projectName || "Unnamed Project"}
                                    </button>
                                    {project.contributionNotes && (
                                      <p className="text-sm text-muted-foreground">{project.contributionNotes}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Independent Projects */}
          <Collapsible 
            open={expandedSections.has("independent-projects")} 
            onOpenChange={() => toggleSection("independent-projects")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="size-5" />
                      Projects
                      {independentProjects.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {independentProjects.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("independent-projects") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {independentProjects.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No projects recorded</p>
                  ) : (
                    independentProjects.map((project, idx) => (
                      <div key={project.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <button
                                onClick={() => handleProjectClick(project.projectName)}
                                className="font-semibold text-lg mb-2 hover:text-primary hover:underline transition-colors text-left block cursor-pointer"
                                title={`View ${project.projectName || "Unnamed Project"} details`}
                              >
                                {project.projectName || "Unnamed Project"}
                              </button>
                              {project.contributionNotes && (
                                <p className="text-sm text-muted-foreground mt-2">{project.contributionNotes}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Education */}
          <Collapsible 
            open={expandedSections.has("education")} 
            onOpenChange={() => toggleSection("education")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="size-5" />
                      Education
                      {educations.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {educations.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("education") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {educations.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No education records</p>
                  ) : (
                    educations.map((education, idx) => (
                      <div key={education.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <button
                                onClick={() => handleUniversityClick(education.universityLocationId)}
                                className="font-semibold text-lg mb-2 hover:text-primary hover:underline transition-colors text-left block cursor-pointer"
                                title={`View ${education.universityLocationName} details`}
                              >
                                {education.universityLocationName}
                              </button>
                              <div className="flex items-center gap-2 text-base text-muted-foreground">
                                <span>{education.degreeName}</span>
                                {education.majorName && (
                                  <>
                                    <span>•</span>
                                    <span>{education.majorName}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-right text-sm text-muted-foreground whitespace-nowrap">
                              <p>{formatMonth(education.startMonth)} - {formatMonth(education.endMonth)}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            {education.grades && (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Grades:</span>
                                <Badge variant="outline" className="text-sm">{education.grades}</Badge>
                              </div>
                            )}
                            {education.isTopper === true && (
                              <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600 text-sm">
                                Topper
                              </Badge>
                            )}
                            {education.isCheetah === true && (
                              <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-sm">
                                Cheetah
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Certifications */}
          <Collapsible 
            open={expandedSections.has("certifications")} 
            onOpenChange={() => toggleSection("certifications")}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="size-5" />
                      Certifications
                      {certifications.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {certifications.length}
                        </Badge>
                      )}
                    </CardTitle>
                    {expandedSections.has("certifications") ? (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-6">
                  {certifications.length === 0 ? (
                    <p className="text-base text-muted-foreground text-center py-6">No certifications recorded</p>
                  ) : (
                    certifications.map((cert, idx) => (
                      <div key={cert.id}>
                        {idx > 0 && <Separator className="my-6" />}
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <button
                                onClick={() => handleCertificationClick(cert.certificationId, cert.certificationName)}
                                className="font-semibold text-lg mb-2 hover:text-primary hover:underline transition-colors text-left block cursor-pointer"
                                title={`View ${cert.certificationName} details`}
                              >
                                {cert.certificationName}
                              </button>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {cert.issueDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="size-4" />
                                    <span>Issued: {formatDate(cert.issueDate)}</span>
                                  </div>
                                )}
                                {cert.expiryDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="size-4" />
                                    <span>Expires: {formatDate(cert.expiryDate)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          {cert.certificationUrl && (
                            <Button variant="outline" size="default" asChild className="cursor-pointer">
                              <a href={cert.certificationUrl} target="_blank" rel="noopener noreferrer">
                                View Certificate
                                <ExternalLink className="size-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </DialogContent>
    </Dialog>
  )
}
