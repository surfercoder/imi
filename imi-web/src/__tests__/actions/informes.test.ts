const mockGetUser = jest.fn()
const mockFrom = jest.fn()
const mockStorage = jest.fn()
const mockRevalidatePath = jest.fn()

const mockSupabase = {
  auth: { getUser: mockGetUser },
  from: mockFrom,
  storage: { from: mockStorage },
}

jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase)),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

// eslint-disable-next-line no-var
var mockAnthropicCreate = jest.fn()
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: (...args: unknown[]) => mockAnthropicCreate(...args) },
  }))
})

const mockGeneratePDF = jest.fn()
jest.mock('@/lib/pdf', () => ({
  generateInformePDF: (...args: unknown[]) => mockGeneratePDF(...args),
}))

import {
  createPatient,
  createInforme,
  processInformeFromTranscript,
  getInformes,
  getInforme,
  getPdfDownloadUrl,
  generateAndSavePdf,
  regeneratePdf,
} from '@/actions/informes'

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
  }
  Object.assign(chain, overrides)
  chain.insert.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  chain.single.mockReturnValue(chain)
  return chain
}

describe('createPatient', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const fd = new FormData()
    fd.set('name', 'Juan Pérez')
    fd.set('dob', '1990-01-01')
    fd.set('phone', '+54911234567')
    fd.set('email', '')
    const result = await createPatient(fd)
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns error when supabase insert fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: null, error: { message: 'DB error' } })
    mockFrom.mockReturnValue(chain)
    const fd = new FormData()
    fd.set('name', 'Juan Pérez')
    fd.set('dob', '1990-01-01')
    fd.set('phone', '+54911234567')
    fd.set('email', '')
    const result = await createPatient(fd)
    expect(result).toEqual({ error: 'DB error' })
  })

  it('returns data on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const patientData = { id: 'p-1', name: 'Juan Pérez' }
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: patientData, error: null })
    mockFrom.mockReturnValue(chain)
    const fd = new FormData()
    fd.set('name', 'Juan Pérez')
    fd.set('dob', '1990-01-01')
    fd.set('phone', '+54911234567')
    fd.set('email', 'juan@email.com')
    const result = await createPatient(fd)
    expect(result).toEqual({ data: patientData })
  })

  it('handles empty dob as null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: { id: 'p-2' }, error: null })
    mockFrom.mockReturnValue(chain)
    const fd = new FormData()
    fd.set('name', 'Ana García')
    fd.set('dob', '')
    fd.set('phone', '+54911234567')
    fd.set('email', '')
    const result = await createPatient(fd)
    expect(result).toEqual({ data: { id: 'p-2' } })
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ dob: null, email: null })
    )
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

  it('returns data on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const informeData = { id: 'i-1', status: 'recording' }
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: informeData, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await createInforme('p-1')
    expect(result).toEqual({ data: informeData })
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

  it('returns data on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const informes = [{ id: 'i-1' }, { id: 'i-2' }]
    const chain = makeChain()
    chain.order.mockResolvedValue({ data: informes, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await getInformes()
    expect(result).toEqual({ data: informes })
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

  it('returns data on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const informeData = { id: 'i-1', status: 'completed' }
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: informeData, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await getInforme('i-1')
    expect(result).toEqual({ data: informeData })
  })
})

describe('getPdfDownloadUrl', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns signed URL when available', async () => {
    const storageChain = { createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url/pdf' } }) }
    mockStorage.mockReturnValue(storageChain)
    const result = await getPdfDownloadUrl('doctor-1/i-1/informe-paciente.pdf')
    expect(result).toBe('https://signed.url/pdf')
  })

  it('returns null when no signed URL', async () => {
    const storageChain = { createSignedUrl: jest.fn().mockResolvedValue({ data: null }) }
    mockStorage.mockReturnValue(storageChain)
    const result = await getPdfDownloadUrl('doctor-1/i-1/informe-paciente.pdf')
    expect(result).toBeNull()
  })
})

