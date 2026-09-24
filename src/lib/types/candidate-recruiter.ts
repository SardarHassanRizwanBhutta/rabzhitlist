import type {
  Candidate,
  MatchedWorkExperienceDto,
  WorkExperience,
} from "@/lib/types/candidate"
import type { CandidateListItemDto } from "@/lib/services/candidates-api"

/** List row for Recruiter — compensation keys absent on API JSON. */
export type CandidateRecruiterListItem = Omit<
  CandidateListItemDto,
  "currentSalary" | "expectedSalary"
> & {
  matchedWorkExperiences?: MatchedWorkExperienceRecruiter[]
}

export type MatchedWorkExperienceRecruiter = Omit<
  MatchedWorkExperienceDto,
  "salaryPolicy" | "benefits"
>

export type CandidateWorkExperienceRecruiter = Omit<
  WorkExperience,
  "salaryPolicy" | "benefits"
>

export type CandidateRecruiterDetail = Omit<
  Candidate,
  "currentSalary" | "expectedSalary" | "workExperiences"
> & {
  workExperiences?: CandidateWorkExperienceRecruiter[]
}
