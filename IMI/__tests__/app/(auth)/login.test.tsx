import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'

const mockReplace = jest.fn()
const mockBack = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: (...a: unknown[]) => mockBack(...a), push: (...a: unknown[]) => mockPush(...a) },
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => children,
  useLocalSearchParams: () => ({}),
}))

const mockSignInWithPassword = jest.fn()
jest.mock('@/utils/supabase', () => ({
  supabase: { auth: { signInWithPassword: (...a: unknown[]) => mockSignInWithPassword(...a) } },
}))

import LoginScreen from '@/app/(auth)/login'

describe('LoginScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders email and password fields', () => {
    render(<LoginScreen />)
    expect(screen.getByPlaceholderText('doctor@hospital.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy()
  })

  it('renders IMI logo text', () => {
    render(<LoginScreen />)
    expect(screen.getByText('IMI')).toBeTruthy()
  })

  it('renders login button', () => {
    render(<LoginScreen />)
    expect(screen.getAllByText('Iniciar sesión').length).toBeGreaterThanOrEqual(1)
  })

  it('shows validation error for empty email', async () => {
    render(<LoginScreen />)
    const loginBtns = screen.getAllByText('Iniciar sesión')
    await act(async () => {
      fireEvent.press(loginBtns[loginBtns.length - 1])
    })
    expect(screen.getByText('El correo es requerido')).toBeTruthy()
  })

  it('shows validation error for invalid email', async () => {
    render(<LoginScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'bad')
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'pass')
    const loginBtns = screen.getAllByText('Iniciar sesión')
    await act(async () => {
      fireEvent.press(loginBtns[loginBtns.length - 1])
    })
    expect(screen.getByText('Correo inválido')).toBeTruthy()
  })

  it('shows supabase error on failed login', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    render(<LoginScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'doc@h.com')
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password')
    const loginBtns = screen.getAllByText('Iniciar sesión')
    await act(async () => {
      fireEvent.press(loginBtns[loginBtns.length - 1])
    })
    await waitFor(() => expect(screen.getByText('Invalid credentials')).toBeTruthy())
  })

  it('calls router.replace("/") on successful login', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    render(<LoginScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'doc@h.com')
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'password')
    const loginBtns = screen.getAllByText('Iniciar sesión')
    await act(async () => {
      fireEvent.press(loginBtns[loginBtns.length - 1])
    })
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'))
  })

  it('toggles password visibility', () => {
    render(<LoginScreen />)
    fireEvent.press(screen.getByText('Ver'))
    expect(screen.getByText('Ocultar')).toBeTruthy()
    fireEvent.press(screen.getByText('Ocultar'))
    expect(screen.getByText('Ver')).toBeTruthy()
  })
})