describe('processInformeFromTranscript', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await processInformeFromTranscript('i-1', 'transcript text')
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns success and revalidates paths on happy path', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const informeData = {
      id: 'i-1',
      patients: { name: 'Juan Pérez', phone: '+54911234567' },
    }
    const selectSingleChain = makeChain()
    selectSingleChain.single.mockResolvedValue({ data: informeData, error: null })

    const finalUpdateChain = makeChain()
    finalUpdateChain.eq.mockReturnValueOnce(finalUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectSingleChain)
      .mockReturnValueOnce(finalUpdateChain)

    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            informe_doctor: 'Doctor report content',
            informe_paciente: 'Patient report content',
          }),
        },
      ],
    })

    const pdfBytes = new Uint8Array([1, 2, 3])
    mockGeneratePDF.mockResolvedValue(pdfBytes)

    const storageUploadChain = { upload: jest.fn().mockResolvedValue({ error: null }) }
    mockStorage.mockReturnValue(storageUploadChain)

    const result = await processInformeFromTranscript('i-1', 'transcript text', 'audio/path.webm')
    expect(result).toEqual({ success: true })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/informes/i-1')
  })

  it('handles non-text anthropic response gracefully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const informeData = {
      id: 'i-1',
      patients: { name: 'Juan', phone: '+549' },
    }
    const selectSingleChain = makeChain()
    selectSingleChain.single.mockResolvedValue({ data: informeData, error: null })

    const finalUpdateChain = makeChain()
    finalUpdateChain.eq.mockReturnValueOnce(finalUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectSingleChain)
      .mockReturnValueOnce(finalUpdateChain)

    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'image', source: {} }],
    })

    mockGeneratePDF.mockResolvedValue(new Uint8Array([1]))
    const storageUploadChain = { upload: jest.fn().mockResolvedValue({ error: null }) }
    mockStorage.mockReturnValue(storageUploadChain)

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ success: true })
  })

  it('handles invalid JSON from anthropic (falls back to raw text)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const informeData = {
      id: 'i-1',
      patients: { name: 'Juan', phone: '+549' },
    }
    const selectSingleChain = makeChain()
    selectSingleChain.single.mockResolvedValue({ data: informeData, error: null })

    const finalUpdateChain = makeChain()
    finalUpdateChain.eq.mockReturnValueOnce(finalUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectSingleChain)
      .mockReturnValueOnce(finalUpdateChain)

    mockAnthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'not valid json at all' }],
    })

    mockGeneratePDF.mockResolvedValue(new Uint8Array([1]))
    const storageUploadChain = { upload: jest.fn().mockResolvedValue({ error: null }) }
    mockStorage.mockReturnValue(storageUploadChain)

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ success: true })
  })

  it('continues when PDF generation fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const informeData = {
      id: 'i-1',
      patients: { name: 'Juan', phone: '+549' },
    }
    const selectSingleChain = makeChain()
    selectSingleChain.single.mockResolvedValue({ data: informeData, error: null })

    const finalUpdateChain = makeChain()
    finalUpdateChain.eq.mockReturnValueOnce(finalUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectSingleChain)
      .mockReturnValueOnce(finalUpdateChain)

    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ informe_doctor: 'doc', informe_paciente: 'pac' }),
        },
      ],
    })

    mockGeneratePDF.mockRejectedValue(new Error('PDF generation failed'))

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ success: true })
  })

  it('continues when PDF upload fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const informeData = {
      id: 'i-1',
      patients: { name: 'Juan', phone: '+549' },
    }
    const selectSingleChain = makeChain()
    selectSingleChain.single.mockResolvedValue({ data: informeData, error: null })

    const finalUpdateChain = makeChain()
    finalUpdateChain.eq.mockReturnValueOnce(finalUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectSingleChain)
      .mockReturnValueOnce(finalUpdateChain)

    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ informe_doctor: 'doc', informe_paciente: 'pac' }),
        },
      ],
    })

    mockGeneratePDF.mockResolvedValue(new Uint8Array([1]))
    const storageUploadChain = { upload: jest.fn().mockResolvedValue({ error: { message: 'Upload failed' } }) }
    mockStorage.mockReturnValue(storageUploadChain)

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ success: true })
  })

  it('skips PDF generation when informeData is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const selectSingleChain = makeChain()
    selectSingleChain.single.mockResolvedValue({ data: null, error: null })

    const finalUpdateChain = makeChain()
    finalUpdateChain.eq.mockReturnValueOnce(finalUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectSingleChain)
      .mockReturnValueOnce(finalUpdateChain)

    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ informe_doctor: 'doc', informe_paciente: 'pac' }),
        },
      ],
    })

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ success: true })
    expect(mockGeneratePDF).not.toHaveBeenCalled()
  })

  it('returns error and sets status to error when final update fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const selectSingleChain = makeChain()
    selectSingleChain.single.mockResolvedValue({ data: null, error: null })

    const finalUpdateChain = makeChain()
    finalUpdateChain.eq.mockReturnValueOnce(finalUpdateChain).mockResolvedValueOnce({ error: { message: 'Update failed' } })

    const errorUpdateChain = makeChain()
    errorUpdateChain.eq.mockReturnValueOnce(errorUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(selectSingleChain)
      .mockReturnValueOnce(finalUpdateChain)
      .mockReturnValueOnce(errorUpdateChain)

    mockAnthropicCreate.mockResolvedValue({
      content: [
        {
          type: 'text',
          text: JSON.stringify({ informe_doctor: 'doc', informe_paciente: 'pac' }),
        },
      ],
    })

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ error: 'Update failed' })
  })

  it('returns error and sets status to error when anthropic throws', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const errorUpdateChain = makeChain()
    errorUpdateChain.eq.mockReturnValueOnce(errorUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(errorUpdateChain)

    mockAnthropicCreate.mockRejectedValue(new Error('API error'))

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ error: 'API error' })
  })

  it('returns generic error message when non-Error is thrown', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    const errorUpdateChain = makeChain()
    errorUpdateChain.eq.mockReturnValueOnce(errorUpdateChain).mockResolvedValueOnce({ error: null })

    mockFrom
      .mockReturnValueOnce(updateChain)
      .mockReturnValueOnce(errorUpdateChain)

    mockAnthropicCreate.mockRejectedValue('string error')

    const result = await processInformeFromTranscript('i-1', 'transcript')
    expect(result).toEqual({ error: 'Error desconocido' })
  })
})

