import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface UserSearchFormProps {
  defaultValue?: string
  onSubmit: (searchTerm: string) => void
  onClear: () => void
}

export function UserSearchForm({ defaultValue, onSubmit, onClear }: UserSearchFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const searchTerm = formData.get('search') as string
    onSubmit(searchTerm)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="text"
            name="search"
            defaultValue={defaultValue || ''}
            placeholder="Search by name or email..."
            className="flex-1"
          />
          <Button type="submit">Search</Button>
          {defaultValue && (
            <Button type="button" variant="secondary" onClick={onClear}>
              Clear
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
