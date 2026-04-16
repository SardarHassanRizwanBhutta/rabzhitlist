"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Loader2, Sparkles, User, Briefcase, Code, FolderOpen, GraduationCap, Award, Trophy } from "lucide-react"
import { toast } from "sonner"
import { assertFlaskResumeParseResponse, parseResume } from "@/lib/services/resume-parser-api"
import {
  hasPrefillContent,
  resumeJsonToPartialCandidateForm,
} from "@/lib/candidate/resume-to-candidate-form"
import type {
  CandidateEducation,
  CandidateFormData,
  WorkExperience,
} from "@/components/candidate-creation-dialog"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

export interface ResumeParserDialogProps {
  /** Called with mapped partial form when user applies parsed resume to Create Candidate. */
  onApplyToCreateCandidate: (partial: Partial<CandidateFormData>) => void
  children?: React.ReactNode
}

/** Fixed cap so tab panels scroll reliably (flex + h-full often never constrains height inside dialogs). */
const TAB_PANEL_SCROLL_CLASS =
  "max-h-[min(68vh,34rem)] min-h-[14rem] overflow-y-auto overflow-x-hidden overscroll-contain"

function formatWorkExperienceDateRange(we: WorkExperience): string | null {
  const startS = we.startDate ? format(we.startDate, "MMM yyyy") : ""
  const endS = we.endDate
    ? format(we.endDate, "MMM yyyy")
    : we.startDate
      ? "Present"
      : ""
  if (!startS && !endS) return null
  return `${startS || "—"} — ${endS || "—"}`
}

/** Education entries use year granularity (e.g. API `start_year` / `end_year` → form `startMonth` / `endMonth`). */
function formatEducationYearRange(e: CandidateEducation): string | null {
  const startS = e.startMonth ? format(e.startMonth, "yyyy") : ""
  const endS = e.endMonth ? format(e.endMonth, "yyyy") : ""
  if (!startS && !endS) return null
  return `${startS || "—"} — ${endS || "—"}`
}

function TabPanelState({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex min-h-[10rem] flex-col items-center justify-center gap-2 px-4 py-8 text-center text-sm text-muted-foreground",
        className
      )}
    >
      {children}
    </div>
  )
}

