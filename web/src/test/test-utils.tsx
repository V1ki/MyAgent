import { render } from '@testing-library/react'
import { RouterProvider } from '@tanstack/react-router'
import { router } from '../router'
import { act } from '@testing-library/react'

export async function renderWithRouter(route: string) {
  // 导航到指定路由
  await act(async () => {
    await router.navigate({ to: route })
  })
  
  let renderResult: ReturnType<typeof render>;
  
  await act(async () => {
    renderResult = render(
      <RouterProvider router={router} />
    )
  })
  
  // 等待任何可能的异步状态更新完成
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0))
  })
  
  return renderResult!
}