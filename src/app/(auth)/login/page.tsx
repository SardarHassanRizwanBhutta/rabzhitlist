import Image from "next/image"
import { Suspense } from "react"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
              <LoginForm />
            </Suspense>
          </div>
        </div>
      </div>
      <div className="relative hidden items-center justify-center bg-black p-10 lg:flex">
        <Image
          src="/rebel-red-dpl.png"
          alt="DPLIT.COM REBEL logo"
          width={800}
          height={800}
          priority
          className="h-auto max-h-[min(75vh,520px)] w-full max-w-md object-contain"
        />
      </div>
    </div>
  )
}
