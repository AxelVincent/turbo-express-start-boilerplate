import { createFileRoute } from "@tanstack/react-router"
import { Separator } from "@/components/ui/separator"
import { ProfileSection } from "@/components/features/settings/profile-section"
import { ChangePasswordSection } from "@/components/features/settings/change-password-section"

export const Route = createFileRoute("/_auth/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-1">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and security.
        </p>
      </div>

      <ProfileSection />
      <Separator />
      <ChangePasswordSection />
    </div>
  )
}
