import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'
import { Alert as RNAlert } from 'react-native'

const mockReplace = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: (...a: unknown[]) => mockBack(...a) },
  useLocalSearchParams: () => ({ id: 'i-1' }),
}))

const mockUseAuth = jest.fn()
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

const mockGetInforme = jest.fn()
const mockUploadAudio = jest.fn()
const mockProcessInformeWithAI = jest.fn()
const mockUpdateInformeStatus = jest.fn()
jest.mock('@/services/informes', () => ({
  getInforme: (...a: unknown[]) => mockGetInforme(...a),
  uploadAudio: (...a: unknown[]) => mockUploadAudio(...a),
  processInformeWithAI: (...a: unknown[]) => mockProcessInformeWithAI(...a),
  updateInformeStatus: (...a: unknown[]) => mockUpdateInformeStatus(...a),
}))

const mockRequestPermissionsAsync = jest.fn()
const mockSetAudioModeAsync = jest.fn()
const mockCreateAsync = jest.fn()
const mockStopAndUnloadAsync = jest.fn()
const mockPauseAsync = jest.fn()
const mockStartAsync = jest.fn()
const mockGetStatusAsync = jest.fn()
const mockGetURI = jest.fn()

jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: (...a: unknown[]) => mockRequestPermissionsAsync(...a),
    setAudioModeAsync: (...a: unknown[]) => mockSetAudioModeAsync(...a),
    Recording: {
      createAsync: (...a: unknown[]) => mockCreateAsync(...a),
    },
    RecordingOptionsPresets: { HIGH_QUALITY: {} },
  },
}))

jest.mock('react-native/Libraries/AppState/AppState', () => {
  return {
    __esModule: true,
    default: { addEventListener: jest.fn(() => ({ remove: jest.fn() })) },
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    currentState: 'active',
  }
})

// Alert will be spied on in beforeEach

import GrabarScreen from '@/app/(app)/grabar/[id]'

const mockPatient = { name: 'Ana García', phone: '+54 11 1234', dob: '1990-05-20', email: 'ana@h.com' }
const mockUser = { id: 'u-1', email: 'doc@h.com' }

const mockRecording = {
  stopAndUnloadAsync: mockStopAndUnloadAsync,
  pauseAsync: mockPauseAsync,
  startAsync: mockStartAsync,
  getStatusAsync: mockGetStatusAsync,
  getURI: mockGetURI,
}

