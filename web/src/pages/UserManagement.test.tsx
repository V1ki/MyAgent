import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithRouter } from '../test/test-utils'

describe('User Management Page', () => {
  it('should render user management page', async () => {
    await renderWithRouter('/users')
    
    // 验证页面标题存在
    expect(screen.getByTestId('page-title')).toHaveTextContent('用户管理')
  })
})