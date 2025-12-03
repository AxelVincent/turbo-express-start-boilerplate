import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CreateUserInput } from '@repo/api/routes_web/users/add_user/contract'

interface CreateUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (input: CreateUserInput) => Promise<void>
  isSubmitting: boolean
}

export function CreateUserDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting,
}: CreateUserDialogProps) {
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const input: CreateUserInput = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    }

    await onSubmit(input)
    event.currentTarget.reset()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>+ Add New User</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new user to the directory</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              placeholder="Enter user name"
              autoComplete="name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Enter user email"
              autoComplete="email"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
