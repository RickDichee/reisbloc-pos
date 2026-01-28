import { supabase } from '@/lib/supabaseClient'

export default async function Home() {
  // Ejemplo: obtener usuarios de Supabase
  const { data: users, error } = await supabase.from('users').select('*').limit(5)

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-2xl font-bold">¡Next.js + Supabase listo!</h1>
      <div className="mt-8">
        <h2 className="font-semibold mb-2">Usuarios de ejemplo:</h2>
        {error && <div className="text-red-500">Error: {error.message}</div>}
        <ul>
          {users?.map((u: any) => (
            <li key={u.id}>{u.name} ({u.role})</li>
          ))}
        </ul>
      </div>
    </main>
  )
}
