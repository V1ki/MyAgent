import { createRouter, createRoute, createRootRoute, Outlet } from '@tanstack/react-router'
import Dashboard from '../pages/Dashboard'
import UserManagement from '../pages/UserManagement'
import Settings from '../pages/Settings'
import ModelProviders from '../pages/ModelProviders'
import Models from '../pages/Models'
import Chat from '../pages/Chat'
import MainLayout from '../layouts/MainLayout'

const rootRoute = createRootRoute({
  component: ()=>{
    return <><Outlet/></>
  },
})

const layoutRoute = createRoute({
  id: 'layout',
  getParentRoute: () => rootRoute,
  component: MainLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/',
  component: Dashboard,
})

const userRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/users',
  component: UserManagement,
})

const modelsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/models',
  component: Models,
})

const modelProvidersRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/model-providers',
  component: ModelProviders,
})

const settingsRoute = createRoute({
  getParentRoute: () => layoutRoute,
  path: '/settings',
  component: Settings,
})

const chatRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat',
  component: Chat,
})

const layoutTree = layoutRoute.addChildren([indexRoute, userRoute, modelsRoute, modelProvidersRoute, settingsRoute])
const routeTree = rootRoute.addChildren([layoutTree, chatRoute])

export const router = createRouter({ routeTree })

// 声明路由类型
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}