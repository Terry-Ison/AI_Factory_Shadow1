import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { AuthFormShell } from './AuthFormShell'
import { SocialAuthButtons } from './SocialAuthButtons'

export function SignupForm({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <AuthFormShell className={className} {...props}>
        <form className="p-6 md:p-8" onSubmit={(e) => e.preventDefault()}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Create an account</h1>
              <p className="text-balance text-muted-foreground">
                Sign up for Ison Translate to start translating
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input id="name" type="text" placeholder="Jane Doe" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                id="signup-email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input id="signup-password" type="password" required />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
              <Input id="confirm-password" type="password" required />
            </Field>
            <Field>
              <Button type="submit" className="w-full">
                Sign up
              </Button>
            </Field>
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Or continue with
            </FieldSeparator>
            <SocialAuthButtons />
            <FieldDescription className="text-center">
              Already have an account?{' '}
              <Link to="/login" className="underline-offset-4 hover:underline">
                Login
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
    </AuthFormShell>
  )
}
