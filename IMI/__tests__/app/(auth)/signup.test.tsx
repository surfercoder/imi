import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'

const mockReplace = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  Link: ({ children }: { children: React.ReactNode }) => children,
  useLocalSearchParams: () => ({}),
}))

const mockSignUp = jest.fn()
jest.mock('@/utils/supabase', () => ({
  supabase: { auth: { signUp: (...a: unknown[]) => mockSignUp(...a) } },
}))

import SignupScreen from '@/app/(auth)/signup'

const validFields = {
  email: 'doctor@hospital.com',
  matricula: '123456',
  phone: '+54 11 1234-5678',
  password: 'securepass',
  confirm: 'securepass',
}

async function fillForm() {
  fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), validFields.email)
  fireEvent.changeText(screen.getByPlaceholderText('Ej: 123456'), validFields.matricula)
  fireEvent.changeText(screen.getByPlaceholderText('Ej: +54 11 1234-5678'), validFields.phone)
  fireEvent.changeText(screen.getByPlaceholderText('Mín. 8 caracteres'), validFields.password)
  fireEvent.changeText(screen.getByPlaceholderText('Repetí tu contraseña'), validFields.confirm)
}

function selectEspecialidad(name = 'Cardiología') {
  fireEvent.press(screen.getByText('Seleccioná tu especialidad'))
  fireEvent.press(screen.getByText(name))
}

describe('SignupScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders all form fields', () => {
    render(<SignupScreen />)
    expect(screen.getByPlaceholderText('doctor@hospital.com')).toBeTruthy()
    expect(screen.getByPlaceholderText('Ej: 123456')).toBeTruthy()
    expect(screen.getByPlaceholderText('Ej: +54 11 1234-5678')).toBeTruthy()
    expect(screen.getByPlaceholderText('Mín. 8 caracteres')).toBeTruthy()
    expect(screen.getByPlaceholderText('Repetí tu contraseña')).toBeTruthy()
  })

  it('renders create account button', () => {
    render(<SignupScreen />)
    expect(screen.getByText('Crear cuenta')).toBeTruthy()
  })

  it('shows validation error for empty email', async () => {
    render(<SignupScreen />)
    await act(async () => { fireEvent.press(screen.getByText('Crear cuenta')) })
    expect(screen.getByText('El correo es requerido')).toBeTruthy()
  })

  it('shows validation error for short password', async () => {
    render(<SignupScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'doc@h.com')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: 123456'), '123456')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: +54 11 1234-5678'), '+5411123456')
    fireEvent.changeText(screen.getByPlaceholderText('Mín. 8 caracteres'), 'short')
    fireEvent.changeText(screen.getByPlaceholderText('Repetí tu contraseña'), 'short')
    await act(async () => { fireEvent.press(screen.getByText('Crear cuenta')) })
    expect(screen.getByText('La contraseña debe tener al menos 8 caracteres')).toBeTruthy()
  })

  it('shows validation error for mismatched passwords', async () => {
    render(<SignupScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('doctor@hospital.com'), 'doc@h.com')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: 123456'), '123456')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: +54 11 1234-5678'), '+5411123456')
    fireEvent.changeText(screen.getByPlaceholderText('Mín. 8 caracteres'), 'password1')
    fireEvent.changeText(screen.getByPlaceholderText('Repetí tu contraseña'), 'different1')
    selectEspecialidad()
    await act(async () => { fireEvent.press(screen.getByText('Crear cuenta')) })
    expect(screen.getByText('Las contraseñas no coinciden')).toBeTruthy()
  })

  it('shows validation error when especialidad is not selected', async () => {
    render(<SignupScreen />)
    await fillForm()
    await act(async () => { fireEvent.press(screen.getByText('Crear cuenta')) })
    expect(screen.getByText('La especialidad es requerida')).toBeTruthy()
  })

  it('shows supabase error on signup failure', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already registered' } })
    render(<SignupScreen />)
    await fillForm()
    selectEspecialidad()
    await act(async () => { fireEvent.press(screen.getByText('Crear cuenta')) })
    await waitFor(() => expect(screen.getByText('Email already registered')).toBeTruthy())
  })

  it('shows success state on successful signup', async () => {
    mockSignUp.mockResolvedValue({ error: null })
    render(<SignupScreen />)
    await fillForm()
    selectEspecialidad()
    await act(async () => { fireEvent.press(screen.getByText('Crear cuenta')) })
    await waitFor(() => expect(screen.getByText('Revisá tu correo')).toBeTruthy())
  })

  it('opens the especialidad modal and closes it with ✕', async () => {
    render(<SignupScreen />)
    fireEvent.press(screen.getByText('Seleccioná tu especialidad'))
    await waitFor(() => expect(screen.getByPlaceholderText('Buscar especialidad...')).toBeTruthy())
    fireEvent.press(screen.getByText('✕'))
  })

  it('filters especialidades by search term', async () => {
    render(<SignupScreen />)
    fireEvent.press(screen.getByText('Seleccioná tu especialidad'))
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Buscar especialidad...')
      expect(searchInput).toBeTruthy()
    })
    const searchInput = screen.getByPlaceholderText('Buscar especialidad...')
    fireEvent.changeText(searchInput, 'cardio')
    await waitFor(() => expect(screen.getByText('Cardiología')).toBeTruthy())
  })

  it('toggles password visibility', () => {
    render(<SignupScreen />)
    const verBtns = screen.getAllByText('Ver')
    fireEvent.press(verBtns[0])
    expect(screen.getAllByText('Ocultar').length).toBeGreaterThanOrEqual(1)
  })

  it('shows checkmark on already selected especialidad when modal re-opened', async () => {
    render(<SignupScreen />)
    selectEspecialidad('Cardiología')
    fireEvent.press(screen.getByText('Cardiología'))
    await waitFor(() => expect(screen.getByText('✓')).toBeTruthy())
  })
})