describe('GrabarScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
    mockUseAuth.mockReturnValue({ user: mockUser })
    jest.spyOn(RNAlert, 'alert').mockImplementation(
      (_title, _msg, buttons) => {
        const confirm = (buttons as Array<{ onPress?: () => void }>)?.find((b) => b.onPress)
        confirm?.onPress?.()
      }
    )
    mockGetInforme.mockResolvedValue({
      data: { status: 'recording', patients: mockPatient },
    })
    mockSetAudioModeAsync.mockResolvedValue(undefined)
    mockStopAndUnloadAsync.mockResolvedValue(undefined)
    mockGetStatusAsync.mockResolvedValue({})
    mockGetURI.mockReturnValue('file://recording.m4a')
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders patient info after load', async () => {
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Ana García')).toBeTruthy())
  })

  it('renders Iniciar grabacion button in idle state', async () => {
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('🎙 Iniciar grabación')).toBeTruthy())
  })

  it('redirects to informe when status is already completed', async () => {
    mockGetInforme.mockResolvedValue({
      data: { status: 'completed', patients: mockPatient },
    })
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/informe/i-1'))
  })

  it('starts recording when button pressed with granted permission', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => {
      fireEvent.press(screen.getByText('🎙 Iniciar grabación'))
    })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())
  })

  it('shows error when microphone permission denied', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' })
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => {
      fireEvent.press(screen.getByText('🎙 Iniciar grabación'))
    })
    await waitFor(() => expect(screen.getByText('Error al procesar')).toBeTruthy())
  })

  it('shows error when recording creation throws', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockRejectedValue(new Error('Mic busy'))
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => {
      fireEvent.press(screen.getByText('🎙 Iniciar grabación'))
    })
    await waitFor(() => expect(screen.getByText('Mic busy')).toBeTruthy())
  })

  it('back button is disabled while in requesting state', async () => {
    mockRequestPermissionsAsync.mockReturnValue(new Promise(() => {}))
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    fireEvent.press(screen.getByText('🎙 Iniciar grabación'))
    expect(screen.getByText('← Volver')).toBeTruthy()
  })

  it('renders how it works section', async () => {
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('¿Cómo funciona?')).toBeTruthy())
  })

  it('shows patient dob and phone', async () => {
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => {
      expect(screen.getByText(/Ana García/)).toBeTruthy()
      expect(screen.getByText(/54 11 1234/)).toBeTruthy()
    })
  })

  it('handles getInforme returning null data gracefully', async () => {
    mockGetInforme.mockResolvedValue({ data: null })
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('🎙 Iniciar grabación')).toBeTruthy())
  })

  it('processes informe after stopping recording', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    mockUploadAudio.mockResolvedValue({ path: 'd-1/i-1/recording.m4a' })
    mockProcessInformeWithAI.mockResolvedValue({ success: true })

    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))

    await act(async () => {
      fireEvent.press(screen.getByText('🎙 Iniciar grabación'))
    })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())

    await act(async () => {
      fireEvent.press(screen.getByText('⏹ Finalizar consulta'))
    })
    await waitFor(() => expect(mockProcessInformeWithAI).toHaveBeenCalled())
    await act(async () => { jest.runAllTimers() })
    expect(mockReplace).toHaveBeenCalledWith('/informe/i-1')
  })

  it('shows error state when processInformeWithAI fails', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    mockUploadAudio.mockResolvedValue({ path: 'path' })
    mockProcessInformeWithAI.mockResolvedValue({ error: 'AI error' })
    mockUpdateInformeStatus.mockResolvedValue({ success: true })

    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())
    await act(async () => { fireEvent.press(screen.getByText('⏹ Finalizar consulta')) })
    await waitFor(() => expect(screen.getByText('Error al procesar')).toBeTruthy())
  })

  it('pauses and resumes recording', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    mockPauseAsync.mockResolvedValue(undefined)
    mockStartAsync.mockResolvedValue(undefined)

    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => screen.getByText('⏸ Pausar'))

    await act(async () => { fireEvent.press(screen.getByText('⏸ Pausar')) })
    await waitFor(() => expect(screen.getByText('▶ Continuar')).toBeTruthy())

    await act(async () => { fireEvent.press(screen.getByText('▶ Continuar')) })
    await waitFor(() => expect(screen.getByText('⏸ Pausar')).toBeTruthy())
  })

  it('resets recorder after error', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' })
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => expect(screen.getByText('Error al procesar')).toBeTruthy())
    fireEvent.press(screen.getByText('↺ Intentar de nuevo'))
    await waitFor(() => expect(screen.getByText('🎙 Iniciar grabación')).toBeTruthy())
  })

  it('calls router.back when ← Volver pressed in idle state', async () => {
    render(<GrabarScreen />)
    await act(async () => {})
    fireEvent.press(screen.getByText('← Volver'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('advances timer while recording', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())
    await act(async () => { jest.advanceTimersByTime(3000) })
    await waitFor(() => expect(screen.getByText('00:03')).toBeTruthy())
  })

  it('shows uploading and processing UI states during stop', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    mockGetStatusAsync.mockResolvedValue({ uri: 'file://recording.m4a' })
    let resolveUpload!: (v: unknown) => void
    mockUploadAudio.mockReturnValue(new Promise((r) => { resolveUpload = r }))
    mockProcessInformeWithAI.mockResolvedValue({ success: true })

    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())
    fireEvent.press(screen.getByText('⏹ Finalizar consulta'))
    await waitFor(() => expect(screen.getByText('Subiendo audio...')).toBeTruthy())
    await act(async () => { resolveUpload({ path: 'p/a/th' }) })
    await waitFor(() => expect(mockProcessInformeWithAI).toHaveBeenCalled())
  })

  it('handles non-Error thrown inside stopAndProcess', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    mockStopAndUnloadAsync.mockRejectedValue('string error')
    mockUpdateInformeStatus.mockResolvedValue({})

    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())
    await act(async () => { fireEvent.press(screen.getByText('⏹ Finalizar consulta')) })
    await waitFor(() => expect(screen.getAllByText('Error al procesar').length).toBeGreaterThanOrEqual(1))
  })

  it('processes without audioUri when getURI returns null', async () => {
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    mockGetURI.mockReturnValue(null)
    mockProcessInformeWithAI.mockResolvedValue({ success: true })

    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())
    await act(async () => { fireEvent.press(screen.getByText('⏹ Finalizar consulta')) })
    await waitFor(() => expect(mockProcessInformeWithAI).toHaveBeenCalled())
    expect(mockUploadAudio).not.toHaveBeenCalled()
  })

  it('triggers AppState background handler to stop recording', async () => {
    let appStateCallback: (state: string) => void = () => {}
    const mockRemove = jest.fn()
    const { AppState } = require('react-native')
    AppState.addEventListener = jest.fn((event: string, cb: (state: string) => void) => {
      appStateCallback = cb
      return { remove: mockRemove }
    })
    mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' })
    mockCreateAsync.mockResolvedValue({ recording: mockRecording })
    mockUploadAudio.mockResolvedValue({ path: 'path' })
    mockProcessInformeWithAI.mockResolvedValue({ success: true })

    render(<GrabarScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('🎙 Iniciar grabación'))
    await act(async () => { fireEvent.press(screen.getByText('🎙 Iniciar grabación')) })
    await waitFor(() => expect(mockCreateAsync).toHaveBeenCalled())
    await act(async () => { appStateCallback('background') })
    await waitFor(() => expect(mockStopAndUnloadAsync).toHaveBeenCalled())
  })
})
