import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'

const mockReplace = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: (...a: unknown[]) => mockBack(...a) },
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => ({}),
}))

const mockResetPasswordForEmail = jest.fn()
jest.mock('@/utils/supabase', () => ({
  supabase: { auth: { resetPasswordForEmail: (...a: unknown[]) => mockResetPasswordForEmail(...a) } },
}))

import ForgotPasswordScreen from '@/app/(auth)/forgot-password'

describe('ForgotPasswordScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders email field and submit button', () => {
    render(<ForgotPasswordScreen />)
    expect(screen.getByPlaceholderText('doctor@hospital.com')).toBeTruthy()
    expect(screen.getByText('Enviar enlace')).toBeTruthy()
  })

  it('shows validation error for empty email', async () => {
    render(<ForgotPasswordScreen />)
    await act(async () => { fireEvent.press(screen.getByText('Enviar enlace')) })
    expect(screen.getByText('El correo es requerido')).toBeTruthy()
  })

  it('shows validation error for invalid email', async () => {
    render(<ForgotPasswordScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'bad')
    await act(async () => { fireEvent.press(screen.getByText('Enviar enlace')) })
    expect(screen.getByText('Correo inválido')).toBeTruthy()
  })

  it('shows supabase error on failure', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })
    render(<ForgotPasswordScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'doc@h.com')
    await act(async () => { fireEvent.press(screen.getByText('Enviar enlace')) })
    await waitFor(() => expect(screen.getByText('Rate limit exceeded')).toBeTruthy())
  })

  it('shows success state on success', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null })
    render(<ForgotPasswordScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'doc@h.com')
    await act(async () => { fireEvent.press(screen.getByText('Enviar enlace')) })
    await waitFor(() => expect(screen.getByText('Revisá tu correo')).toBeTruthy())
  })

  it('calls router.back when back button pressed', () => {
    render(<ForgotPasswordScreen />)
    fireEvent.press(screen.getByText('← Volver'))
    expect(mockBack).toHaveBeenCalled()
  })
})
