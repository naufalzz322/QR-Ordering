'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UtensilsCrossed, AlertCircle, Loader2 } from 'lucide-react'

const demoCredentials = [
  {
    id: 'admin',
    label: 'Admin / Owner',
    description: 'Akses penuh ke panel admin',
    email: 'admin@warungnusantara.com',
    password: 'admin123',
  },
]

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const [selectedCredential, setSelectedCredential] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCredentialSelect = (credentialId: string) => {
    const credential = demoCredentials.find((option) => option.id === credentialId)
    if (!credential) return

    setSelectedCredential(credentialId)
    setEmail(credential.email)
    setPassword(credential.password)
    setError('')
  }

  // Redirect to admin if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/admin')
    }
  }, [status, router])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-admin-bg flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary-700" />
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Email atau password salah')
        setLoading(false)
      } else if (result?.ok) {
        router.push('/admin')
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-admin-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary-700" />
          </div>
          <CardTitle className="text-2xl">QR Ordering Admin</CardTitle>
          <CardDescription>Masuk untuk mengelola restoran Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-error-600 bg-error-50 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="demo-credential">Pilih akun demo</Label>
              <Select value={selectedCredential} onValueChange={handleCredentialSelect}>
                <SelectTrigger id="demo-credential" aria-label="Pilih akun demo">
                  <SelectValue placeholder="Pilih akun untuk mengisi login" />
                </SelectTrigger>
                <SelectContent>
                  {demoCredentials.map((credential) => (
                    <SelectItem key={credential.id} value={credential.id}>
                      <span className="font-medium">{credential.label}</span>
                      <span className="ml-2 text-neutral-500">— {credential.description}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-neutral-500">Memilih akun akan mengisi email dan password demo.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@warungnusantara.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setSelectedCredential('')
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setSelectedCredential('')
                }}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  )
}
