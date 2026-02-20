const mockSignInWithPassword = jest.fn()
const mockSignUp = jest.fn()
const mockResetPasswordForEmail = jest.fn()
const mockUpdateUser = jest.fn()
const mockSignOut = jest.fn()
const mockGetUser = jest.fn()

const mockSupabase = {
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signUp: mockSignUp,
    resetPasswordForEmail: mockResetPasswordForEmail,
    updateUser: mockUpdateUser,
    signOut: mockSignOut,
    getUser: mockGetUser,
  },
}

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

const mockRevalidatePath = jest.fn()
const mockRedirect = jest.fn()
const mockHeadersGet = jest.fn()

jest.mock('next/cache', () => ({ revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args) }))
jest.mock('next/navigation', () => ({ redirect: (...args: unknown[]) => mockRedirect(...args) }))
jest.mock('next/headers', () => ({
  headers: jest.fn(() => Promise.resolve({ get: mockHeadersGet })),
}))

import { login, signup, forgotPassword, resetPassword, logout } from '@/actions/auth'

describe('login', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when email is empty', async () => {
    const fd = new FormData()
    fd.set('email', '')
    fd.set('password', 'secret')
    const result = await login(null, fd)
    expect(result).toEqual({ error: 'El correo es requerido' })
  })

  it('returns error when email is invalid', async () => {
    const fd = new FormData()
    fd.set('email', 'bad')
    fd.set('password', 'secret')
    const result = await login(null, fd)
    expect(result).toEqual({ error: 'Correo inválido' })
  })

  it('returns error when password is empty', async () => {
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', '')
    const result = await login(null, fd)
    expect(result).toEqual({ error: 'La contraseña es requerida' })
  })

  it('returns error when supabase signIn fails', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', 'secret')
    const result = await login(null, fd)
    expect(result).toEqual({ error: 'Invalid credentials' })
  })

  it('revalidates and redirects on success', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', 'secret')
    await login(null, fd)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })
})

describe('signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeadersGet.mockReturnValue('http://localhost:3001')
  })

  it('returns error when email is invalid', async () => {
    const fd = new FormData()
    fd.set('email', 'bad')
    fd.set('password', 'password123')
    fd.set('confirmPassword', 'password123')
    const result = await signup(null, fd)
    expect(result).toEqual({ error: 'Correo inválido' })
  })

  it('returns error when password is too short', async () => {
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', 'short')
    fd.set('confirmPassword', 'short')
    const result = await signup(null, fd)
    expect(result).toEqual({ error: 'La contraseña debe tener al menos 8 caracteres' })
  })

  it('returns error when passwords do not match', async () => {
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', 'password123')
    fd.set('confirmPassword', 'different')
    const result = await signup(null, fd)
    expect(result).toEqual({ error: 'Las contraseñas no coinciden' })
  })

  it('returns error when supabase signUp fails', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already registered' } })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', 'password123')
    fd.set('confirmPassword', 'password123')
    const result = await signup(null, fd)
    expect(result).toEqual({ error: 'Email already registered' })
  })

  it('returns success and passes correct emailRedirectTo', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', 'password123')
    fd.set('confirmPassword', 'password123')
    const result = await signup(null, fd)
    expect(result).toEqual({ success: true })
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: 'http://localhost:3001/auth/confirm' },
      })
    )
  })

  it('uses empty string as origin when header is null', async () => {
    mockHeadersGet.mockReturnValue(null)
    mockSignUp.mockResolvedValue({ error: null })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    fd.set('password', 'password123')
    fd.set('confirmPassword', 'password123')
    await signup(null, fd)
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { emailRedirectTo: '/auth/confirm' },
      })
    )
  })
})

describe('forgotPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeadersGet.mockReturnValue('http://localhost:3001')
  })

  it('returns error when email is invalid', async () => {
    const fd = new FormData()
    fd.set('email', 'bad')
    const result = await forgotPassword(null, fd)
    expect(result).toEqual({ error: 'Correo inválido' })
  })

  it('returns error when supabase resetPasswordForEmail fails', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    const result = await forgotPassword(null, fd)
    expect(result).toEqual({ error: 'Rate limit exceeded' })
  })

  it('returns success and passes correct redirectTo', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    const result = await forgotPassword(null, fd)
    expect(result).toEqual({ success: true })
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'doctor@hospital.com',
      { redirectTo: 'http://localhost:3001/auth/confirm?next=/reset-password' }
    )
  })

  it('uses empty string as origin when header is null', async () => {
    mockHeadersGet.mockReturnValue(null)
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    const fd = new FormData()
    fd.set('email', 'doctor@hospital.com')
    await forgotPassword(null, fd)
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      'doctor@hospital.com',
      { redirectTo: '/auth/confirm?next=/reset-password' }
    )
  })
})

describe('resetPassword', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when password is too short', async () => {
    const fd = new FormData()
    fd.set('password', 'short')
    fd.set('confirmPassword', 'short')
    const result = await resetPassword(null, fd)
    expect(result).toEqual({ error: 'La contraseña debe tener al menos 8 caracteres' })
  })

  it('returns error when passwords do not match', async () => {
    const fd = new FormData()
    fd.set('password', 'newpassword')
    fd.set('confirmPassword', 'different')
    const result = await resetPassword(null, fd)
    expect(result).toEqual({ error: 'Las contraseñas no coinciden' })
  })

  it('returns error when supabase updateUser fails', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Session expired' } })
    const fd = new FormData()
    fd.set('password', 'newpassword')
    fd.set('confirmPassword', 'newpassword')
    const result = await resetPassword(null, fd)
    expect(result).toEqual({ error: 'Session expired' })
  })

  it('revalidates and redirects on success', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    const fd = new FormData()
    fd.set('password', 'newpassword')
    fd.set('confirmPassword', 'newpassword')
    await resetPassword(null, fd)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRedirect).toHaveBeenCalledWith('/')
  })
})

describe('logout', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls signOut, revalidates, and redirects to /login', async () => {
    mockSignOut.mockResolvedValue({})
    await logout()
    expect(mockSignOut).toHaveBeenCalled()
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
