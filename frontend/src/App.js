import React from 'react';
import { Layout, Menu, Typography, Button, Space, Tooltip } from 'antd';
import { DashboardOutlined, AlertOutlined, BarChartOutlined, SettingOutlined, ThunderboltOutlined, BgColorsOutlined, SunOutlined, MoonOutlined } from '@ant-design/icons';
import Dashboard from './pages/Dashboard';
import Alerts from './pages/Alerts';
import Metrics from './pages/Metrics';
import Settings from './pages/Settings';
import Prediction from './pages/Prediction';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

function AppContent() {
  const [currentPage, setCurrentPage] = React.useState('dashboard');
  const { isDark, toggleTheme, theme } = useTheme();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'prediction':
        return <Prediction />;
      case 'alerts':
        return <Alerts />;
      case 'metrics':
        return <Metrics />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: theme.bg }}>
      <Header style={{
        padding: '0 24px',
        background: theme.headerBg,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Title level={3} style={{
          margin: 0,
          background: theme.gradient1,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '0.05em'
        }}>
          ML Monitoring Dashboard
        </Title>
        <Tooltip title={isDark ? 'Light Theme' : 'Dark Theme'}>
          <Button
            type="text"
            icon={isDark ? <SunOutlined style={{ fontSize: 18, color: theme.warning }} /> : <MoonOutlined style={{ fontSize: 18, color: theme.primary }} />}
            onClick={toggleTheme}
            style={{ fontSize: 18, color: theme.text }}
          />
        </Tooltip>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: theme.siderBg, borderRight: `1px solid ${theme.border}` }}>
          <Menu
            mode="inline"
            selectedKeys={[currentPage]}
            onClick={(e) => setCurrentPage(e.key)}
            style={{
              height: '100%',
              borderRight: 0,
              background: theme.siderBg,
              color: theme.text
            }}
            theme={isDark ? 'dark' : 'light'}
          >
            <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
              Dashboard
            </Menu.Item>
            <Menu.Item key="prediction" icon={<ThunderboltOutlined />}>
              Make Prediction
            </Menu.Item>
            <Menu.Item key="alerts" icon={<AlertOutlined />}>
              Alerts
            </Menu.Item>
            <Menu.Item key="metrics" icon={<BarChartOutlined />}>
              Metrics
            </Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />}>
              Settings
            </Menu.Item>
          </Menu>
        </Sider>
        <Layout style={{ padding: '0 24px 24px', background: theme.bg }}>
          <Content style={{ padding: 24, margin: 0, minHeight: 280, background: theme.bg }}>
            {renderPage()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;