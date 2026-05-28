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

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <AuthFormShell className={className} {...props}>
        <form className="p-6 md:p-8" onSubmit={(e) => e.preventDefault()}>
          <FieldGroup>
            <div className="flex flex-col items-center gap-2 text-center">
              <h1 className="text-2xl font-bold">Welcome back</h1>
              <p className="text-balance text-muted-foreground">
                Login to your Transly account
              </p>
            </div>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </Field>
            <Field>
              <div className="flex items-center">
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Link
                  to="/forgot-password"
                  className="ml-auto text-sm underline-offset-2 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <Input id="password" type="password" required />
            </Field>
            <Field>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </Field>
            <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
              Or continue with
            </FieldSeparator>
            <SocialAuthButtons />
            <FieldDescription className="text-center">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="underline-offset-4 hover:underline">
                Sign up
              </Link>
            </FieldDescription>
          </FieldGroup>
        </form>
    </AuthFormShell>
  )
}
