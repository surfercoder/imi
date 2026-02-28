import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'

const mockReplace = jest.fn()
const mockPush = jest.fn()

jest.mock('expo-router', () => {
  const { useEffect } = require('react')
  return {
    router: { replace: (...a: unknown[]) => mockReplace(...a), push: (...a: unknown[]) => mockPush(...a) },
    useFocusEffect: (cb: () => void) => { useEffect(cb, []) },
  }
})

const mockSignOut = jest.fn()
const mockUseAuth = jest.fn()
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockGetInformes = jest.fn()
jest.mock('@/services/informes', () => ({
  getInformes: (...a: unknown[]) => mockGetInformes(...a),
}))

import HomeScreen from '@/app/(app)/index'

const mockUser = { id: 'u-1', email: 'doc@h.com' }

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({ user: mockUser, signOut: mockSignOut })
  })

  it('renders header with IMI title', async () => {
    mockGetInformes.mockResolvedValue({ data: [] })
    render(<HomeScreen />)
    await act(async () => {})
    expect(screen.getByText('IMI')).toBeTruthy()
  })

  it('renders user email in header', async () => {
    mockGetInformes.mockResolvedValue({ data: [] })
    render(<HomeScreen />)
    await act(async () => {})
    expect(screen.getByText('doc@h.com')).toBeTruthy()
  })

  it('renders empty state when no informes', async () => {
    mockGetInformes.mockResolvedValue({ data: [] })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Sin informes aún')).toBeTruthy())
  })

  it('renders stats cards with correct counts', async () => {
    const informes = [
      { id: '1', status: 'completed', patients: { name: 'Ana', phone: '123', email: null }, created_at: '2024-01-01T10:00:00Z' },
      { id: '2', status: 'processing', patients: { name: 'Juan', phone: '456', email: null }, created_at: '2024-01-02T10:00:00Z' },
      { id: '3', status: 'error', patients: { name: 'Maria', phone: '789', email: null }, created_at: '2024-01-03T10:00:00Z' },
    ]
    mockGetInformes.mockResolvedValue({ data: informes })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => {
      expect(screen.getByText('3')).toBeTruthy()
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1)
    })
  })

  it('renders informe list items', async () => {
    const informes = [
      { id: '1', status: 'completed', patients: { name: 'Ana García', phone: '123', email: null }, created_at: '2024-01-01T10:00:00Z' },
    ]
    mockGetInformes.mockResolvedValue({ data: informes })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Ana García')).toBeTruthy())
  })

  it('navigates to nuevo-informe when + Nuevo pressed', async () => {
    mockGetInformes.mockResolvedValue({ data: [] })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('+ Nuevo')).toBeTruthy())
    fireEvent.press(screen.getByText('+ Nuevo'))
    expect(mockPush).toHaveBeenCalledWith('/nuevo-informe')
  })

  it('navigates to nuevo-informe from empty state button', async () => {
    mockGetInformes.mockResolvedValue({ data: [] })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('+ Nuevo Informe')).toBeTruthy())
    fireEvent.press(screen.getByText('+ Nuevo Informe'))
    expect(mockPush).toHaveBeenCalledWith('/nuevo-informe')
  })

  it('navigates to grabar when recording informe pressed', async () => {
    const informes = [
      { id: 'i-1', status: 'recording', patients: { name: 'Ana', phone: '123', email: null }, created_at: '2024-01-01T10:00:00Z' },
    ]
    mockGetInformes.mockResolvedValue({ data: informes })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Ana')).toBeTruthy())
    fireEvent.press(screen.getByText('Ana'))
    expect(mockPush).toHaveBeenCalledWith('/grabar/i-1')
  })

  it('navigates to informe detail when completed informe pressed', async () => {
    const informes = [
      { id: 'i-2', status: 'completed', patients: { name: 'Juan', phone: '456', email: null }, created_at: '2024-01-01T10:00:00Z' },
    ]
    mockGetInformes.mockResolvedValue({ data: informes })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Juan')).toBeTruthy())
    fireEvent.press(screen.getByText('Juan'))
    expect(mockPush).toHaveBeenCalledWith('/informe/i-2')
  })

  it('calls signOut when Salir pressed', async () => {
    mockGetInformes.mockResolvedValue({ data: [] })
    mockSignOut.mockResolvedValue({})
    render(<HomeScreen />)
    await act(async () => {})
    fireEvent.press(screen.getByText('Salir'))
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('shows unknown patient name when patients is null', async () => {
    const informes = [
      { id: 'i-3', status: 'error', patients: null, created_at: '2024-01-01T10:00:00Z' },
    ]
    mockGetInformes.mockResolvedValue({ data: informes })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Paciente desconocido')).toBeTruthy())
  })

  it('handles getInformes returning no data gracefully', async () => {
    mockGetInformes.mockResolvedValue({ error: 'DB error' })
    render(<HomeScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Sin informes aún')).toBeTruthy())
  })

  it('triggers onRefresh via pull-to-refresh', async () => {
    mockGetInformes.mockResolvedValue({ data: [] })
    const { UNSAFE_getByType } = render(<HomeScreen />)
    await act(async () => {})
    const { ScrollView } = require('react-native')
    const scrollView = UNSAFE_getByType(ScrollView)
    await act(async () => {
      scrollView.props.refreshControl.props.onRefresh()
    })
    expect(mockGetInformes).toHaveBeenCalledTimes(2)
  })
})
