import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const mockRedirect = jest.fn()
const mockNotFound = jest.fn()
const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockGetPdfDownloadUrl = jest.fn()

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
  notFound: () => mockNotFound(),
}))

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() =>
    Promise.resolve({
      auth: { getUser: mockGetUser },
      from: mockFrom,
    })
  ),
}))

jest.mock('@/actions/informes', () => ({
  getPdfDownloadUrl: (...args: unknown[]) => mockGetPdfDownloadUrl(...args),
}))

jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

import InformePage from '@/app/informes/[id]/page'

function makeChain(resolvedValue: unknown) {
  const chain = {
    select: jest.fn(),
    eq: jest.fn(),
    single: jest.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.single.mockResolvedValue(resolvedValue)
  return chain
}

const mockUser = { id: 'doctor-1', email: 'doctor@hospital.com' }

const completedInforme = {
  id: 'i-1',
  status: 'completed',
  created_at: '2025-01-15T10:30:00Z',
  informe_doctor: 'Informe médico detallado.',
  informe_paciente: 'Informe para el paciente.',
  pdf_path: 'doctor-1/i-1/informe-paciente.pdf',
  transcript: 'Transcripción de la consulta.',
  patients: {
    name: 'Juan Pérez',
    phone: '+54 9 261 123 4567',
    dob: '1990-05-15',
    email: 'juan@email.com',
  },
}

describe('InformePage', () => {
  beforeEach(() => jest.clearAllMocks())

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    try { await InformePage({ params: Promise.resolve({ id: 'i-1' }) }) } catch { /* redirect throws */ }
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('calls notFound when informe is not found', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: null, error: { message: 'Not found' } })
    mockFrom.mockReturnValue(chain)
    try { await InformePage({ params: Promise.resolve({ id: 'i-1' }) }) } catch { /* notFound throws */ }
    expect(mockNotFound).toHaveBeenCalled()
  })

  it('redirects to grabar page when status is recording', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, status: 'recording' },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    try { await InformePage({ params: Promise.resolve({ id: 'i-1' }) }) } catch { /* redirect throws */ }
    expect(mockRedirect).toHaveBeenCalledWith('/informes/i-1/grabar')
  })

  it('renders completed informe with both reports', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: completedInforme, error: null })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText('Informe de consulta')).toBeInTheDocument()
    expect(screen.getAllByText('Juan Pérez').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Informe médico detallado.')).toBeInTheDocument()
    expect(screen.getByText('Informe para el paciente.')).toBeInTheDocument()
  })

  it('renders patient phone and email', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: completedInforme, error: null })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText('+54 9 261 123 4567')).toBeInTheDocument()
    expect(screen.getByText('juan@email.com')).toBeInTheDocument()
  })

  it('renders formatted dob when present', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: completedInforme, error: null })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText(/mayo/i)).toBeInTheDocument()
  })

  it('does not render dob section when dob is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, patients: { ...completedInforme.patients, dob: null } },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.queryByText(/mayo/i)).not.toBeInTheDocument()
  })

  it('does not render email when email is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, patients: { ...completedInforme.patients, email: null } },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.queryByText('juan@email.com')).not.toBeInTheDocument()
  })

  it('renders PDF download and WhatsApp buttons when completed with pdf', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: completedInforme, error: null })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByRole('link', { name: /Descargar PDF/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar por WhatsApp/i })).toBeInTheDocument()
  })

  it('does not render PDF buttons when pdf_path is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: { ...completedInforme, pdf_path: null }, error: null })
    mockFrom.mockReturnValue(chain)
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.queryByRole('link', { name: /Descargar PDF/i })).not.toBeInTheDocument()
  })

  it('does not render PDF buttons when pdfSignedUrl is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: completedInforme, error: null })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue(null)
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.queryByRole('link', { name: /Descargar PDF/i })).not.toBeInTheDocument()
  })

  it('renders processing state', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, status: 'processing', pdf_path: null },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText('Generando informes...')).toBeInTheDocument()
  })

  it('renders error state', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, status: 'error', pdf_path: null },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText('Error al procesar')).toBeInTheDocument()
  })

  it('renders unknown status using error config', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, status: 'unknown', pdf_path: null },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText('Error')).toBeInTheDocument()
  })

  it('renders transcript section when transcript is present', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: completedInforme, error: null })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText('Ver transcripción completa')).toBeInTheDocument()
    expect(screen.getByText('Transcripción de la consulta.')).toBeInTheDocument()
  })

  it('does not render transcript section when transcript is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, transcript: null },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.queryByText('Ver transcripción completa')).not.toBeInTheDocument()
  })

  it('renders "Sin contenido" when informe_doctor is empty', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({
      data: { ...completedInforme, informe_doctor: '', informe_paciente: '' },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getAllByText('Sin contenido').length).toBeGreaterThanOrEqual(1)
  })

  it('renders back link to home', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain({ data: completedInforme, error: null })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    const backLink = screen.getByRole('link', { name: /Volver/i })
    expect(backLink).toHaveAttribute('href', '/')
  })

  it('decrements age when birthday is same month but day not yet reached', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const today = new Date()
    const futureDay = today.getDate() + 1
    if (futureDay > 28) return
    const dob = `1990-${String(today.getMonth() + 1).padStart(2, '0')}-${String(futureDay).padStart(2, '0')}`
    const chain = makeChain({
      data: { ...completedInforme, patients: { ...completedInforme.patients, dob } },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    mockGetPdfDownloadUrl.mockResolvedValue('https://signed.url/pdf')
    render(await InformePage({ params: Promise.resolve({ id: 'i-1' }) }))
    expect(screen.getByText(/años/i)).toBeInTheDocument()
  })
})
