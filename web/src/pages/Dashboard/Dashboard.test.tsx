import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../../test/test-utils'

describe('Dashboard Page', () => {
  it('should render dashboard page', async () => {
    await renderWithRouter('/')
    
    // 验证页面标题存在
    expect(screen.getByTestId('page-title')).toHaveTextContent('数据统计面板')
  })
})