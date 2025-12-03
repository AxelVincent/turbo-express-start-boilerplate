import { Link } from '@tanstack/react-router'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Home,
  Menu,
  Network,
  SquareFunction,
  StickyNote,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [groupedExpanded, setGroupedExpanded] = useState<
    Record<string, boolean>
  >({})

  return (
    <header className="p-4 flex items-center bg-gray-800 text-white shadow-lg">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-gray-700"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80 bg-gray-900 text-white border-gray-700">
          <SheetHeader>
            <SheetTitle className="text-white">Navigation</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 mt-4 overflow-y-auto">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
            >
              <Home size={20} />
              <span className="font-medium">Home</span>
            </Link>

            <Link
              to="/demo/start/server-funcs"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
            >
              <SquareFunction size={20} />
              <span className="font-medium">Start - Server Functions</span>
            </Link>

            <Link
              to="/demo/start/api-request"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
              activeProps={{
                className:
                  'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
              }}
            >
              <Network size={20} />
              <span className="font-medium">Start - API Request</span>
            </Link>

            <div className="flex flex-row justify-between">
              <Link
                to="/demo/start/ssr"
                onClick={() => setIsOpen(false)}
                className="flex-1 flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                activeProps={{
                  className:
                    'flex-1 flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                }}
              >
                <StickyNote size={20} />
                <span className="font-medium">Start - SSR Demos</span>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-gray-800"
                onClick={() =>
                  setGroupedExpanded((prev) => ({
                    ...prev,
                    StartSSRDemo: !prev.StartSSRDemo,
                  }))
                }
              >
                {groupedExpanded.StartSSRDemo ? (
                  <ChevronDown size={20} />
                ) : (
                  <ChevronRight size={20} />
                )}
              </Button>
            </div>
            {groupedExpanded.StartSSRDemo && (
              <div className="flex flex-col ml-4">
                <Link
                  to="/demo/start/ssr/spa-mode"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                  activeProps={{
                    className:
                      'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                  }}
                >
                  <StickyNote size={20} />
                  <span className="font-medium">SPA Mode</span>
                </Link>

                <Link
                  to="/demo/start/ssr/full-ssr"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                  activeProps={{
                    className:
                      'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                  }}
                >
                  <StickyNote size={20} />
                  <span className="font-medium">Full SSR</span>
                </Link>

                <Link
                  to="/demo/start/ssr/data-only"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
                  activeProps={{
                    className:
                      'flex items-center gap-3 p-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition-colors mb-2',
                  }}
                >
                  <StickyNote size={20} />
                  <span className="font-medium">Data Only</span>
                </Link>
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
      <h1 className="ml-4 text-xl font-semibold">
        <Link to="/">
          <img
            src="/tanstack-word-logo-white.svg"
            alt="TanStack Logo"
            className="h-10"
          />
        </Link>
      </h1>
    </header>
  )
}
