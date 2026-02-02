import { GalleryVerticalEnd } from "lucide-react"

import { cn } from "@/lib/utils"
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
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <FieldGroup>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex size-8 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-6" />
            </div>
            <h1 className="text-xl font-bold">Welcome to Rabz Hit List</h1>
          </div>
          <Field>
            <FieldLabel htmlFor="email">Organization Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="john.d@wlsit.com"
              required
            />
          </Field>
          <Field>
            <Button type="submit">Send Verification Code</Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
