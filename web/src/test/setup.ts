import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import './browserMocks'

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    display: 'block',
    appearance: ['-webkit-appearance'],
  }),
})
// 每个测试后自动清理
afterEach(() => {
  cleanup()
})