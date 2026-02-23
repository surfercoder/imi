import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'

const mockRedirect = jest.fn()
const mockGetUser = jest.fn()
const mockFrom = jest.fn()

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@anthropic-ai/sdk', () => jest.fn().mockImplementation(() => ({ messages: { create: jest.fn() } })))
jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
  useRouter: () => ({ push: jest.fn() }),
}))
jest.mock('@/utils/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({ auth: { getUser: mockGetUser }, from: mockFrom })),
}))
jest.mock('@/actions/auth', () => ({ logout: jest.fn() }))
jest.mock('@/actions/informes', () => ({ getInformes: jest.fn() }))
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  MockLink.displayName = 'MockLink'
  return MockLink
})

import Home from '@/app/page'

const mockUser = { id: '1', email: 'doctor@hospital.com' }

function makeFromChain(data: unknown[] | null) {
  const chain = {
    select: jest.fn(),
    eq: jest.fn(),
    order: jest.fn(),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.order.mockResolvedValue({ data, error: null })
  return chain
}

describe('Home page', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renders the main heading when user is authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(makeFromChain([]))
    render(await Home())
    expect(screen.getByRole('heading', { name: 'Panel principal' })).toBeInTheDocument()
  })

  it('renders the user email in the header', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(makeFromChain([]))
    render(await Home())
    expect(screen.getAllByText('doctor@hospital.com').length).toBeGreaterThan(0)
  })

  it('renders the logout button', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(makeFromChain([]))
    render(await Home())
    expect(screen.getByRole('button', { name: /Cerrar sesión/i })).toBeInTheDocument()
  })

  it('renders the IMI brand in the header', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(makeFromChain([]))
    render(await Home())
    expect(screen.getByText('IMI')).toBeInTheDocument()
  })

  it('redirects to /login when user is not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })
    try { await Home() } catch { /* redirect throws in real Next.js */ }
    expect(mockRedirect).toHaveBeenCalledWith('/login')
  })

  it('renders error count card when there are errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(makeFromChain([
      { status: 'error' },
      { status: 'error' },
      { status: 'completed' },
    ]))
    render(await Home())
    expect(screen.getByText('Con errores')).toBeInTheDocument()
  })

  it('renders processing count card when no errors', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(makeFromChain([
      { status: 'processing' },
      { status: 'completed' },
    ]))
    render(await Home())
    expect(screen.getByText('En proceso')).toBeInTheDocument()
  })

  it('handles null informes response gracefully', async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } })
    mockFrom.mockReturnValue(makeFromChain(null))
    render(await Home())
    expect(screen.getByText('0 total')).toBeInTheDocument()
  })
})
