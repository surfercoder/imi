import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const mockRedirect = jest.fn()
const mockGetUser = jest.fn()

jest.mock('next/navigation', () => ({ redirect: (...args: unknown[]) => mockRedirect(...args) }))
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser } })),
}))
jest.mock('@/actions/auth', () => ({ logout: jest.fn() }))
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

import Home from '@/app/page'

const mockUser = { id: '1', email: 'doctor@hospital.com' }

describe('Home page', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the main heading when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    render(await Home())
    expect(screen.getByRole('heading', { name: 'Panel principal' })).toBeInTheDocument()
  })

  it('renders the user email in the header', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    render(await Home())
    expect(screen.getAllByText('doctor@hospital.com').length).toBeGreaterThan(0)
  })

  it('renders the logout button', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    render(await Home())
    expect(screen.getByRole('button', { name: /Cerrar sesión/i })).toBeInTheDocument()
  })

  it('renders the IMI brand in the header', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    render(await Home())
    expect(screen.getByText('IMI')).toBeInTheDocument()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    try { await Home() } catch { /* redirect throws in real Next.js */ }
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })
})
