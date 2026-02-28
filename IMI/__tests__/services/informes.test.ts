const mockGetUser = jest.fn()
const mockGetSession = jest.fn()
const mockFrom = jest.fn()
const mockStorageFrom = jest.fn()

const mockSupabase = {
  auth: {
    getUser: mockGetUser,
    getSession: mockGetSession,
  },
  from: mockFrom,
  storage: { from: mockStorageFrom },
}

jest.mock('@/utils/supabase', () => ({ supabase: mockSupabase }))

global.fetch = jest.fn()

import {
  createPatient,
  createInforme,
  getInformes,
  getInforme,
  updateInformeStatus,
  getPdfSignedUrl,
  uploadAudio,
  processInformeWithAI,
} from '@/services/informes'

const mockUser = { id: 'doctor-1', email: 'doctor@hospital.com' }

function makeChain(overrides: Record<string, jest.Mock> = {}) {
  const chain: Record<string, jest.Mock> = {
    insert: jest.fn(),
    select: jest.fn(),
    update: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
    single: jest.fn(),
    upload: jest.fn(),
    createSignedUrl: jest.fn(),
    upsert: jest.fn(),
  }
  Object.assign(chain, overrides)
  chain.insert.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.single.mockReturnValue(chain)
  chain.upsert.mockReturnValue(chain)
  return chain
}

function makeResolvingChain(resolvedValue: unknown) {
  const chain = makeChain()
  chain.eq.mockImplementation(() => {
    const next = { ...chain }
    next.eq = jest.fn().mockResolvedValue(resolvedValue)
    return next
  })
  return chain
}

describe('createPatient', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await createPatient({ name: 'Juan', dob: null, phone: '123', email: null })
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns error when supabase insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValue(chain)
    const result = await createPatient({ name: 'Juan', dob: '1990-01-01', phone: '123', email: 'j@j.com' })
    expect(result).toEqual({ error: 'DB error' })
  })

  it('returns patient data on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const patient = { id: 'p-1', name: 'Juan', phone: '123', doctor_id: mockUser.id }
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: patient, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await createPatient({ name: '  Juan  ', dob: null, phone: '  123  ', email: '' })
    expect(result).toEqual({ data: patient })
  })
})

describe('createInforme', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await createInforme('p-1')
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns error when supabase insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: null, error: { message: 'Insert failed' } })
    mockFrom.mockReturnValue(chain)
    const result = await createInforme('p-1')
    expect(result).toEqual({ error: 'Insert failed' })
  })

  it('returns informe data on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const informe = { id: 'i-1', patient_id: 'p-1', status: 'recording' }
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: informe, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await createInforme('p-1')
    expect(result).toEqual({ data: informe })
  })
})

describe('getInformes', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await getInformes()
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns error when supabase query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.order.mockResolvedValue({ data: null, error: { message: 'Query error' } })
    mockFrom.mockReturnValue(chain)
    const result = await getInformes()
    expect(result).toEqual({ error: 'Query error' })
  })

  it('returns list on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const data = [{ id: 'i-1' }, { id: 'i-2' }]
    const chain = makeChain()
    chain.order.mockResolvedValue({ data, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await getInformes()
    expect(result).toEqual({ data })
  })
})

describe('getInforme', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await getInforme('i-1')
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns error when supabase query fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    mockFrom.mockReturnValue(chain)
    const result = await getInforme('i-1')
    expect(result).toEqual({ error: 'Not found' })
  })

  it('returns informe on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const data = { id: 'i-1', status: 'completed' }
    const chain = makeChain()
    chain.single.mockResolvedValue({ data, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await getInforme('i-1')
    expect(result).toEqual({ data })
  })
})

describe('updateInformeStatus', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await updateInformeStatus('i-1', 'completed')
  expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns error when supabase update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeResolvingChain({ error: { message: 'Update failed' } })
    mockFrom.mockReturnValue(chain)
    const result = await updateInformeStatus('i-1', 'error')
    expect(result).toEqual({ error: 'Update failed' })
  })

  it('returns success with extra fields', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeResolvingChain({ error: null })
    mockFrom.mockReturnValue(chain)
    const result = await updateInformeStatus('i-1', 'completed', { transcript: 'text', informe_doctor: 'doc', informe_paciente: 'pac', pdf_path: 'path', audio_path: 'audio' })
    expect(result).toEqual({ success: true })
  })
})

