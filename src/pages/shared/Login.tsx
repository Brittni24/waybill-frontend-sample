import { KeyRound, LockKeyhole, Wifi } from 'lucide-react'
import * as React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/domain/BrandMark'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/input'
import { ACCOUNTS, ROLE_HOME, ROLE_LABEL } from '@/domain/accounts'
import { useStore } from '@/store/useStore'

export function Login() {
  const nav = useNavigate()
  const session = useStore((s) => s.session)
  const login = useStore((s) => s.login)
  const online = useStore((s) => s.world.d.online)
  const [user, setUser] = React.useState('')
  const [pin, setPin] = React.useState('')
  const [remember, setRemember] = React.useState(false)
  const [error, setError] = React.useState('')
  const [fails, setFails] = React.useState(0)
  const locked = fails >= 3

  if (session) return <Navigate to={ROLE_HOME[session.role]} replace />

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (locked) return
    const res = login(user, pin, remember)
    if (!res.ok) {
      setFails((n) => n + 1)
      setError(res.reason ?? 'Could not sign in.')
      setPin('')
      return
    }
    const acc = ACCOUNTS.find((a) => a.username === user.trim().toLowerCase())!
    nav(ROLE_HOME[acc.role])
  }

  return (
    <div data-mode="light" className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-primary p-10 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <BrandMark light className="text-primary-foreground" />
        <div className="max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.05]">One delivery day, four people, one plan.</h1>
          <p className="mt-4 text-lg opacity-90">
            Waypoint's dispatchers, loaders, drivers and store managers see the same trip, each in the way they work.
          </p>
          <ol className="mt-10 space-y-5">
            {['Orders close at 4 PM', 'The plan is built and explained', 'The dock loads in stop order', 'The driver delivers, even offline', 'The store confirms what arrived'].map((t, i) => (
              <li key={t} className="flex items-center gap-4">
                <span className="grid size-8 place-items-center rounded-full border-2 border-white/70 text-sm font-bold text-white">{i + 1}</span>
                <span className="font-medium">{t}</span>
              </li>
            ))}
          </ol>
        </div>
        <p className="text-sm opacity-70">Demo build with mock data. Tech-Triathlon 2026 Designathon.</p>
      </section>

      <section className="flex flex-col justify-center px-5 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="lg:hidden">
            <BrandMark />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Use your staff ID and 4-digit PIN.</p>
          </div>

          {!online && (
            <p className="flex items-start gap-2 rounded-md bg-offline-bg px-3 py-2 text-sm text-offline-fg">
              <Wifi className="mt-0.5 size-4 shrink-0" /> No signal. You can still sign in if you have signed in on this device before.
            </p>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <Field label="Staff ID">
              <Input big autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)} placeholder="for example kasun" disabled={locked} />
            </Field>
            <Field label="PIN" error={error}>
              <Input
                big
                type="password"
                inputMode="numeric"
                maxLength={4}
                autoComplete="current-password"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="4 digits"
                disabled={locked}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
              Remember this device (drivers on their own phone)
            </label>
            {locked ? (
              <div className="flex items-start gap-2 rounded-md bg-deferred-bg px-3 py-3 text-sm text-deferred-fg">
                <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                <p>Too many wrong PINs. This account is locked for now. Ask your dispatcher to reset your PIN.</p>
              </div>
            ) : (
              <Button type="submit" size="lg" block>
                <KeyRound /> Sign in
              </Button>
            )}
            {!locked && <p className="text-center text-xs text-muted-foreground">Forgot your PIN? Ask your dispatcher to reset it.</p>}
          </form>

          <div className="space-y-2 border-t pt-5">
            <p className="text-sm font-semibold">Demo accounts (PIN 1234)</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ACCOUNTS.map((a) => (
                <button
                  key={a.username}
                  type="button"
                  onClick={() => {
                    setUser(a.username)
                    setPin(a.pin)
                    setError('')
                    setFails(0)
                  }}
                  className="rounded-lg border bg-card p-3 text-left hover:bg-accent"
                >
                  <span className="block text-sm font-semibold">{a.name}</span>
                  <span className="block text-xs text-muted-foreground">{ROLE_LABEL[a.role]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
