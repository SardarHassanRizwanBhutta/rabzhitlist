import type { ElementType } from "react"
import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  Trophy,
  Code,
  FolderOpen,
  SlidersHorizontal,
} from "lucide-react"
import type { FieldSection } from "@/types/cold-caller"

export const COLD_CALLER_SECTION_ICONS: Record<FieldSection, ElementType> = {
  basic: User,
  workExperience: Briefcase,
  education: GraduationCap,
  certifications: Award,
  achievements: Trophy,
  techStacks: Code,
  projects: FolderOpen,
  preferences: SlidersHorizontal,
}
