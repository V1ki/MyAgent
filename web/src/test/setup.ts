import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import './browserMocks'

const { getComputedStyle } = window;
window.getComputedStyle = (elt) => getComputedStyle(elt);

// 每个测试后自动清理
afterEach(() => {
  cleanup()
})