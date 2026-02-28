import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { Card } from '@/components/ui/Card'

describe('Card', () => {
  it('renders children', () => {
    render(<Card><Text>Content</Text></Card>)
    expect(screen.getByText('Content')).toBeTruthy()
  })

  it('uses default padding of 16', () => {
    const { UNSAFE_getByType } = render(<Card><Text>x</Text></Card>)
    const { View } = require('react-native')
    const view = UNSAFE_getByType(View)
    expect(view).toBeTruthy()
  })

  it('accepts custom padding', () => {
    render(<Card padding={24}><Text>padded</Text></Card>)
    expect(screen.getByText('padded')).toBeTruthy()
  })

  it('applies custom style', () => {
    render(<Card style={{ margin: 8 }}><Text>styled</Text></Card>)
    expect(screen.getByText('styled')).toBeTruthy()
  })
})
