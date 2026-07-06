import React, { useState } from 'react';
import { Table, Tag, Button, Space, Modal, message, Card, Row, Col, Typography, Empty, Statistic, Tabs, Badge, Tooltip } from 'antd';
import { 
  ExclamationCircleOutlined, BellOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  WarningOutlined, InfoOutlined, DeleteOutlined, CheckOutlined
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const Alerts = () => {
  const { theme, isDark } = useTheme();
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: 'High Data Drift Detected',
      description: 'Model accuracy dropped by 5.2% in the last 24 hours',
      severity: 'critical',
      type: 'drift',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'active',
      impact: 'High',
      affectedModel: 'Fraud Detection v2.1'
    },
    {
      id: 2,
      title: 'Model Performance Degradation',
      description: 'Precision decreased to 0.82 from 0.95',
      severity: 'high',
      type: 'performance',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      status: 'active',
      impact: 'High',
      affectedModel: 'Credit Scoring v1.5'
    },
    {
      id: 3,
      title: 'Unusual Prediction Pattern',
      description: 'Increase in fraud predictions by 120%',
      severity: 'high',
      type: 'pattern',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      status: 'active',
      impact: 'Medium',
      affectedModel: 'Fraud Detection v2.1'
    },
    {
      id: 4,
      title: 'API Response Time Slow',
      description: 'Average response time increased to 2.5s',
      severity: 'medium',
      type: 'performance',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'resolved',
      impact: 'Low',
      affectedModel: 'All Models'
    },
    {
      id: 5,
      title: 'Low Prediction Confidence',
      description: 'Average confidence score below threshold (78%)',
      severity: 'medium',
      type: 'quality',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'resolved',
      impact: 'Medium',
      affectedModel: 'Recommendation Engine'
    }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const getSeverityConfig = (severity) => {
    const config = {
      critical: { color: theme.error, icon: '🔴', label: 'Critical' },
      high: { color: theme.warning, icon: '🟠', label: 'High' },
      medium: { color: theme.info, icon: '🟡', label: 'Medium' },
      low: { color: theme.success, icon: '🟢', label: 'Low' }
    };
    return config[severity] || config.low;
  };

  const resolveAlert = (alertId) => {
    setAlerts(alerts.map(a => a.id === alertId ? { ...a, status: 'resolved' } : a));
    message.success('Alert marked as resolved');
  };

  const deleteAlert = (alertId) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    message.success('Alert deleted');
  };

  const showResolveConfirm = (alertId) => {
    confirm({
      title: 'Resolve Alert',
      icon: <CheckCircleOutlined />,
      content: 'Mark this alert as resolved?',
      okText: 'Yes',
      cancelText: 'No',
      onOk() {
        resolveAlert(alertId);
      },
    });
  };

  const showDeleteConfirm = (alertId) => {
    confirm({
      title: 'Delete Alert',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        deleteAlert(alertId);
      },
    });
  };

  const filteredAlerts = activeTab === 'all' 
    ? alerts 
    : alerts.filter(a => a.status === activeTab);

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status === 'active').length;
  const todayCount = alerts.filter(a => {
    const alertDate = new Date(a.timestamp);
    const today = new Date();
    return alertDate.toDateString() === today.toDateString();
  }).length;

  const alertColumns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity) => {
        const config = getSeverityConfig(severity);
        return (
          <Tag color={config.color} style={{ borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
            {config.icon} {config.label}
          </Tag>
        );
      }
    },
    {
      title: 'Alert',
      key: 'alert',
      render: (_, record) => (
        <div>
          <Text strong style={{ fontSize: 14, color: theme.text }}>
            {record.title}
          </Text>
          <Paragraph style={{ margin: '4px 0 0 0', color: theme.textSecondary, fontSize: 12 }}>
            {record.description}
          </Paragraph>
        </div>
      )
    },
    {
      title: 'Model',
      dataIndex: 'affectedModel',
      key: 'model',
      width: 150,
      render: (model) => <Text style={{ fontSize: 12, color: theme.text }}>{model}</Text>
    },
    {
      title: 'Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 120,
      render: (timestamp) => {
        const date = new Date(timestamp);
        const hours = Math.floor((Date.now() - date) / 3600000);
        return (
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {hours < 1 ? 'Now' : `${hours}h ago`}
          </Text>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge 
          status={status === 'active' ? 'processing' : 'success'} 
          text={<Text style={{ fontWeight: 600, fontSize: 12, color: theme.text }}>{status === 'active' ? 'Active' : 'Resolved'}</Text>}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.status === 'active' && (
            <Tooltip title="Resolve">
              <Button 
                size="small" 
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => showResolveConfirm(record.id)}
                style={{ background: theme.success, border: 'none' }}
              />
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <Button 
              size="small" 
              danger
              icon={<DeleteOutlined />}
              onClick={() => showDeleteConfirm(record.id)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{
      background: isDark ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' : theme.bg,
      minHeight: '100vh',
      padding: '48px 24px',
      position: 'relative'
    }}>
      <style>{`
        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .premium-card {
          background: ${isDark ? 'rgba(30, 25, 50, 0.8)' : 'rgba(255, 255, 255, 0.95)'} !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid ${theme.border} !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15) !important;
        }
        .stat-box {
          background: ${isDark ? 'linear-gradient(135deg, rgba(30, 25, 50, 0.9), rgba(30, 25, 50, 0.8))' : 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))'};
          backdrop-filter: blur(10px);
          border-radius: 14px;
          padding: 20px;
          border: 1.5px solid ${theme.border};
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }
        .stat-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: ${theme.primary};
        }
        .header-section {
          animation: slideInDown 0.6s ease-out;
        }
      `}</style>

      <div style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: 'center' }} className="header-section">
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            background: theme.gradient2,
            borderRadius: '20px',
            marginBottom: 16,
            boxShadow: '0 12px 36px rgba(240, 147, 251, 0.3)'
          }}>
            <BellOutlined style={{ fontSize: 44, color: 'white' }} />
          </div>
          <Title level={1} style={{
            background: theme.gradient2,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 12px 0',
            fontSize: 48,
            fontWeight: 900
          }}>
            Alerts & Monitoring
          </Title>
          <Paragraph style={{
            color: isDark ? 'rgba(232, 233, 243, 0.75)' : 'rgba(26, 26, 46, 0.6)',
            fontSize: 18,
            margin: 0
          }}>
            Real-time system alerts and notifications
          </Paragraph>
        </div>

        {/* Summary Stats */}
        <Row gutter={24} style={{ marginBottom: 36 }}>
          <Col xs={24} sm={12} md={6}>
            <div className="stat-box">
              <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Active Alerts
              </Text>
              <Title level={2} style={{ margin: 0, color: theme.error, fontWeight: 900, fontSize: 32 }}>
                {activeCount}
              </Title>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="stat-box">
              <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Critical Issues
              </Text>
              <Title level={2} style={{ margin: 0, color: theme.error, fontWeight: 900, fontSize: 32 }}>
                {criticalCount}
              </Title>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="stat-box">
              <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Today's Alerts
              </Text>
              <Title level={2} style={{ margin: 0, color: theme.warning, fontWeight: 900, fontSize: 32 }}>
                {todayCount}
              </Title>
            </div>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <div className="stat-box">
              <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: 600, display: 'block', marginBottom: 8 }}>
                Resolution Rate
              </Text>
              <Title level={2} style={{ margin: 0, color: theme.success, fontWeight: 900, fontSize: 32 }}>
                {Math.round((alerts.filter(a => a.status === 'resolved').length / alerts.length) * 100)}%
              </Title>
            </div>
          </Col>
        </Row>

        {/* Main Content */}
        <Card className="premium-card" style={{ borderRadius: 20 }}>
          <Tabs 
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'all',
                label: `All Alerts (${alerts.length})`,
                children: (
                  <div style={{ marginTop: 20 }}>
                    {filteredAlerts.length > 0 ? (
                      <Table
                        dataSource={filteredAlerts}
                        columns={alertColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        loading={loading}
                        style={{
                          background: 'rgba(255,255,255,0.5)',
                          borderRadius: 12
                        }}
                      />
                    ) : (
                      <Empty description="No alerts" style={{ marginTop: 40 }} />
                    )}
                  </div>
                )
              },
              {
                key: 'active',
                label: `Active (${activeCount})`,
                children: (
                  <div style={{ marginTop: 20 }}>
                    {filteredAlerts.length > 0 ? (
                      <Table
                        dataSource={filteredAlerts}
                        columns={alertColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        loading={loading}
                      />
                    ) : (
                      <Empty description="No active alerts" style={{ marginTop: 40 }} />
                    )}
                  </div>
                )
              },
              {
                key: 'resolved',
                label: `Resolved (${alerts.filter(a => a.status === 'resolved').length})`,
                children: (
                  <div style={{ marginTop: 20 }}>
                    {filteredAlerts.length > 0 ? (
                      <Table
                        dataSource={filteredAlerts}
                        columns={alertColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        loading={loading}
                      />
                    ) : (
                      <Empty description="No resolved alerts" style={{ marginTop: 40 }} />
                    )}
                  </div>
                )
              }
            ]}
          />
        </Card>
      </div>
    </div>
  );
};

export default Alerts;