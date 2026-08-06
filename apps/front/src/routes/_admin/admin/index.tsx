import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_admin/admin/")({
  component: AdminDashboard,
})

function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <p className="text-muted-foreground mt-2">Welcome to the admin panel.</p>
    </div>
  )
}
