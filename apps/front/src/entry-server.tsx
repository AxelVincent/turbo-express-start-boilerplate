import { RouterProvider } from '@tanstack/react-router'
import { getRouter } from './router'

export default function render() {
  const router = getRouter()
  return <RouterProvider router={router} />
}
