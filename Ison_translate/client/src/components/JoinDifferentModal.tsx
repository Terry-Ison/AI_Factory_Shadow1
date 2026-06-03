import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/Input'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (sessionId: string) => void
}

export function JoinDifferentModal({ open, onOpenChange, onConfirm }: Props) {
  const [value, setValue] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const id = value.trim()
    if (!id) return
    onConfirm(id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join a session</DialogTitle>
          <DialogDescription>
            Enter the session ID shared by your partner. Your current session will be left.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Field>
            <FieldLabel htmlFor="session-id-input">Session ID</FieldLabel>
            <Input
              id="session-id-input"
              autoFocus
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. abc-123-xyz"
            />
          </Field>

          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!value.trim()}>
              Join
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
