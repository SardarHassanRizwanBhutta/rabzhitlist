"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { defaultHomePathForRole, isRecruiter } from "@/lib/auth/roles"
import type { UserRole } from "@/lib/types/user-role"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isLoading, user } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (searchParams.get("reason") === "session_expired") {
      toast.error("Your session expired. Please sign in again.")
    }
  }, [searchParams])

  React.useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const callback = searchParams.get("callbackUrl")
      const home = defaultHomePathForRole(user.role)
      router.replace(
        callback && callback.startsWith("/") && !isRecruiterBlockedCallback(callback, user.role)
          ? callback
          : home,
      )
    }
  }, [isLoading, isAuthenticated, user, router, searchParams])

  function isRecruiterBlockedCallback(path: string, role: UserRole): boolean {
    if (!isRecruiter(role)) return false
    return path === "/" || path.startsWith("/users")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const loggedIn = await login(email, password)
      const callback = searchParams.get("callbackUrl")
      const home = defaultHomePathForRole(loggedIn.role)
      router.replace(
        callback &&
          callback.startsWith("/") &&
          !isRecruiterBlockedCallback(callback, loggedIn.role)
          ? callback
          : home,
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-xl font-bold">Welcome to Rabz Hit List</h1>
            <p className="text-muted-foreground text-sm text-balance">
              Sign in with your organization email and password.
            </p>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@dplit.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>
          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <Field>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <p className="text-muted-foreground text-center text-xs text-balance">
        By continuing, you agree to use this application for authorized DPL work only.
      </p>
    </div>
  )
}
