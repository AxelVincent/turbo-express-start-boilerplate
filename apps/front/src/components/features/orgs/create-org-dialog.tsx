import { useState } from "react"
import { toast } from "sonner"
import { useCreateOrganization } from "@/lib/hooks/use-organizations"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

interface CreateOrgDialogProps {
  open: boolean
  onOpenChange: (_open: boolean) => void
  onCreated: (_orgId: string) => void
}

export function CreateOrgDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateOrgDialogProps) {
  const createOrg = useCreateOrganization()
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")

  const handleNameChange = (value: string) => {
    setName(value)
    setSlug(slugify(value))
  }

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return
    try {
      const result = await createOrg.mutateAsync({
        name: name.trim(),
        slug: slug
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, "-"),
      })
      onOpenChange(false)
      setName("")
      setSlug("")
      if (result?.data?.id) {
        onCreated(result.data.id)
      }
    } catch (err) {
      toast.error("Failed to create organization", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>Create a new organization.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="My Organization"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-slug">Slug</Label>
            <Input
              id="org-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="my-organization"
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs. Only lowercase letters, numbers, and hyphens.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || !slug.trim() || createOrg.isPending}
          >
            {createOrg.isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
