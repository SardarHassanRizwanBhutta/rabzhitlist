"use client"

import * as React from "react"
import { ExternalLink, Download, Mail, Phone, MapPin, Github, Linkedin, User, Briefcase, DollarSign, Calendar, Tag } from "lucide-react"

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

interface CandidateDetailsModalProps {
  candidate: Candidate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CandidateDetailsModal({ 
  candidate, 
  open, 
  onOpenChange 
}: CandidateDetailsModalProps) {
  if (!candidate) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(date)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="size-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="size-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{candidate.name}</h2>
              <p className="text-sm text-muted-foreground">{candidate.currentJobTitle}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="flex items-center justify-between">
            <Badge className={CANDIDATE_STATUS_COLORS[candidate.status]}>
              {CANDIDATE_STATUS_LABELS[candidate.status]}
            </Badge>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${candidate.email}`}>
                  <Mail className="size-4" />
                  Email
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${candidate.mobileNo}`}>
                  <Phone className="size-4" />
                  Call
                </a>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="size-5" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                <p className="text-sm">{candidate.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">CNIC</label>
                <p className="text-sm font-mono">{candidate.cnic}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-sm">{candidate.email}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Mobile Number</label>
                <p className="text-sm">{candidate.mobileNo}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">City</label>
                <p className="text-sm flex items-center gap-1">
                  <MapPin className="size-4" />
                  {candidate.city}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Professional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="size-5" />
              Professional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Current Job Title</label>
                <p className="text-sm">{candidate.currentJobTitle}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Posting Title</label>
                <p className="text-sm">{candidate.postingTitle}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Current Salary</label>
                <p className="text-sm flex items-center gap-1">
                  <DollarSign className="size-4" />
                  {formatCurrency(candidate.currentSalary)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Expected Salary</label>
                <p className="text-sm flex items-center gap-1">
                  <DollarSign className="size-4" />
                  {formatCurrency(candidate.expectedSalary)}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Links and Resources */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ExternalLink className="size-5" />
              Resources
            </h3>
            <div className="flex flex-wrap gap-3">
              {candidate.githubUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="size-4" />
                    GitHub Profile
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              )}
              {candidate.linkedinUrl && (
                <Button variant="outline" size="sm" asChild>
                  <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer">
                    <Linkedin className="size-4" />
                    LinkedIn Profile
                    <ExternalLink className="size-3" />
                  </a>
                </Button>
              )}
              {candidate.resume && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`/resumes/${candidate.resume}`} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                    Download Resume
                  </a>
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* Application Meta Data */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Tag className="size-5" />
              Application Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Source</label>
                <p className="text-sm">{candidate.source}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Applied On</label>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="size-4" />
                  {formatDate(candidate.createdAt)}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="size-4" />
                  {formatDate(candidate.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


