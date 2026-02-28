import '@testing-library/jest-native/extend-expect'

jest.mock('expo/src/winter', () => ({}))
jest.mock('expo/src/winter/runtime.native', () => ({}))
jest.mock('expo/virtual/streams', () => ({}))
