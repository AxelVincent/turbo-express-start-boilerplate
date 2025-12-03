import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface UsersPaginationProps {
  currentPage: number
  pageSize: number
  total: number
  usersCount: number
  onPageChange: (page: number) => void
}

export function UsersPagination({
  currentPage,
  pageSize,
  total,
  usersCount,
  onPageChange,
}: UsersPaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = usersCount > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const endIndex = Math.min(currentPage * pageSize, total)

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex} to {endIndex} of {total} users
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="px-4 py-2 text-sm border rounded-md bg-background">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
