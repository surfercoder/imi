import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Completado</Badge>)
    expect(screen.getByText('Completado')).toBeTruthy()
  })

  it('renders all variants without error', () => {
    const variants = ['default', 'secondary', 'destructive', 'success', 'warning', 'outline'] as const
    for (const variant of variants) {
      const { unmount } = render(<Badge variant={variant}>label</Badge>)
      unmount()
    }
  })

  it('applies custom style', () => {
    render(<Badge style={{ margin: 4 }}>styled</Badge>)
    expect(screen.getByText('styled')).toBeTruthy()
  })

  it('applies custom textStyle', () => {
    render(<Badge textStyle={{ fontSize: 16 }}>big</Badge>)
    expect(screen.getByText('big')).toBeTruthy()
  })
})
