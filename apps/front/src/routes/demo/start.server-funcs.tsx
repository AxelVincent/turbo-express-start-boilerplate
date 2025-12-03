import fs from 'node:fs'
import { useCallback, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent } from '../../components/ui/card'

/*
const loggingMiddleware = createMiddleware().server(
  async ({ next, request }) => {
    console.log("Request:", request.url);
    return next();
  }
);
const loggedServerFunction = createServerFn({ method: "GET" }).middleware([
  loggingMiddleware,
]);
*/

const TODOS_FILE = 'todos.json'

async function readTodos() {
  return JSON.parse(
    await fs.promises.readFile(TODOS_FILE, 'utf-8').catch(() =>
      JSON.stringify(
        [
          { id: 1, name: 'Get groceries' },
          { id: 2, name: 'Buy a new phone' },
        ],
        null,
        2,
      ),
    ),
  )
}

const getTodos = createServerFn({
  method: 'GET',
}).handler(async () => await readTodos())

const addTodo = createServerFn({ method: 'POST' })
  .inputValidator((d: string) => d)
  .handler(async ({ data }) => {
    const todos = await readTodos()
    todos.push({ id: todos.length + 1, name: data })
    await fs.promises.writeFile(TODOS_FILE, JSON.stringify(todos, null, 2))
    return todos
  })

export const Route = createFileRoute('/demo/start/server-funcs')({
  component: Home,
  loader: async () => await getTodos(),
})

function Home() {
  const router = useRouter()
  let todos = Route.useLoaderData()

  const [todo, setTodo] = useState('')

  const submitTodo = useCallback(async () => {
    todos = await addTodo({ data: todo })
    setTodo('')
    router.invalidate()
  }, [addTodo, todo])

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-800 to-black p-4 text-white"
      style={{
        backgroundImage:
          'radial-gradient(50% 50% at 20% 60%, #23272a 0%, #18181b 50%, #000000 100%)',
      }}
    >
      <Card className="w-full max-w-2xl backdrop-blur-md bg-black/50 border-black/10">
        <CardContent className="p-8">
          <h1 className="text-2xl mb-4 text-white">Start Server Functions - Todo Example</h1>
          <ul className="mb-4 space-y-2">
            {todos?.map((t: { id: number; name: string }) => (
              <Card
                key={t.id}
                className="bg-white/10 border-white/20 backdrop-blur-sm"
              >
                <CardContent className="p-3">
                  <span className="text-lg text-white">{t.name}</span>
                </CardContent>
              </Card>
            ))}
          </ul>
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              value={todo}
              onChange={(e) => setTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  submitTodo()
                }
              }}
              placeholder="Enter a new todo..."
              className="border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder-white/60"
            />
            <Button
              disabled={todo.trim().length === 0}
              onClick={submitTodo}
            >
              Add todo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
