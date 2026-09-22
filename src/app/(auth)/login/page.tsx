import { Suspense } from "react"
import { LoginBrandHeader, LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <LoginBrandHeader />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-primary/10 dark:from-primary/10 dark:via-muted dark:to-background"
          aria-hidden
        />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <p className="text-muted-foreground max-w-md text-center text-lg font-medium">
            Discover and showcase exceptional talent through innovative challenges and projects.
          </p>
        </div>
      </div>
    </div>
  )
}
