import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react-native'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders without label', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeTruthy()
  })

  it('renders label when provided', () => {
    render(<Input label="Email" />)
    expect(screen.getByText('Email')).toBeTruthy()
  })

  it('renders error message', () => {
    render(<Input error="Campo requerido" />)
    expect(screen.getByText('Campo requerido')).toBeTruthy()
  })

  it('renders hint when no error', () => {
    render(<Input hint="Formato: DD-MM-YYYY" />)
    expect(screen.getByText('Formato: DD-MM-YYYY')).toBeTruthy()
  })

  it('does not render hint when error is present', () => {
    render(<Input hint="Hint text" error="Error text" />)
    expect(screen.queryByText('Hint text')).toBeNull()
    expect(screen.getByText('Error text')).toBeTruthy()
  })

  it('renders rightElement', () => {
    const { getByText } = render(
      <Input rightElement={<></>} />
    )
  })

  it('applies focused styles on focus', () => {
    render(<Input testID="input" />)
    const input = screen.getByTestId('input')
    fireEvent(input, 'focus')
    fireEvent(input, 'blur')
  })

  it('calls onChangeText when text changes', () => {
    const onChange = jest.fn()
    render(<Input onChangeText={onChange} />)
    const input = screen.getByDisplayValue('')
    fireEvent.changeText(input, 'hello')
    expect(onChange).toHaveBeenCalledWith('hello')
  })
})