export function ResumeParserDialog({ onApplyToCreateCandidate, children }: ResumeParserDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [file, setFile] = React.useState<File | null>(null)
  const [parsing, setParsing] = React.useState(false)
  const [parsed, setParsed] = React.useState<unknown>(null)
  const [parseError, setParseError] = React.useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const resetSession = () => {
    setFile(null)
    setParsed(null)
    setParseError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) resetSession()
  }

  const runParse = (body: unknown): void => {
    try {
      assertFlaskResumeParseResponse(body)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid parser response"
      setParsed(null)
      setParseError(msg)
      toast.error(msg)
      return
    }
    const partial = resumeJsonToPartialCandidateForm(body)
    if (!hasPrefillContent(partial)) {
      const msg = "Could not map response to candidate fields."
      setParsed(null)
      setParseError(msg)
      toast.error(msg)
      return
    }
    setParseError(null)
    setParsed(body)
    toast.success("Resume parsed. Review below, then apply to Create Candidate.")
  }

  const handleParseFile = async () => {
    if (!file) {
      toast.error("Choose a resume file first (e.g. PDF or TXT).")
      return
    }
    setParsing(true)
    setParseError(null)
    try {
      const data = await parseResume(file)
      runParse(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Parse failed"
      setParsed(null)
      setParseError(msg)
      toast.error(msg)
    } finally {
      setParsing(false)
    }
  }

  const handleApply = () => {
    if (!parsed) return
    const partial = resumeJsonToPartialCandidateForm(parsed)
    if (!hasPrefillContent(partial)) {
      toast.error("Nothing to apply.")
      return
    }
    onApplyToCreateCandidate(partial)
    handleOpenChange(false)
    toast.message("Create Candidate opened with imported fields. Link employers and projects in the form.")
  }

  const partial = parsed ? resumeJsonToPartialCandidateForm(parsed) : null

  let previewBody: React.ReactNode
  if (parsing) {
    previewBody = (
      <TabPanelState>
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <span className="text-foreground">Parsing resume…</span>
      </TabPanelState>
    )
  } else if (parseError) {
    previewBody = (
      <TabPanelState className="text-destructive">
        <span className="font-medium text-destructive">Could not parse resume</span>
        <span className="max-w-md text-muted-foreground">{parseError}</span>
      </TabPanelState>
    )
  } else if (partial) {
    previewBody = (
      <div className="space-y-3 p-3 pr-2">
        {(partial.name ||
          partial.email ||
          partial.contactNumber ||
          partial.city ||
          partial.postingTitle ||
          partial.linkedinUrl ||
          partial.githubUrl) && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" /> Basic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0 text-sm">
              {partial.name && (
                <p>
                  <span className="text-muted-foreground">Name:</span> {partial.name}
                </p>
              )}
              {partial.email && (
                <p>
                  <span className="text-muted-foreground">Email:</span> {partial.email}
                </p>
              )}
              {partial.contactNumber && (
                <p>
                  <span className="text-muted-foreground">Phone:</span> {partial.contactNumber}
                </p>
              )}
              {partial.city && (
                <p>
                  <span className="text-muted-foreground">City:</span> {partial.city}
                </p>
              )}
              {partial.postingTitle && (
                <p>
                  <span className="text-muted-foreground">Headline:</span> {partial.postingTitle}
                </p>
              )}
              {partial.linkedinUrl && (
                <p className="break-all">
                  <span className="text-muted-foreground">LinkedIn:</span> {partial.linkedinUrl}
                </p>
              )}
              {partial.githubUrl && (
                <p className="break-all">
                  <span className="text-muted-foreground">GitHub:</span> {partial.githubUrl}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {(partial.techStacks?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Code className="h-4 w-4" /> Tech stacks
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1 pt-0">
              {partial.techStacks!.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {(partial.workExperiences?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4" /> Work experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              {partial.workExperiences!.map((we) => {
                const range = formatWorkExperienceDateRange(we)
                return (
                  <div key={we.id} className="space-y-2 rounded-md border p-3">
                    {we.jobTitle ? (
                      <p className="font-medium leading-snug text-foreground">{we.jobTitle}</p>
                    ) : null}
                    {we.employerName ? (
                      <p className="text-sm text-muted-foreground">{we.employerName}</p>
                    ) : null}
                    {range ? <p className="text-xs text-muted-foreground">{range}</p> : null}
                    {(we.techStacks?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {we.techStacks!.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px] font-normal">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                    {we.projects?.length ? (
                      <ul className="list-inside list-disc space-y-1 text-xs text-muted-foreground">
                        {we.projects.map((p) => (
                          <li key={p.id}>
                            <span className="text-foreground">{p.projectName}</span>
                            {p.contributionNotes ? (
                              <span className="mt-0.5 block font-normal text-muted-foreground">
                                {p.contributionNotes}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {(partial.projects?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FolderOpen className="h-4 w-4" /> Projects
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="list-inside list-disc text-sm">
                {partial.projects!.map((p) => (
                  <li key={p.id}>{p.projectName}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(partial.educations?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4" /> Education
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0 text-sm">
              {partial.educations!.map((e) => {
                const yearRange = formatEducationYearRange(e)
                return (
                  <div key={e.id} className="space-y-1">
                    <p>
                      {e.universityLocationName}
                      {(e.degreeName || e.majorName) && " — "}
                      {e.degreeName} {e.majorName}
                    </p>
                    {yearRange ? (
                      <p className="text-xs text-muted-foreground">{yearRange}</p>
                    ) : null}
                    {e.grades ? (
                      <p className="text-xs text-muted-foreground">Grades: {e.grades}</p>
                    ) : null}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {(partial.certifications?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="h-4 w-4" /> Certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0 text-sm">
              {partial.certifications!.map((c) => (
                <div key={c.id}>{c.certificationName}</div>
              ))}
            </CardContent>
          </Card>
        )}

        {(partial.achievements?.length ?? 0) > 0 && (
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 pt-0 text-sm">
              {partial.achievements!.map((a) => (
                <div key={a.id}>{a.name}</div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    )
  } else {
    previewBody = (
      <TabPanelState>
        <span className="max-w-xs text-foreground">No preview yet</span>
        <span>Choose a file and select Parse resume to see mapped candidate fields here.</span>
      </TabPanelState>
    )
  }

  let rawBody: React.ReactNode
  if (parsing) {
    rawBody = (
      <TabPanelState>
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
        <span className="text-foreground">Waiting for parser response…</span>
      </TabPanelState>
    )
  } else if (parseError) {
    rawBody = (
      <TabPanelState className="items-stretch text-left">
        <span className="text-center font-medium text-destructive">Error details</span>
        <pre className="max-h-48 overflow-y-auto rounded-md border bg-background p-3 font-mono text-xs text-destructive whitespace-pre-wrap">
          {parseError}
        </pre>
      </TabPanelState>
    )
  } else if (parsed != null) {
    rawBody = (
      <pre className="break-all font-mono text-xs whitespace-pre-wrap">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    )
  } else {
    rawBody = (
      <TabPanelState>
        <span className="max-w-xs text-foreground">No response yet</span>
        <span>Raw JSON from the parser will appear here after a successful parse.</span>
      </TabPanelState>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children ?? (
          <Button type="button" variant="outline" className="cursor-pointer">
            <FileText className="h-4 w-4 mr-2" />
            Resume Parser
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="flex min-h-0 max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[640px] lg:max-w-[720px]">
        <DialogHeader className="shrink-0 border-b px-6 pb-3 pt-5">
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Sparkles className="h-5 w-5 shrink-0 text-primary" />
            Resume Parser
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose a resume file, parse it, review the preview, then apply to create a candidate.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 space-y-2 px-6 py-3">
            <Label>Resume file</Label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.rtf,.doc,.docx,application/pdf,text/plain,application/rtf"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null)
                  setParsed(null)
                  setParseError(null)
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Choose file
              </Button>
              {file && (
                <span className="max-w-[240px] truncate text-sm text-muted-foreground" title={file.name}>
                  {file.name}
                </span>
              )}
              <Button type="button" size="sm" onClick={() => void handleParseFile()} disabled={parsing || !file}>
                {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Parse resume
              </Button>
            </div>
          </div>

          <Tabs defaultValue="preview" className="flex min-h-0 flex-1 flex-col gap-0 border-t border-border/60 px-6 pb-2 pt-3">
            <TabsList className="mb-2 h-9 w-full shrink-0 justify-start sm:w-auto">
              <TabsTrigger value="preview" className="px-3">
                Preview
              </TabsTrigger>
              <TabsTrigger value="raw" className="px-3">
                Raw JSON
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="preview"
              className={`mt-0 rounded-md border border-border bg-muted/20 outline-none data-[state=inactive]:hidden ${TAB_PANEL_SCROLL_CLASS}`}
            >
              {previewBody}
            </TabsContent>
            <TabsContent
              value="raw"
              className={`mt-0 rounded-md border bg-muted/30 p-3 outline-none data-[state=inactive]:hidden ${TAB_PANEL_SCROLL_CLASS}`}
            >
              {rawBody}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
            Close
          </Button>
          <Button type="button" onClick={handleApply} disabled={!parsed || parsing}>
            Apply to Create Candidate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
