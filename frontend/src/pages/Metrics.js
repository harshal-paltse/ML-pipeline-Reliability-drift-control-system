import React, { useState, useEffect } from 'react';
import { Card, Row, Col, DatePicker, Select, Typography, Button, Space, Empty, Statistic, Table, Tag } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CalculatorOutlined, RiseOutlined, LineChartOutlined, FireOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTheme } from '../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const Metrics = () => {
  const { theme, isDark } = useTheme();
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);
  const [selectedModel, setSelectedModel] = useState('all');
  const [metricsData, setMetricsData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sample metrics data
  const timeSeriesData = [
    { date: 'Jan 1', accuracy: 0.92, precision: 0.89, recall: 0.91, f1: 0.90 },
    { date: 'Jan 8', accuracy: 0.935, precision: 0.91, recall: 0.92, f1: 0.915 },
    { date: 'Jan 15', accuracy: 0.94, precision: 0.92, recall: 0.925, f1: 0.9225 },
    { date: 'Jan 22', accuracy: 0.938, precision: 0.915, recall: 0.93, f1: 0.9225 },
    { date: 'Jan 29', accuracy: 0.93, precision: 0.91, recall: 0.925, f1: 0.9175 },
    { date: 'Feb 5', accuracy: 0.925, precision: 0.905, recall: 0.92, f1: 0.9125 },
    { date: 'Feb 12', accuracy: 0.92, precision: 0.9, recall: 0.915, f1: 0.9075 },
  ];

  const modelComparisonData = [
    { model: 'Fraud Detection', accuracy: 0.92, precision: 0.89, recall: 0.91, f1: 0.90 },
    { model: 'Credit Scoring', accuracy: 0.94, precision: 0.925, recall: 0.935, f1: 0.93 },
    { model: 'Risk Assessment', accuracy: 0.918, precision: 0.895, recall: 0.905, f1: 0.9 },
    { model: 'Recommendation', accuracy: 0.88, precision: 0.86, recall: 0.88, f1: 0.87 },
  ];

  const performanceMetrics = [
    { metric: 'Accuracy', value: 0.92, target: 0.95, change: '+2.3%' },
    { metric: 'Precision', value: 0.89, target: 0.92, change: '+1.8%' },
    { metric: 'Recall', value: 0.91, target: 0.93, change: '+1.5%' },
    { metric: 'F1-Score', value: 0.90, target: 0.92, change: '+2.1%' },
    { metric: 'AUC-ROC', value: 0.96, target: 0.97, change: '+0.8%' },
    { metric: 'Inference Time', value: 145, target: 200, change: '-12ms' },
  ];

  useEffect(() => {
    fetchMetrics();
  }, [dateRange, selectedModel]);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setMetricsData(timeSeriesData);
    } catch (error) {
      console.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  const modelColumns = [
    {
      title: 'Model Name',
      dataIndex: 'model',
      key: 'model',
      render: (text) => <Text strong style={{ color: theme.text }}>{text}</Text>
    },
    {
      title: 'Accuracy',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (value) => <Text style={{ color: theme.text }}>{(value * 100).toFixed(1)}%</Text>
    },
    {
      title: 'Precision',
      dataIndex: 'precision',
      key: 'precision',
      render: (value) => <Text style={{ color: theme.text }}>{(value * 100).toFixed(1)}%</Text>
    },
    {
      title: 'Recall',
      dataIndex: 'recall',
      key: 'recall',
      render: (value) => <Text style={{ color: theme.text }}>{(value * 100).toFixed(1)}%</Text>
    },
    {
      title: 'F1-Score',
      dataIndex: 'f1',
      key: 'f1',
      render: (value) => <Text>{(value * 100).toFixed(1)}%</Text>
    },
    {
      title: 'Status',
      key: 'status',
      render: () => <Tag color="green">Healthy</Tag>
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
        .metric-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          font-weight: 700;
          font-size: 18px;
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
            background: theme.gradient1,
            borderRadius: '20px',
            marginBottom: 16,
            boxShadow: '0 12px 36px rgba(102, 126, 234, 0.3)'
          }}>
            <CalculatorOutlined style={{ fontSize: 44, color: 'white' }} />
          </div>
          <Title level={1} style={{
            background: theme.gradient1,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 12px 0',
            fontSize: 48,
            fontWeight: 900
          }}>
            Performance Metrics
          </Title>
          <Paragraph style={{
            color: isDark ? 'rgba(232, 233, 243, 0.75)' : 'rgba(26, 26, 46, 0.6)',
            fontSize: 18,
            margin: 0
          }}>
            Comprehensive model performance analysis and insights
          </Paragraph>
        </div>

        {/* Filters */}
        <Card className="premium-card" style={{ marginBottom: 24 }}>
          <Row gutter={24} align="middle">
            <Col xs={24} sm={12} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Date Range</Text>
              <RangePicker 
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Model</Text>
              <Select
                value={selectedModel}
                onChange={setSelectedModel}
                style={{ width: '100%' }}
                options={[
                  { label: 'All Models', value: 'all' },
                  { label: 'Fraud Detection', value: 'fraud' },
                  { label: 'Credit Scoring', value: 'credit' },
                  { label: 'Risk Assessment', value: 'risk' },
                  { label: 'Recommendation', value: 'recommendation' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={12}>
              <Space>
                <Button type="primary" style={{ background: theme.primary, border: 'none' }}>
                  Export Report
                </Button>
                <Button>Refresh</Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Key Metrics */}
        <Row gutter={24} style={{ marginBottom: 24 }}>
          {performanceMetrics.slice(0, 4).map((metric, idx) => (
            <Col xs={24} sm={12} md={6} key={idx}>
              <div className="stat-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <Text style={{ fontSize: 12, color: theme.textSecondary, fontWeight: 600 }}>
                    {metric.metric}
                  </Text>
                  <div style={{
                    padding: '2px 8px',
                    background: metric.change.includes('+') ? 'rgba(6, 199, 85, 0.1)' : 'rgba(255, 59, 48, 0.1)',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                    color: metric.change.includes('+') ? theme.success : theme.error
                  }}>
                    {metric.change}
                  </div>
                </div>
                <Title level={2} style={{ margin: '0 0 8px 0', fontWeight: 900, fontSize: 28, color: theme.primary }}>
                  {(metric.value * 100).toFixed(1)}%
                </Title>
                <Text style={{ fontSize: 11, color: theme.textTertiary }}>
                  Target: {(metric.target * 100).toFixed(1)}%
                </Text>
              </div>
            </Col>
          ))}
        </Row>

        {/* Time Series Chart */}
        <Card className="premium-card" style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 24, color: theme.text }}>
            <LineChartOutlined style={{ marginRight: 12, color: theme.primary }} />
            Performance Trend (Last 30 Days)
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.primary} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={theme.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="date" stroke={theme.textSecondary} />
              <YAxis stroke={theme.textSecondary} />
              <Tooltip 
                contentStyle={{
                  background: isDark ? 'rgba(30, 25, 50, 0.95)' : 'rgba(255,255,255,0.95)',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  color: theme.text
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="accuracy" stroke={theme.primary} fillOpacity={1} fill="url(#colorAccuracy)" name="Accuracy" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Model Comparison */}
        <Card className="premium-card" style={{ marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 24, color: theme.text }}>
            <RiseOutlined style={{ marginRight: 12, color: theme.secondary }} />
            Model Performance Comparison
          </Title>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={modelComparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis dataKey="model" stroke={theme.textSecondary} />
              <YAxis stroke={theme.textSecondary} />
              <Tooltip 
                contentStyle={{
                  background: isDark ? 'rgba(30, 25, 50, 0.95)' : 'rgba(255,255,255,0.95)',
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  color: theme.text
                }}
              />
              <Legend />
              <Bar dataKey="accuracy" fill={theme.primary} name="Accuracy" radius={[8, 8, 0, 0]} />
              <Bar dataKey="precision" fill={theme.secondary} name="Precision" radius={[8, 8, 0, 0]} />
              <Bar dataKey="recall" fill={theme.info} name="Recall" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Detailed Model Metrics */}
        <Card className="premium-card">
          <Title level={3} style={{ marginBottom: 24, color: theme.text }}>
            <FireOutlined style={{ marginRight: 12, color: theme.warning }} />
            Detailed Model Metrics
          </Title>
          <Table
            dataSource={modelComparisonData}
            columns={modelColumns}
            rowKey="model"
            pagination={false}
            style={{ background: 'rgba(255,255,255,0.5)' }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Metrics;