describe('getPdfSignedUrl', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns null when createSignedUrl fails', async () => {
    const chain = makeChain()
    chain.createSignedUrl.mockResolvedValue({ data: null })
    mockStorageFrom.mockReturnValue(chain)
    const result = await getPdfSignedUrl('path/to/file.txt')
    expect(result).toBeNull()
  })

  it('returns signed URL on success', async () => {
    const chain = makeChain()
    chain.createSignedUrl.mockResolvedValue({ data: { signedUrl: 'https://signed.url' } })
    mockStorageFrom.mockReturnValue(chain)
    const result = await getPdfSignedUrl('path/to/file.txt')
    expect(result).toBe('https://signed.url')
  })
})

describe('uploadAudio', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when fetch/upload fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      blob: () => Promise.resolve(new Blob()),
    })
    const chain = makeChain()
    chain.upload.mockResolvedValue({ error: { message: 'Upload failed' } })
    mockStorageFrom.mockReturnValue(chain)
    const result = await uploadAudio('d-1', 'i-1', 'file://audio.m4a', 'audio/m4a')
    expect(result).toEqual({ error: 'Upload failed' })
  })

  it('returns path on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      blob: () => Promise.resolve(new Blob()),
    })
    const chain = makeChain()
    chain.upload.mockResolvedValue({ error: null })
    mockStorageFrom.mockReturnValue(chain)
    const result = await uploadAudio('d-1', 'i-1', 'file://audio.m4a', 'audio/m4a')
    expect(result).toEqual({ path: 'd-1/i-1/recording.m4a' })
  })

  it('uses caf extension for non-m4a mime types', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      blob: () => Promise.resolve(new Blob()),
    })
    const chain = makeChain()
    chain.upload.mockResolvedValue({ error: null })
    mockStorageFrom.mockReturnValue(chain)
    const result = await uploadAudio('d-1', 'i-1', 'file://audio.caf', 'audio/x-caf')
    expect(result).toEqual({ path: 'd-1/i-1/recording.caf' })
  })
})

describe('processInformeWithAI', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await processInformeWithAI('i-1', 'transcript text')
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('sets status to processing then calls edge function', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token-123' } } })
    mockFrom.mockReturnValue(makeResolvingChain({ error: null }))
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: true })
    const result = await processInformeWithAI('i-1', 'transcript', 'audio/path')
    expect(result).toEqual({ success: true })
  })

  it('returns error when edge function response is not ok', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'token-123' } } })
    mockFrom.mockReturnValue(makeResolvingChain({ error: null }))
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, text: () => Promise.resolve('Edge error') })
    const result = await processInformeWithAI('i-1', 'transcript')
    expect(result).toEqual({ error: 'Edge error' })
  })

  it('returns error and sets status to error when fetch throws', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockFrom.mockReturnValue(makeResolvingChain({ error: null }))
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network failure'))
    const result = await processInformeWithAI('i-1', 'transcript')
    expect(result).toEqual({ error: 'Network failure' })
  })

  it('returns generic error message when thrown value is not an Error', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockGetSession.mockResolvedValue({ data: { session: null } })
    mockFrom.mockReturnValue(makeResolvingChain({ error: null }))
    ;(global.fetch as jest.Mock).mockRejectedValue('plain string error')
    const result = await processInformeWithAI('i-1', 'transcript')
    expect(result).toEqual({ error: 'Error desconocido' })
  })

  it('returns empty string error when response not ok and text is empty', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } })
    mockFrom.mockReturnValue(makeResolvingChain({ error: null }))
    ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, text: () => Promise.resolve('') })
    const result = await processInformeWithAI('i-1', 'transcript')
    expect(result).toEqual({ error: 'Error al procesar el informe' })
  })
})
