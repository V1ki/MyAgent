import { createRouter, createRoute, createRootRoute } from '@tanstack/react-router'
import Dashboard from '../pages/Dashboard'
import UserManagement from '../pages/UserManagement'
import Settings from '../pages/Settings'
import ModelProviders from '../pages/ModelProviders'
import Models from '../pages/Models'
import MainLayout from '../layouts/MainLayout'

const rootRoute = createRootRoute({
  component: MainLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
})

const userRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UserManagement,
})

const modelsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/models',
  component: Models,
})

const modelProvidersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/model-providers',
  component: ModelProviders,
})

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
})

const routeTree = rootRoute.addChildren([indexRoute, userRoute, modelsRoute, modelProvidersRoute, settingsRoute])

export const router = createRouter({ routeTree })

// 声明路由类型
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}