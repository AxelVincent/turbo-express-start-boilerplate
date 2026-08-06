import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface OrgCardProps {
  org: { id: string; name: string; slug: string; role: string }
  onSelect: (_orgId: string) => void
}

export function OrgCard({ org, onSelect }: OrgCardProps) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onSelect(org.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            {org.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base truncate">{org.name}</CardTitle>
            <p className="text-xs text-muted-foreground">/{org.slug}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary" className="text-xs capitalize">
          {org.role}
        </Badge>
      </CardContent>
    </Card>
  )
}
