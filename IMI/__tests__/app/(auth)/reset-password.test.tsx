import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'

const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => ({}),
}))

const mockUpdateUser = jest.fn()
jest.mock('@/utils/supabase', () => ({
  supabase: { auth: { updateUser: (...a: unknown[]) => mockUpdateUser(...a) } },
}))

import ResetPasswordScreen from '@/app/(auth)/reset-password'

describe('ResetPasswordScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders password fields and submit button', () => {
    render(<ResetPasswordScreen />)
    expect(screen.getByText('Actualizar contraseña')).toBeTruthy()
  })

  it('shows error for short password', async () => {
    render(<ResetPasswordScreen />)
    await act(async () => { fireEvent.press(screen.getByText('Actualizar contraseña')) })
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy()
  })

  it('shows error for mismatched passwords', async () => {
    render(<ResetPasswordScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Mín. 8 caracteres'), 'newpassword')
    fireEvent.changeText(screen.getByPlaceholderText('Repetí tu nueva contraseña'), 'different')
    await act(async () => { fireEvent.press(screen.getByText('Actualizar contraseña')) })
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
  })

  it('shows supabase error on failure', async () => {
    mockUpdateUser.mockResolvedValue({ error: { message: 'Session expired' } })
    render(<ResetPasswordScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Mín. 8 caracteres'), 'newpassword')
    fireEvent.changeText(screen.getByPlaceholderText('Repetí tu nueva contraseña'), 'newpassword')
    await act(async () => { fireEvent.press(screen.getByText('Actualizar contraseña')) })
    await waitFor(() => expect(screen.getByText('Session expired')).toBeTruthy())
  })

  it('calls router.replace("/") on success', async () => {
    mockUpdateUser.mockResolvedValue({ error: null })
    render(<ResetPasswordScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Mín. 8 caracteres'), 'newpassword')
    fireEvent.changeText(screen.getByPlaceholderText('Repetí tu nueva contraseña'), 'newpassword')
    await act(async () => { fireEvent.press(screen.getByText('Actualizar contraseña')) })
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'))
  })

  it('toggles password visibility for both fields', () => {
    render(<ResetPasswordScreen />)
    const verBtns = screen.getAllByText('Ver')
    expect(verBtns.length).toBe(2)
    // Toggle first field (showPassword)
    fireEvent.press(verBtns[0])
    expect(screen.getAllByText('Ocultar').length).toBeGreaterThanOrEqual(1)
    fireEvent.press(screen.getAllByText('Ocultar')[0])
    expect(screen.getAllByText('Ver').length).toBe(2)
    // Toggle second field (showConfirm)
    fireEvent.press(verBtns[1])
    expect(screen.getAllByText('Ocultar').length).toBeGreaterThanOrEqual(1)
    fireEvent.press(screen.getAllByText('Ocultar')[0])
    expect(screen.getAllByText('Ver').length).toBe(2)
  })
})
