import { headers } from 'next/headers'

export const runtime = 'nodejs'

async function sync() {
  'use server'
  if (!process.env.ADMIN_SECRET) throw new Error('ADMIN_SECRET not set')

  const h = headers()
  const origin =
    process.env.NEXTAUTH_URL ||
    `${h.get('x-forwarded-proto') ?? 'https'}://${
      h.get('x-forwarded-host') ?? h.get('host') ?? process.env.VERCEL_URL
    }`

  const res = await fetch(`${origin}/api/admin/sync`, {
    method: 'POST',
    headers: { 'x-admin-secret': process.env.ADMIN_SECRET! },
    cache: 'no-store'
  })

  if (!res.ok) throw new Error('Sync failed')
  return res.json()
}

export default function AdminPage() {
  return (
    <form action={sync} className="grid gap-3">
      <h1 className="text-2xl font-bold">Admin</h1>
      <button className="btn">Sync Printful</button>
      <p className="text-sm text-gray-500">Runs a fresh sync from Printful → DB.</p>
    </form>
  )
}
