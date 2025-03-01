import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../test/test-utils'

describe('Settings Page', () => {
  it('should render settings page', async () => {
    await renderWithRouter('/settings')
    
    // 验证页面标题存在
    expect(screen.getByTestId('page-title')).toHaveTextContent('系统设置')
  })
})