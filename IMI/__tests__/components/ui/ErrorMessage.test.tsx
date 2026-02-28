import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { ErrorMessage } from '@/components/ui/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders the message text', () => {
    render(<ErrorMessage message="Algo salió mal" />)
    expect(screen.getByText('Algo salió mal')).toBeTruthy()
  })

  it('renders a different message', () => {
    render(<ErrorMessage message="Invalid credentials" />)
    expect(screen.getByText('Invalid credentials')).toBeTruthy()
  })
})
