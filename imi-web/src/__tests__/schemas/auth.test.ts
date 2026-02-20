import { loginSchema, signupSchema, forgotPasswordSchema, resetPasswordSchema } from '@/schemas/auth'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({ email: 'doctor@hospital.com', password: 'secret' })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('El correo es requerido')
  })

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Correo inválido')
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'doctor@hospital.com', password: '' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('La contraseña es requerida')
  })
})

describe('signupSchema', () => {
  it('accepts valid signup data', () => {
    const result = signupSchema.safeParse({
      email: 'doctor@hospital.com',
      password: 'securepass',
      confirmPassword: 'securepass',
    })
    expect(result.success).toBe(true)
  })

  it('rejects password shorter than 8 characters', () => {
    const result = signupSchema.safeParse({
      email: 'doctor@hospital.com',
      password: 'short',
      confirmPassword: 'short',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('La contraseña debe tener al menos 8 caracteres')
  })

  it('rejects mismatched passwords', () => {
    const result = signupSchema.safeParse({
      email: 'doctor@hospital.com',
      password: 'securepass',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Las contraseñas no coinciden')
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'doctor@hospital.com' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = forgotPasswordSchema.safeParse({ email: 'bad' })
    expect(result.success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts matching passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword',
      confirmPassword: 'newpassword',
    })
    expect(result.success).toBe(true)
  })

  it('rejects mismatched passwords', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'newpassword',
      confirmPassword: 'different',
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toBe('Las contraseñas no coinciden')
  })
})
