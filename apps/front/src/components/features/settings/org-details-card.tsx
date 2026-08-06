import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, Pencil, X } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { organizationsKeys } from "@/lib/hooks/use-organizations"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const nameToSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")

interface OrgDetailsCardProps {
  orgId: string
  canEdit: boolean
}

export function OrgDetailsCard({ orgId, canEdit }: OrgDetailsCardProps) {
  const { data: orgData } = authClient.useActiveOrganization()
  const queryClient = useQueryClient()

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState("")
  const [editedSlug, setEditedSlug] = useState("")
  const [isSavingName, setIsSavingName] = useState(false)

  const handleStartEditing = () => {
    setEditedName(orgData?.name ?? "")
    setEditedSlug(orgData?.slug ?? "")
    setIsEditingName(true)
  }

  const handleSaveName = async () => {
    const trimmedName = editedName.trim()
    const trimmedSlug = editedSlug.trim()
    if (!trimmedName || !trimmedSlug) return
    if (trimmedName === orgData?.name && trimmedSlug === orgData?.slug) {
      setIsEditingName(false)
      return
    }
    setIsSavingName(true)
    try {
      await authClient.organization.update({
        data: { name: trimmedName, slug: trimmedSlug },
        organizationId: orgId,
      })
      queryClient.invalidateQueries({ queryKey: organizationsKeys.all })
      authClient.organization.setActive({ organizationId: orgId })
      toast.success("Organization updated")
      setIsEditingName(false)
    } catch (err) {
      toast.error("Failed to update organization", {
        description: err instanceof Error ? err.message : "Please try again",
      })
    } finally {
      setIsSavingName(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            {orgData?.logo && (
              <AvatarImage src={orgData.logo} alt={orgData.name} />
            )}
            <AvatarFallback className="text-xl">
              {orgData?.name?.charAt(0).toUpperCase() ?? "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            {isEditingName ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => {
                      setEditedName(e.target.value)
                      setEditedSlug(nameToSlug(e.target.value))
                    }}
                    className="h-8 w-60"
                    placeholder="Organization name"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") setIsEditingName(false)
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveName}
                    disabled={
                      !editedName.trim() || !editedSlug.trim() || isSavingName
                    }
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => setIsEditingName(false)}
                    disabled={isSavingName}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <span>/</span>
                  <Input
                    value={editedSlug}
                    onChange={(e) =>
                      setEditedSlug(
                        e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                      )
                    }
                    className="h-6 w-48 text-sm px-1"
                    placeholder="slug"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") setIsEditingName(false)
                    }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{orgData?.name}</h3>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground"
                      onClick={handleStartEditing}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  /{orgData?.slug}
                </p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
