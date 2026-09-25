import { cn } from "@/lib/utils"
import { userInitials } from "@/lib/utils/user-initials"

export type UserAvatarProps = {
  name: string
  email: string
  className?: string
  /** Default matches sidebar; use `profile` for the large profile header circle. */
  variant?: "sidebar" | "profile"
}

export function UserAvatar({
  name,
  email,
  className,
  variant = "sidebar",
}: UserAvatarProps) {
  const initials = userInitials(name, email)
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center font-medium",
        variant === "sidebar" &&
          "size-8 rounded-lg bg-sidebar-primary text-xs text-sidebar-primary-foreground",
        variant === "profile" &&
          "size-20 rounded-full bg-muted text-xl text-muted-foreground ring-1 ring-border",
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  )
}
