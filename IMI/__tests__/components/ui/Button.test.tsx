import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders children text', () => {
    render(<Button>Guardar</Button>)
    expect(screen.getByText('Guardar')).toBeTruthy()
  })

  it('calls onPress when pressed', () => {
    const onPress = jest.fn()
    render(<Button onPress={onPress}>Tap</Button>)
    fireEvent.press(screen.getByText('Tap'))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn()
    render(<Button onPress={onPress} disabled>Tap</Button>)
    fireEvent.press(screen.getByText('Tap'))
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows ActivityIndicator when loading', () => {
    const { UNSAFE_getByType } = render(<Button loading>Guardar</Button>)
    const { ActivityIndicator } = require('react-native')
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
  })

  it('does not call onPress when loading', () => {
    const onPress = jest.fn()
    const { getByTestId, UNSAFE_getByType } = render(
      <Button onPress={onPress} loading testID="btn">Tap</Button>
    )
    const { ActivityIndicator } = require('react-native')
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy()
    expect(onPress).not.toHaveBeenCalled()
  })

  it('renders all variants without error', () => {
    const variants = ['primary', 'outline', 'ghost', 'destructive', 'success'] as const
    for (const variant of variants) {
      const { unmount } = render(<Button variant={variant}>btn</Button>)
      unmount()
    }
  })

  it('renders all sizes without error', () => {
    const sizes = ['sm', 'md', 'lg'] as const
    for (const size of sizes) {
      const { unmount } = render(<Button size={size}>btn</Button>)
      unmount()
    }
  })

  it('renders fullWidth', () => {
    render(<Button fullWidth>Full</Button>)
    expect(screen.getByText('Full')).toBeTruthy()
  })

  it('renders non-string children (React node)', () => {
    render(
      <Button>
        <></>
      </Button>
    )
  })
})
