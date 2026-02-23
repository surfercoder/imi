import { generateInformePDF } from '@/lib/pdf'

describe('generateInformePDF', () => {
  const baseOptions = {
    patientName: 'Juan Pérez',
    patientPhone: '+54 9 261 123 4567',
    date: '01 de enero de 2025',
    content: 'Contenido del informe médico.',
  }

  it('returns a Uint8Array', async () => {
    const result = await generateInformePDF(baseOptions)
    expect(result).toBeInstanceOf(Uint8Array)
  })

  it('produces a non-empty PDF', async () => {
    const result = await generateInformePDF(baseOptions)
    expect(result.length).toBeGreaterThan(0)
  })

  it('starts with the PDF magic bytes %PDF', async () => {
    const result = await generateInformePDF(baseOptions)
    const header = String.fromCharCode(...result.slice(0, 4))
    expect(header).toBe('%PDF')
  })

  it('handles content with section headers ending in colon', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: 'DIAGNÓSTICO:\nEl paciente presenta fiebre.',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles content with ## markdown headers', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: '## Motivo de consulta\nDolor de cabeza.',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles content with ** bold markers', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: '**Diagnóstico:** Gripe común.',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles content with all-caps section headers', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: 'MOTIVO DE CONSULTA: dolor de cabeza',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles empty paragraphs (blank lines)', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: 'Primera sección.\n\nSegunda sección.',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles long content that requires multiple pages', async () => {
    const longContent = Array(100)
      .fill('Esta es una línea de contenido médico muy larga que se repite para forzar múltiples páginas en el PDF generado.')
      .join('\n')
    const result = await generateInformePDF({
      ...baseOptions,
      content: longContent,
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles content with long words that exceed line width', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: 'Palabra ' + 'a'.repeat(200) + ' fin.',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles content with * single star markers', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: '*Nota importante:* tomar medicamento con agua.',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles empty content string', async () => {
    const result = await generateInformePDF({
      ...baseOptions,
      content: '',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
  })
})
