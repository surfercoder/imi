import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'

const mockReplace = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: (...a: unknown[]) => mockBack(...a) },
  useLocalSearchParams: () => ({}),
}))

const mockCreatePatient = jest.fn()
const mockCreateInforme = jest.fn()
jest.mock('@/services/informes', () => ({
  createPatient: (...a: unknown[]) => mockCreatePatient(...a),
  createInforme: (...a: unknown[]) => mockCreateInforme(...a),
}))

import NuevoInformeScreen from '@/app/(app)/nuevo-informe'

describe('NuevoInformeScreen', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders patient form fields', () => {
    render(<NuevoInformeScreen />)
    expect(screen.getByPlaceholderText('Ej: María García')).toBeTruthy()
    expect(screen.getByPlaceholderText('AAAA-MM-DD')).toBeTruthy()
    expect(screen.getByPlaceholderText('Ej: +54 9 261 123 4567')).toBeTruthy()
    expect(screen.getByPlaceholderText('paciente@email.com')).toBeTruthy()
  })

  it('renders Iniciar consulta button', () => {
    render(<NuevoInformeScreen />)
    expect(screen.getByText('Iniciar consulta')).toBeTruthy()
  })

  it('shows error when name is too short', async () => {
    render(<NuevoInformeScreen />)
    await act(async () => { fireEvent.press(screen.getByText('Iniciar consulta')) })
    expect(screen.getByText('El nombre debe tener al menos 2 caracteres')).toBeTruthy()
  })

  it('shows error when phone is too short', async () => {
    render(<NuevoInformeScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Ej: María García'), 'Juan Pérez')
    await act(async () => { fireEvent.press(screen.getByText('Iniciar consulta')) })
    expect(screen.getByText('Ingresá un número de teléfono válido')).toBeTruthy()
  })

  it('shows createPatient error', async () => {
    mockCreatePatient.mockResolvedValue({ error: 'DB error' })
    render(<NuevoInformeScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Ej: María García'), 'Juan Pérez')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: +54 9 261 123 4567'), '+5491112345678')
    await act(async () => { fireEvent.press(screen.getByText('Iniciar consulta')) })
    await waitFor(() => expect(screen.getByText('DB error')).toBeTruthy())
  })

  it('shows createPatient null data error', async () => {
    mockCreatePatient.mockResolvedValue({ data: null })
    render(<NuevoInformeScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Ej: María García'), 'Juan Pérez')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: +54 9 261 123 4567'), '+5491112345678')
    await act(async () => { fireEvent.press(screen.getByText('Iniciar consulta')) })
    await waitFor(() => expect(screen.getByText('Error al crear el paciente')).toBeTruthy())
  })

  it('shows createInforme error', async () => {
    mockCreatePatient.mockResolvedValue({ data: { id: 'p-1' } })
    mockCreateInforme.mockResolvedValue({ error: 'Informe error' })
    render(<NuevoInformeScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Ej: María García'), 'Juan Pérez')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: +54 9 261 123 4567'), '+5491112345678')
    await act(async () => { fireEvent.press(screen.getByText('Iniciar consulta')) })
    await waitFor(() => expect(screen.getByText('Informe error')).toBeTruthy())
  })

  it('redirects to grabar on success', async () => {
    mockCreatePatient.mockResolvedValue({ data: { id: 'p-1' } })
    mockCreateInforme.mockResolvedValue({ data: { id: 'i-1' } })
    render(<NuevoInformeScreen />)
    fireEvent.changeText(screen.getByPlaceholderText('Ej: María García'), 'Juan Pérez')
    fireEvent.changeText(screen.getByPlaceholderText('Ej: +54 9 261 123 4567'), '+5491112345678')
    await act(async () => { fireEvent.press(screen.getByText('Iniciar consulta')) })
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/grabar/i-1'))
  })

  it('calls router.back when Cancelar pressed', () => {
    render(<NuevoInformeScreen />)
    fireEvent.press(screen.getByText('Cancelar'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('calls router.back when ← Volver pressed', () => {
    render(<NuevoInformeScreen />)
    fireEvent.press(screen.getByText('← Volver'))
    expect(mockBack).toHaveBeenCalled()
  })
})
