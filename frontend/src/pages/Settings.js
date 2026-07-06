import React, { useState } from 'react';
import { Card, Form, Input, Button, Switch, Select, message, Divider, Row, Col, Typography, Space, InputNumber, Tag, Tooltip } from 'antd';
import { SaveOutlined, ReloadOutlined, SettingOutlined, BellOutlined, LockOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';

const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

const Settings = () => {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // In a real app, this would save settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      message.success('✅ Settings saved successfully');
    } catch (error) {
      message.error('❌ Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: isDark ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' : theme.bg,
      minHeight: '100vh',
      padding: '48px 24px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 70,
            height: 70,
            background: theme.gradient1,
            borderRadius: '16px',
            marginBottom: 16,
            boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
          }}>
            <SettingOutlined style={{ fontSize: 40, color: 'white' }} />
          </div>
        </div>
        <Title level={1} style={{
          background: theme.gradient1,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 12px 0',
          fontSize: 44,
          fontWeight: 900
        }}>
          System Settings
        </Title>
        <Paragraph style={{
          color: theme.textSecondary,
          fontSize: 16,
          margin: 0
        }}>
          Configure monitoring, alerts, and model management
        </Paragraph>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Monitoring Settings */}
        <Card style={{
          borderRadius: 20,
          marginBottom: 24,
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
        }}>
          <Row gutter={[20, 20]} align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <div style={{
                width: 50,
                height: 50,
                background: theme.gradient1,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <BellOutlined style={{ fontSize: 26, color: 'white' }} />
              </div>
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ margin: 0, color: theme.text }}>🔔 Monitoring & Alerts</Title>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Configure data drift detection and alert thresholds</Text>
            </Col>
          </Row>

          <Divider style={{ borderColor: theme.border, margin: '20px 0' }} />

          <Form
            form={form}
            name="monitoring"
            onFinish={onFinish}
            layout="vertical"
            initialValues={{
              drift_threshold: 0.15,
              performance_threshold: 0.08,
              alert_email: true,
              alert_slack: true,
              alert_dashboard: true,
              retraining_trigger: 'automatic',
              check_interval: 3600,
              retention_days: 90
            }}
          >
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>📊 Data Drift Threshold</span>}
                  name="drift_threshold"
                  rules={[{ required: true, message: 'Please input drift threshold' }]}
                >
                  <InputNumber 
                    min={0} 
                    max={1} 
                    step={0.01} 
                    style={{ width: '100%' }}
                    suffix="(0-1)"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>📉 Performance Degradation Threshold</span>}
                  name="performance_threshold"
                  rules={[{ required: true, message: 'Please input performance threshold' }]}
                >
                  <InputNumber 
                    min={0} 
                    max={1} 
                    step={0.01} 
                    style={{ width: '100%' }}
                    suffix="(0-1)"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ borderColor: theme.border, margin: '24px 0' }} />

            <Title level={4} style={{ color: theme.text, marginBottom: 16 }}>Alert Channels</Title>
            <Row gutter={24}>
              <Col xs={24} sm={8}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>📧 Email Alerts</span>}
                    name="alert_email" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Receive alerts via email</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>💬 Slack Alerts</span>}
                    name="alert_slack" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Send to Slack channel</Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>📱 Dashboard Alerts</span>}
                    name="alert_dashboard" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Show on dashboard</Text>
                </div>
              </Col>
            </Row>

            <Divider style={{ borderColor: theme.border, margin: '24px 0' }} />

            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>⚙️ Retraining Trigger</span>}
                  name="retraining_trigger"
                  rules={[{ required: true }]}
                >
                  <Select
                    style={{ borderRadius: 10 }}
                    optionLabelProp="label"
                  >
                    <Option value="manual" label={<span>🖱️ Manual</span>}>Manual</Option>
                    <Option value="automatic" label={<span>🤖 Automatic</span>}>Automatic</Option>
                    <Option value="scheduled" label={<span>⏰ Scheduled</span>}>Scheduled</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>⏱️ Check Interval (seconds)</span>}
                  name="check_interval"
                  rules={[{ required: true }]}
                >
                  <InputNumber 
                    min={60} 
                    max={86400} 
                    style={{ width: '100%' }}
                    suffix="sec"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                size="large"
                icon={<SaveOutlined />}
                style={{ background: theme.gradient1, border: 'none' }}
              >
                💾 Save Monitoring Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Model Management */}
        <Card style={{
          borderRadius: 20,
          marginBottom: 24,
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
        }}>
          <Row gutter={[20, 20]} align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <div style={{
                width: 50,
                height: 50,
                background: theme.gradient2,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DatabaseOutlined style={{ fontSize: 26, color: 'white' }} />
              </div>
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ margin: 0, color: theme.text }}>🤖 Model Management</Title>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Control active models and versioning</Text>
            </Col>
          </Row>

          <Divider style={{ borderColor: theme.border, margin: '20px 0' }} />

          <Form
            layout="vertical"
            initialValues={{
              active_model: 'v3.2',
              rollback_enabled: true,
              backup_models: 5,
              auto_cleanup: true,
              model_validation: true
            }}
            onFinish={onFinish}
          >
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>📌 Active Model Version</span>}
                  name="active_model"
                  rules={[{ required: true }]}
                >
                  <Select style={{ borderRadius: 10 }}>
                    <Option value="v3.2" label={<span>v3.2 <Tag color="green">LATEST</Tag></span>}>Model v3.2 (Latest)</Option>
                    <Option value="v3.1" label={<span>v3.1 <Tag color="blue">STABLE</Tag></span>}>Model v3.1 (Stable)</Option>
                    <Option value="v3.0">Model v3.0</Option>
                    <Option value="v2.5">Model v2.5</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>📦 Backup Models to Keep</span>}
                  name="backup_models"
                  rules={[{ required: true }]}
                >
                  <InputNumber 
                    min={1} 
                    max={20} 
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>🔄 Auto Rollback</span>}
                    name="rollback_enabled" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Automatically rollback on failures</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>✅ Model Validation</span>}
                    name="model_validation" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Validate before deployment</Text>
                </div>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                icon={<SaveOutlined />}
                style={{ background: theme.gradient2, border: 'none' }}
              >
                💾 Update Model Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Data Management */}
        <Card style={{
          borderRadius: 20,
          marginBottom: 24,
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
        }}>
          <Row gutter={[20, 20]} align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <div style={{
                width: 50,
                height: 50,
                background: theme.gradient3,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DatabaseOutlined style={{ fontSize: 26, color: 'white' }} />
              </div>
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ margin: 0, color: theme.text }}>💾 Data Management</Title>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Manage data retention and cleanup</Text>
            </Col>
          </Row>

          <Divider style={{ borderColor: theme.border, margin: '20px 0' }} />

          <Form
            layout="vertical"
            initialValues={{
              retention_days: 90,
              auto_cleanup: true,
              archive_old_data: true,
              compression: true
            }}
            onFinish={onFinish}
          >
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>📅 Data Retention (days)</span>}
                  name="retention_days"
                  rules={[{ required: true }]}
                >
                  <InputNumber 
                    min={7} 
                    max={730} 
                    style={{ width: '100%' }}
                    suffix="days"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label={<span style={{ color: theme.text, fontWeight: 600 }}>&nbsp;</span>}
                  style={{ visibility: 'hidden' }}
                >
                  <div />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>🧹 Auto Cleanup</span>}
                    name="auto_cleanup" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Remove old data automatically</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>📦 Compression</span>}
                    name="compression" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Compress archived data</Text>
                </div>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                icon={<SaveOutlined />}
                style={{ background: theme.gradient3, border: 'none' }}
              >
                💾 Save Data Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Security Settings */}
        <Card style={{
          borderRadius: 20,
          background: theme.cardBg,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)'
        }}>
          <Row gutter={[20, 20]} align="middle" style={{ marginBottom: 24 }}>
            <Col>
              <div style={{
                width: 50,
                height: 50,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <LockOutlined style={{ fontSize: 26, color: 'white' }} />
              </div>
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ margin: 0, color: theme.text }}>🔒 Security & Access</Title>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>Configure system security and permissions</Text>
            </Col>
          </Row>

          <Divider style={{ borderColor: theme.border, margin: '20px 0' }} />

          <Form
            layout="vertical"
            initialValues={{
              enable_api_key: true,
              require_auth: true,
              log_access: true,
              ssl_enabled: true
            }}
            onFinish={onFinish}
          >
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>🔑 API Key Authentication</span>}
                    name="enable_api_key" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Require API key for requests</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>👤 Require Authentication</span>}
                    name="require_auth" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Login required for access</Text>
                </div>
              </Col>
            </Row>

            <Row gutter={24} style={{ marginTop: 16 }}>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>📋 Access Logging</span>}
                    name="log_access" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Log all access attempts</Text>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{
                  background: theme.bgSecondary,
                  padding: 16,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`
                }}>
                  <Form.Item 
                    label={<span style={{ color: theme.text, fontWeight: 600 }}>🔐 SSL/TLS Encryption</span>}
                    name="ssl_enabled" 
                    valuePropName="checked"
                    style={{ marginBottom: 12 }}
                  >
                    <Switch />
                  </Form.Item>
                  <Text style={{ fontSize: 12, color: theme.textSecondary }}>Enable SSL/TLS encryption</Text>
                </div>
              </Col>
            </Row>

            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit" 
                size="large"
                icon={<SaveOutlined />}
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
              >
                💾 Save Security Settings
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Settings;