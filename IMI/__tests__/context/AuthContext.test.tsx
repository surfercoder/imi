import React from 'react'
import { renderHook, act } from '@testing-library/react-native'

const mockGetSession = jest.fn()
const mockOnAuthStateChange = jest.fn()
const mockSignOut = jest.fn()
const mockUnsubscribe = jest.fn()

jest.mock('@/utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
  },
}))

import { AuthProvider, useAuth } from '@/context/AuthContext'

const mockSession = { user: { id: 'u-1', email: 'doc@h.com' }, access_token: 'tok' }

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>
}

describe('AuthProvider / useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } })
  })

  it('starts with loading=true, session=null, user=null', () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.loading).toBe(true)
    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('sets session and user after getSession resolves with a session', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.user).toEqual(mockSession.user)
  })

  it('sets session=null and user=null when no session exists', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.loading).toBe(false)
    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('updates session on onAuthStateChange event', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    let authCallback: (event: string, session: unknown) => void = () => {}
    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    expect(result.current.session).toBeNull()
    await act(async () => {
      authCallback('SIGNED_IN', mockSession)
    })
    expect(result.current.session).toEqual(mockSession)
    expect(result.current.user).toEqual(mockSession.user)
  })

  it('clears session on SIGNED_OUT event', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } })
    let authCallback: (event: string, session: unknown) => void = () => {}
    mockOnAuthStateChange.mockImplementation((cb: typeof authCallback) => {
      authCallback = cb
      return { data: { subscription: { unsubscribe: mockUnsubscribe } } }
    })
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    await act(async () => {
      authCallback('SIGNED_OUT', null)
    })
    expect(result.current.session).toBeNull()
    expect(result.current.user).toBeNull()
  })

  it('calls supabase.auth.signOut when signOut is called', async () => {
    mockGetSession.mockResolvedValue({ data: { session: mockSession } })
    mockSignOut.mockResolvedValue({})
    const { result } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    await act(async () => {
      await result.current.signOut()
    })
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('unsubscribes from auth changes on unmount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const { unmount } = renderHook(() => useAuth(), { wrapper })
    await act(async () => {})
    unmount()
    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
