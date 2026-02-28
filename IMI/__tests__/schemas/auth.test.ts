import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  ESPECIALIDADES,
} from '@/schemas/auth'

const validSignup = {
  email: 'doctor@hospital.com',
  password: 'securepass',
  confirmPassword: 'securepass',
  matricula: '123456',
  phone: '+54 11 1234-5678',
  especialidad: 'Cardiología',
}

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const r = loginSchema.safeParse({ email: 'doctor@hospital.com', password: 'secret' })
    expect(r.success).toBe(true)
  })

  it('rejects empty email', () => {
    const r = loginSchema.safeParse({ email: '', password: 'secret' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('El correo es requerido')
  })

  it('rejects invalid email format', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Correo inválido')
  })

  it('rejects empty password', () => {
    const r = loginSchema.safeParse({ email: 'doctor@hospital.com', password: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('La contraseña es requerida')
  })
})

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    const r = signupSchema.safeParse(validSignup)
    expect(r.success).toBe(true)
  })

  it('rejects empty email', () => {
    const r = signupSchema.safeParse({ ...validSignup, email: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('El correo es requerido')
  })

  it('rejects invalid email format', () => {
    const r = signupSchema.safeParse({ ...validSignup, email: 'bad' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Correo inválido')
  })

  it('rejects password shorter than 8 characters', () => {
    const r = signupSchema.safeParse({ ...validSignup, password: 'short', confirmPassword: 'short' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('La contraseña debe tener al menos 8 caracteres')
  })

  it('rejects mismatched passwords', () => {
    const r = signupSchema.safeParse({ ...validSignup, confirmPassword: 'different' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Las contraseñas no coinciden')
  })

  it('rejects empty matricula', () => {
    const r = signupSchema.safeParse({ ...validSignup, matricula: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('La matrícula es requerida')
  })

  it('rejects non-numeric matricula', () => {
    const r = signupSchema.safeParse({ ...validSignup, matricula: 'ABC123' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('La matrícula debe contener solo números')
  })

  it('rejects empty phone', () => {
    const r = signupSchema.safeParse({ ...validSignup, phone: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('El teléfono es requerido')
  })

  it('rejects invalid phone format', () => {
    const r = signupSchema.safeParse({ ...validSignup, phone: 'abc' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Teléfono inválido')
  })

  it('accepts various valid phone formats', () => {
    const phones = ['+54 11 1234-5678', '1134567890', '+1 (800) 555-0100']
    for (const phone of phones) {
      const r = signupSchema.safeParse({ ...validSignup, phone })
      expect(r.success).toBe(true)
    }
  })

  it('rejects empty especialidad', () => {
    const r = signupSchema.safeParse({ ...validSignup, especialidad: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('La especialidad es requerida')
  })

  it('rejects invalid especialidad not in list', () => {
    const r = signupSchema.safeParse({ ...validSignup, especialidad: 'Magia' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Seleccioná una especialidad válida')
  })

  it('accepts all valid especialidades', () => {
    const sample = ['Alergología', 'Neurocirugía', 'Hidrología médica', 'Radiodiagnóstico']
    for (const esp of sample) {
      const r = signupSchema.safeParse({ ...validSignup, especialidad: esp })
      expect(r.success).toBe(true)
    }
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const r = forgotPasswordSchema.safeParse({ email: 'doctor@hospital.com' })
    expect(r.success).toBe(true)
  })

  it('rejects empty email', () => {
    const r = forgotPasswordSchema.safeParse({ email: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('El correo es requerido')
  })

  it('rejects invalid email', () => {
    const r = forgotPasswordSchema.safeParse({ email: 'bad' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Correo inválido')
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const r = resetPasswordSchema.safeParse({ password: 'newpassword', confirmPassword: 'newpassword' })
    expect(r.success).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const r = resetPasswordSchema.safeParse({ password: 'short', confirmPassword: 'short' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('La contraseña debe tener al menos 8 caracteres')
  })

  it('rejects mismatched passwords', () => {
    const r = resetPasswordSchema.safeParse({ password: 'newpassword', confirmPassword: 'different' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0].message).toBe('Las contraseñas no coinciden')
  })
})

describe('ESPECIALIDADES', () => {
  it('contains 48 specialties', () => {
    expect(ESPECIALIDADES).toHaveLength(48)
  })

  it('includes expected specialties', () => {
    expect(ESPECIALIDADES).toContain('Cardiología')
    expect(ESPECIALIDADES).toContain('Neurología')
    expect(ESPECIALIDADES).toContain('Pediatría')
  })

  it('has no duplicate entries', () => {
    const unique = new Set(ESPECIALIDADES)
    expect(unique.size).toBe(ESPECIALIDADES.length)
  })
})
