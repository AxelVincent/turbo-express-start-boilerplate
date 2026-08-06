import { cn } from "@/lib/utils"

const rules = [
  { label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { label: "1 uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "1 lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "1 number", test: (pw: string) => /[0-9]/.test(pw) },
] as const

function getStrength(password: string): number {
  return rules.filter((r) => r.test(password)).length
}

const strengthConfig = [
  { color: "bg-red-500", label: "Weak" },
  { color: "bg-red-500", label: "Weak" },
  { color: "bg-orange-500", label: "Fair" },
  { color: "bg-yellow-500", label: "Good" },
  { color: "bg-green-500", label: "Strong" },
] as const

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const strength = getStrength(password)
  const config = strengthConfig[strength]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < strength ? config.color : "bg-muted",
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>
      <ul className="space-y-0.5">
        {rules.map((rule) => {
          const met = rule.test(password)
          return (
            <li
              key={rule.label}
              className={cn(
                "text-xs",
                met ? "text-green-600" : "text-muted-foreground",
              )}
            >
              {met ? "\u2713" : "\u2022"} {rule.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
