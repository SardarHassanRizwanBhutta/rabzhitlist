import type { Achievement } from "@/lib/types/candidate"
import type { AchievementForService } from "@/types/question-generation"

function emptyToNull(value: string | null | undefined): string | null {
  if (value == null) return null
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

export function mapAchievementToServicePayload(
  achievement: Achievement,
): AchievementForService {
  return {
    name: emptyToNull(achievement.name),
    year: typeof achievement.year === "number" ? achievement.year : null,
    description: emptyToNull(achievement.description),
    achievementType: emptyToNull(achievement.achievementType),
    ranking: emptyToNull(achievement.ranking),
    url: emptyToNull(achievement.url),
  }
}
