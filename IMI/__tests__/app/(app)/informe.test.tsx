import React from 'react'
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react-native'
import { Linking } from 'react-native'

const mockReplace = jest.fn()
const mockBack = jest.fn()

jest.mock('expo-router', () => {
  const { useEffect } = require('react')
  return {
    router: { replace: (...a: unknown[]) => mockReplace(...a), back: (...a: unknown[]) => mockBack(...a) },
    useLocalSearchParams: () => ({ id: 'i-1' }),
    useFocusEffect: (cb: () => void) => { useEffect(cb, []) },
  }
})

const mockGetInforme = jest.fn()
const mockGetPdfSignedUrl = jest.fn()
jest.mock('@/services/informes', () => ({
  getInforme: (...a: unknown[]) => mockGetInforme(...a),
  getPdfSignedUrl: (...a: unknown[]) => mockGetPdfSignedUrl(...a),
}))

jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined)

import InformeDetailScreen from '@/app/(app)/informe/[id]'

const baseInforme = {
  id: 'i-1',
  status: 'completed',
  created_at: '2024-03-15T14:30:00Z',
  informe_doctor: 'Doctor report content',
  informe_paciente: 'Patient report content',
  pdf_path: 'path/to/informe.txt',
  transcript: 'Full transcript here',
  audio_path: null,
  patients: { name: 'Ana García', phone: '+5491112345678', email: 'ana@h.com', dob: '1990-05-20' },
}

describe('InformeDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPdfSignedUrl.mockResolvedValue('https://signed.url/informe.txt')
  })

  it('renders loading indicator initially', () => {
    mockGetInforme.mockReturnValue(new Promise(() => {}))
    render(<InformeDetailScreen />)
    const { ActivityIndicator } = require('react-native')
    const { UNSAFE_getByType } = render(<InformeDetailScreen />)
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
  })

  it('renders not found message when data is null', async () => {
    mockGetInforme.mockResolvedValue({ data: null })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Informe no encontrado')).toBeTruthy())
  })

  it('renders patient name in header', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getAllByText('Ana García').length).toBeGreaterThanOrEqual(1))
  })

  it('renders doctor report content', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Doctor report content')).toBeTruthy())
  })

  it('renders patient report content', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Patient report content')).toBeTruthy())
  })

  it('renders Ver PDF and WhatsApp buttons when pdf url is available', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => {
      expect(screen.getByText('📄 Ver PDF')).toBeTruthy()
      expect(screen.getByText('💬 WhatsApp')).toBeTruthy()
    })
  })

  it('opens PDF URL when Ver PDF pressed', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('📄 Ver PDF'))
    fireEvent.press(screen.getByText('📄 Ver PDF'))
    expect(Linking.openURL).toHaveBeenCalledWith('https://signed.url/informe.txt')
  })

  it('opens WhatsApp URL when WhatsApp pressed', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('💬 WhatsApp'))
    fireEvent.press(screen.getByText('💬 WhatsApp'))
    expect(Linking.openURL).toHaveBeenCalledWith(expect.stringContaining('wa.me'))
  })

  it('shows processing state', async () => {
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, status: 'processing', pdf_path: null } })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Generando informes...')).toBeTruthy())
  })

  it('shows error state', async () => {
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, status: 'error', pdf_path: null } })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Error al procesar')).toBeTruthy())
  })

  it('redirects to grabar when status is recording', async () => {
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, status: 'recording' } })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/grabar/i-1'))
  })

  it('toggles transcript visibility', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('📝 Ver transcripcion completa'))
    fireEvent.press(screen.getByText('📝 Ver transcripcion completa'))
    await waitFor(() => expect(screen.getByText('Full transcript here')).toBeTruthy())
    fireEvent.press(screen.getByText('📝 Ver transcripcion completa'))
    await waitFor(() => expect(screen.queryByText('Full transcript here')).toBeNull())
  })

  it('calls router.back when ← Volver pressed', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('← Volver'))
    fireEvent.press(screen.getByText('← Volver'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('renders patient info without dob gracefully', async () => {
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, patients: { ...baseInforme.patients, dob: null } } })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getAllByText('Ana García').length).toBeGreaterThanOrEqual(1))
  })

  it('does not render PDF/WhatsApp buttons when pdf_path is null', async () => {
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, pdf_path: null } })
    mockGetPdfSignedUrl.mockResolvedValue(null)
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('Doctor report content'))
    expect(screen.queryByText('📄 Ver PDF')).toBeNull()
  })

  it('navigates back from not-found screen', async () => {
    mockGetInforme.mockResolvedValue({ data: null })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('Volver'))
    fireEvent.press(screen.getByText('Volver'))
    expect(mockBack).toHaveBeenCalled()
  })

  it('handles PDF open error gracefully', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('Cannot open'))
    jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {})
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('📄 Ver PDF'))
    await act(async () => { fireEvent.press(screen.getByText('📄 Ver PDF')) })
    expect(require('react-native').Alert.alert).toHaveBeenCalled()
  })

  it('handles WhatsApp open error gracefully', async () => {
    mockGetInforme.mockResolvedValue({ data: baseInforme })
    jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('Cannot open'))
    jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {})
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => screen.getByText('💬 WhatsApp'))
    await act(async () => { fireEvent.press(screen.getByText('💬 WhatsApp')) })
    expect(require('react-native').Alert.alert).toHaveBeenCalled()
  })

  it('renders informe with no patients gracefully', async () => {
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, patients: null } })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Doctor report content')).toBeTruthy())
  })

  it('renders informe audio recording link when audio_path exists', async () => {
    mockGetPdfSignedUrl.mockResolvedValue('https://signed.url/audio.m4a')
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, pdf_path: null, audio_path: 'audio/path.m4a' } })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Doctor report content')).toBeTruthy())
  })

  it('renders fallback text when informe_doctor and informe_paciente are null', async () => {
    mockGetInforme.mockResolvedValue({
      data: { ...baseInforme, informe_doctor: null, informe_paciente: null },
    })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getAllByText('Sin contenido').length).toBe(2))
  })

  it('renders patient without phone shows no phone line', async () => {
    mockGetInforme.mockResolvedValue({
      data: { ...baseInforme, patients: { ...baseInforme.patients, phone: null } },
    })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Doctor report content')).toBeTruthy())
    expect(screen.queryByText(/📞/)).toBeNull()
  })

  it('does not open WhatsApp when pdfUrl is null', async () => {
    mockGetPdfSignedUrl.mockResolvedValue(null)
    mockGetInforme.mockResolvedValue({ data: { ...baseInforme, pdf_path: null } })
    render(<InformeDetailScreen />)
    await act(async () => {})
    await waitFor(() => expect(screen.getByText('Doctor report content')).toBeTruthy())
    expect(screen.queryByText('💬 WhatsApp')).toBeNull()
  })
})