describe('generateAndSavePdf', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'No autenticado' })
  })

  it('returns error when informe fetch fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: null, error: { message: 'Not found' } })
    mockFrom.mockReturnValue(chain)
    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'Informe no encontrado' })
  })

  it('returns error when informe data is null', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({ data: null, error: null })
    mockFrom.mockReturnValue(chain)
    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'Informe no encontrado' })
  })

  it('returns error when status is not completed', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'processing', informe_paciente: 'content', created_at: '2025-01-01T00:00:00Z', patients: { name: 'Juan', phone: '+549' } },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'El informe no está completado' })
  })

  it('returns error when informe_paciente is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const chain = makeChain()
    chain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'completed', informe_paciente: null, created_at: '2025-01-01T00:00:00Z', patients: { name: 'Juan', phone: '+549' } },
      error: null,
    })
    mockFrom.mockReturnValue(chain)
    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'Sin contenido para el paciente' })
  })

  it('returns error when PDF upload fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    const fetchChain = makeChain()
    fetchChain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'completed', informe_paciente: 'Patient content', created_at: '2025-01-15T10:30:00Z', patients: { name: 'Juan Pérez', phone: '+54911234567' } },
      error: null,
    })
    mockFrom.mockReturnValue(fetchChain)

    mockGeneratePDF.mockResolvedValue(new Uint8Array([1, 2, 3]))
    const storageChain = { upload: jest.fn().mockResolvedValue({ error: { message: 'Upload failed' } }) }
    mockStorage.mockReturnValue(storageChain)

    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'Upload failed' })
  })

  it('returns signedUrl on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const fetchChain = makeChain()
    fetchChain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'completed', informe_paciente: 'Patient content', created_at: '2025-01-15T10:30:00Z', patients: { name: 'Juan Pérez', phone: '+54911234567' } },
      error: null,
    })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(updateChain)

    mockGeneratePDF.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const storageChain = {
      upload: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url/pdf' } }),
    }
    mockStorage.mockReturnValue(storageChain)

    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ signedUrl: 'https://signed.url/pdf' })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/informes/i-1')
  })

  it('returns signedUrl as null when createSignedUrl returns no data', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const fetchChain = makeChain()
    fetchChain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'completed', informe_paciente: 'Patient content', created_at: '2025-01-15T10:30:00Z', patients: { name: 'Juan Pérez', phone: '+54911234567' } },
      error: null,
    })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(updateChain)

    mockGeneratePDF.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const storageChain = {
      upload: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: null }),
    }
    mockStorage.mockReturnValue(storageChain)

    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ signedUrl: null })
  })

  it('returns error when PDF generation throws', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const fetchChain = makeChain()
    fetchChain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'completed', informe_paciente: 'Patient content', created_at: '2025-01-15T10:30:00Z', patients: { name: 'Juan Pérez', phone: '+54911234567' } },
      error: null,
    })
    mockFrom.mockReturnValue(fetchChain)

    mockGeneratePDF.mockRejectedValue(new Error('PDF gen error'))

    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'PDF gen error' })
  })

  it('returns generic error when non-Error is thrown', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const fetchChain = makeChain()
    fetchChain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'completed', informe_paciente: 'Patient content', created_at: '2025-01-15T10:30:00Z', patients: { name: 'Juan Pérez', phone: '+54911234567' } },
      error: null,
    })
    mockFrom.mockReturnValue(fetchChain)

    mockGeneratePDF.mockRejectedValue('string error')

    const result = await generateAndSavePdf('i-1')
    expect(result).toEqual({ error: 'Error desconocido' })
  })
})

describe('regeneratePdf', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls generateAndSavePdf and revalidatePath', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })

    const fetchChain = makeChain()
    fetchChain.single.mockResolvedValue({
      data: { id: 'i-1', status: 'completed', informe_paciente: 'content', created_at: '2025-01-15T10:30:00Z', patients: { name: 'Juan', phone: '+549' } },
      error: null,
    })

    const updateChain = makeChain()
    updateChain.eq.mockReturnValue(updateChain)

    mockFrom
      .mockReturnValueOnce(fetchChain)
      .mockReturnValueOnce(updateChain)

    mockGeneratePDF.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const storageChain = {
      upload: jest.fn().mockResolvedValue({ error: null }),
      createSignedUrl: jest.fn().mockResolvedValue({ data: { signedUrl: 'https://signed.url/pdf' } }),
    }
    mockStorage.mockReturnValue(storageChain)

    await regeneratePdf('i-1')

    expect(mockRevalidatePath).toHaveBeenCalledWith('/informes/i-1')
  })
})
