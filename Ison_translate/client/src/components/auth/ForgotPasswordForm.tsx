import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AuthFormShell } from './AuthFormShell'

export function ForgotPasswordForm({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <AuthFormShell className={className} {...props}>
        <form className="p-6 md:p-8" onSubmit={(e) => e.preventDefault()}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Forgot password?</h1>
              <p className="text-balance text-muted-foreground">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="reset-email">Email</FieldLabel>
              <Input
                id="reset-email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </Field>
            <Field>
              <Button type="submit" className="w-full">
                Send reset link
              </Button>
            </Field>
            <FieldDescription className="text-center">
              Remember your password?{' '}
              <Link to="/login" className="underline-offset-4 hover:underline">
                Back to login
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
    </AuthFormShell>
  )
}
