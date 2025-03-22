import React, { useState } from 'react';
import { Layout, Menu, Button, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  DashboardOutlined,
  SettingOutlined,
  ApiOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { Link, Outlet, useNavigate, useRouterState } from '@tanstack/react-router';

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    // 对于子菜单项，如 /models，需要返回精确的路径
    return [currentPath];
  };
  
  // 获取应该展开的子菜单
  const getOpenKeys = () => {
    if (currentPath === '/models' || currentPath === '/model-providers') {
      return ['models-submenu'];
    }
    return [];
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表盘',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: 'models-submenu',
      icon: <AppstoreOutlined />,
      label: '模型管理',
      children: [
        {
          key: '/models',
          icon: <AppstoreOutlined />,
          label: '模型',
        },
        {
          key: '/model-providers',
          icon: <ApiOutlined />,
          label: '模型提供商',
        },
      ],
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="logo h-8 m-4 bg-white/10" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKeys()}
          openKeys={getOpenKeys()}
          items={menuItems}
          onSelect={({ key }) => navigate({ to: key as string })}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: colorBgContainer,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;