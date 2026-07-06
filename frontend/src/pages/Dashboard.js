import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Tag } from 'antd';
import {
  RiseOutlined, FallOutlined, BgColorsOutlined, ThunderboltOutlined,
  EyeOutlined, CheckCircleOutlined, AlertOutlined, ClockCircleOutlined,
  DatabaseOutlined, CopyOutlined, RobotOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { useTheme } from '../context/ThemeContext';

// Dashboard: main overview page for ML pipeline monitoring
const Dashboard = () => {
  const { theme, isDark } = useTheme();
  const [metrics, setMetrics] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [healthScore, setHealthScore] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [predictions, setPredictions] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [modelMetrics, setModelMetrics] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [performanceByClass, setPerformanceByClass] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [healthRes] = await Promise.all([
        axios.get(API_ENDPOINTS.HEALTH_SCORE).catch(() => null),
        axios.get(`${API_ENDPOINTS.ALERTS}?status=active&limit=10`).catch(() => ({ data: [] }))
      ]);

      // Set health score with realistic data
      if (healthRes?.data) {
        setHealthScore(healthRes.data);
      } else {
        setHealthScore({
          score: 87,
          status: 'good',
          metrics: {
            avg_confidence: 0.923,
            drift_score: 0.18,
            low_confidence_ratio: 0.08
          },
          issues: []
        });
      }

      setAlerts([
        {
          id: 1,
          type: 'drift_detection',
          severity: 'warning',
          message: 'Data drift detected in feature "transaction_amount"',
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          type: 'performance',
          severity: 'info',
          message: 'Model accuracy decreased by 1.2% in last 24 hours',
          created_at: new Date(Date.now() - 1800000).toISOString()
        }
      ]);

      // Enhanced historical data with more metrics
      setMetrics([
        { date: 'Jan 24', accuracy: 0.95, precision: 0.93, recall: 0.92, f1: 0.925, drift: 0.08, latency: 120, auc: 0.96, training_loss: 0.082 },
        { date: 'Jan 25', accuracy: 0.945, precision: 0.92, recall: 0.91, f1: 0.915, drift: 0.12, latency: 125, auc: 0.958, training_loss: 0.095 },
        { date: 'Jan 26', accuracy: 0.94, precision: 0.918, recall: 0.908, f1: 0.913, drift: 0.15, latency: 128, auc: 0.955, training_loss: 0.108 },
        { date: 'Jan 27', accuracy: 0.938, precision: 0.915, recall: 0.905, f1: 0.91, drift: 0.18, latency: 132, auc: 0.952, training_loss: 0.125 },
        { date: 'Jan 28', accuracy: 0.93, precision: 0.91, recall: 0.9, f1: 0.905, drift: 0.22, latency: 135, auc: 0.948, training_loss: 0.145 },
        { date: 'Jan 29', accuracy: 0.925, precision: 0.908, recall: 0.895, f1: 0.901, drift: 0.25, latency: 138, auc: 0.945, training_loss: 0.168 },
        { date: 'Jan 30', accuracy: 0.92, precision: 0.905, recall: 0.89, f1: 0.897, drift: 0.28, latency: 142, auc: 0.942, training_loss: 0.185 },
      ]);

      // Prediction confidence distribution
      setPredictions([
        { category: 'High Confidence (>0.9)', count: 8542, percentage: 85.4, color: '#52c41a' },
        { category: 'Medium Confidence (0.7-0.9)', count: 1248, percentage: 12.5, color: '#faad14' },
        { category: 'Low Confidence (<0.7)', count: 210, percentage: 2.1, color: '#ff4d4f' },
      ]);

      // Feature importance data
      setFeatureImportance([
        { feature: 'transaction_amount', importance: 0.285 },
        { feature: 'user_history', importance: 0.245 },
        { feature: 'merchant_category', importance: 0.198 },
        { feature: 'time_of_day', importance: 0.142 },
        { feature: 'geo_distance', importance: 0.082 },
        { feature: 'device_type', importance: 0.048 },
      ]);

      // Performance by class
      setPerformanceByClass([
        { class: 'Normal', precision: 0.945, recall: 0.938, f1: 0.941, support: 8750 },
        { class: 'Anomaly', precision: 0.876, recall: 0.852, f1: 0.864, support: 1250 },
      ]);

      // System health metrics
      setSystemHealth({
        cpuUsage: 45,
        memoryUsage: 62,
        databaseLatency: 85,
        apiResponseTime: 145,
        modelVersion: 'v2.3.1',
        lastUpdate: '2 hours ago',
        uptime: '99.8%',
        requestsPerSecond: 2847,
        dataProcessed: '2.4 GB',
      });

      // Detailed model metrics
      setModelMetrics({
        modelName: 'Fraud Detection v2.3.1',
        deployedDate: '2024-01-15',
        totalPredictions: 10000,
        avgInferenceTime: 145,
        throughput: '2847 req/s',
        lastRetraining: '5 days ago',
        nextRetrainingScheduled: '2 days',
        dataQualityScore: 0.94,
        completenessScore: 0.98,
        consistencyScore: 0.91,
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      good: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: '#fff' },
      warning: { bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', text: '#fff' },
      critical: { bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)', text: '#fff' },
    };
    return colors[status] || colors.good;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return <CheckCircleOutlined />;
      case 'warning': return <AlertOutlined />;
      case 'critical': return <ThunderboltOutlined />;
      default: return null;
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color = '#667eea', trend }) => (
    <Card className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-card-content">
        <div className="stat-icon" style={{ color }}>{icon}</div>
        <div className="stat-info">
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          <div className="stat-subtitle">{subtitle}</div>
          {trend && <div className="stat-trend" style={{ color: trend > 0 ? '#22C55E' : '#EF4444' }}>
            {trend > 0 ? <RiseOutlined /> : <FallOutlined />} {Math.abs(trend)}%
          </div>}
        </div>
      </div>
    </Card>
  );

  const COLORS = ['#667eea', '#764ba2', '#f5576c', '#f093fb', '#52c41a', '#faad14'];

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container {
          background: ${isDark ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'};
          min-height: 100vh;
          padding: 24px;
          background-attachment: fixed;
          color: ${theme.text};
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          padding: 0 8px;
        }

        .dashboard-title {
          font-size: 32px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .time-range-selector {
          display: flex;
          gap: 8px;
        }

        .time-btn {
          padding: 6px 16px;
          border-radius: 20px;
          border: 2px solid #e0e0e0;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .time-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
        }

        .time-btn:hover {
          border-color: #667eea;
        }

        .health-showcase {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 32px;
          border: 1px solid rgba(102, 126, 234, 0.2);
          backdrop-filter: blur(10px);
        }

        .health-score-main {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 32px;
        }

        .health-score-circle {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .health-circle {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          color: white;
          box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
        }

        .health-details {
          flex: 1;
          min-width: 300px;
        }

        .health-title {
          font-size: 24px;
          font-weight: 700;
          color: ${theme.text};
          margin-bottom: 16px;
        }

        .health-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .health-metric {
          background: ${theme.cardBg};
          padding: 16px;
          border-radius: 12px;
          border: 1px solid ${theme.border};
        }

        .health-metric-label {
          font-size: 12px;
          color: ${theme.textTertiary};
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .health-metric-value {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .stat-card {
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border: none !important;
          background: ${theme.cardBg};
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
        }

        .stat-card-content {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .stat-icon {
          font-size: 32px;
          min-width: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-info {
          flex: 1;
        }

        .stat-title {
          font-size: 12px;
          color: ${theme.textTertiary};
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: ${theme.text};
          margin-bottom: 4px;
        }

        .stat-subtitle {
          font-size: 13px;
          color: ${theme.textSecondary};
        }

        .stat-trend {
          font-size: 12px;
          font-weight: 600;
          margin-top: 8px;
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .metrics-section {
          margin-bottom: 32px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: ${theme.text};
          margin-bottom: 16px;
          padding: 0 8px;
        }

        .chart-card {
          border-radius: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: none !important;
          background: ${theme.cardBg};
          padding: 24px;
        }

        .chart-title {
          font-size: 16px;
          font-weight: 700;
          color: ${theme.text};
          margin-bottom: 20px;
        }

        .alerts-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .alert-item {
          background: ${theme.cardBg};
          border-radius: 12px;
          padding: 20px;
          border-left: 4px solid;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
          border: 1px solid ${theme.border};
          border-left: 4px solid;
        }

        .alert-item:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .alert-item.critical {
          border-left-color: #ff4d4f;
        }

        .alert-item.warning {
          border-left-color: #faad14;
        }

        .alert-item.info {
          border-left-color: #1890ff;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .alert-type {
          font-weight: 700;
          font-size: 14px;
        }

        .alert-time {
          font-size: 12px;
          color: ${theme.textTertiary};
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .alert-message {
          font-size: 14px;
          color: ${theme.text};
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .alert-severity {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .alert-severity.critical {
          background: #ff4d4f;
          color: white;
        }

        .alert-severity.warning {
          background: #faad14;
          color: white;
        }

        .alert-severity.info {
          background: #1890ff;
          color: white;
        }

        .system-health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }

        .health-item {
          background: ${theme.cardBg};
          padding: 16px;
          border-radius: 12px;
          border: 1px solid ${theme.border};
        }

        .health-item-label {
          font-size: 12px;
          color: ${theme.textTertiary};
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .health-item-value {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 8px;
        }

        .progress-bar {
          height: 6px;
          border-radius: 3px;
          background: #e0e0e0;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #999;
        }

        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
          color: #d0d0d0;
        }

        .empty-state-text {
          font-size: 16px;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 16px;
          }

          .health-score-main {
            flex-direction: column;
          }

          .health-metrics-grid {
            grid-template-columns: 1fr;
          }

          .dashboard-container {
            padding: 16px;
          }
        }
      `}</style>

      {/* Header */}
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <RobotOutlined style={{ marginRight: 12 }} />
          ML Monitoring Dashboard
        </h1>
        <div className="time-range-selector">
          {['24h', '7d', '30d', '90d'].map(range => (
            <button
              key={range}
              className={`time-btn ${selectedTimeRange === range ? 'active' : ''}`}
              onClick={() => setSelectedTimeRange(range)}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Health Score Showcase */}
      {healthScore && (
        <div className="health-showcase">
          <div className="health-score-main">
            <div className="health-score-circle">
              <div className="health-circle" style={{ background: getStatusColor(healthScore.status).bg }}>
                {healthScore.score}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>Overall Health</div>
                <Tag style={{ fontSize: 12, padding: '4px 12px' }}>
                  {getStatusIcon(healthScore.status)} {healthScore.status.toUpperCase()}
                </Tag>
              </div>
            </div>

            <div className="health-details">
              <div className="health-title">System Performance Metrics</div>
              <div className="health-metrics-grid">
                <div className="health-metric">
                  <div className="health-metric-label">Avg Confidence</div>
                  <div className="health-metric-value">
                    {healthScore.metrics?.avg_confidence ? (healthScore.metrics.avg_confidence * 100).toFixed(1) : 'N/A'}%
                  </div>
                </div>
                <div className="health-metric">
                  <div className="health-metric-label">Data Drift</div>
                  <div className="health-metric-value">
                    {healthScore.metrics?.drift_score?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="health-metric">
                  <div className="health-metric-label">Low Confidence</div>
                  <div className="health-metric-value">
                    {healthScore.metrics?.low_confidence_ratio ? (healthScore.metrics.low_confidence_ratio * 100).toFixed(1) : '0'}%
                  </div>
                </div>
              </div>

              {healthScore.issues && healthScore.issues.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: theme.text, marginBottom: 8 }}>Active Issues:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {healthScore.issues.map((issue, idx) => (
                      <Tag key={idx} color="red" style={{ marginBottom: 0 }}>
                        {issue}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Stats */}
      <div className="metrics-section">
        <div className="section-title">Real-Time Metrics</div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Model Accuracy"
              value={`${(metrics[metrics.length - 1]?.accuracy * 100).toFixed(2)}%`}
              subtitle="Latest measurement"
              icon={<EyeOutlined />}
              color="#667eea"
              trend={-0.5}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Data Drift Score"
              value={metrics[metrics.length - 1]?.drift?.toFixed(2)}
              subtitle="Below threshold"
              icon={<ThunderboltOutlined />}
              color="#f5576c"
              trend={12}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Active Alerts"
              value={alerts.length}
              subtitle={alerts.length === 0 ? 'All systems normal' : 'Attention needed'}
              icon={<AlertOutlined />}
              color={alerts.length > 0 ? '#faad14' : '#22C55E'}
              trend={alerts.length > 0 ? 15 : -20}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="API Latency"
              value={`${systemHealth?.apiResponseTime}ms`}
              subtitle="Response time"
              icon={<ClockCircleOutlined />}
              color="#52c41a"
              trend={8}
            />
          </Col>
        </Row>
      </div>

      {/* Advanced Charts */}
      <div className="metrics-section">
        <div className="section-title">Performance Analytics</div>
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <EyeOutlined style={{ marginRight: 8 }} />
                Model Performance Trends
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPrecision" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#764ba2" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#764ba2" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="date" stroke={theme.textTertiary} />
                  <YAxis stroke={theme.textTertiary} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="accuracy" stroke="#667eea" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="precision" stroke="#764ba2" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <DatabaseOutlined style={{ marginRight: 8 }} />
                Data Quality & Drift
              </div>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f5576c" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f5576c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="date" stroke={theme.textTertiary} />
                  <YAxis stroke={theme.textTertiary} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Area type="monotone" dataKey="drift" stroke="#f5576c" fillOpacity={0.6} fill="url(#colorDrift)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Additional Metrics Charts */}
      <div className="metrics-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <BgColorsOutlined style={{ marginRight: 8 }} />
                F1-Score & Recall Evolution
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="date" stroke={theme.textTertiary} />
                  <YAxis stroke={theme.textTertiary} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="f1" fill="#667eea" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="recall" fill="#764ba2" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <CopyOutlined style={{ marginRight: 8 }} />
                API Performance
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="date" stroke={theme.textTertiary} />
                  <YAxis stroke={theme.textTertiary} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="latency" stroke="#52c41a" strokeWidth={2} dot={false} name="Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>

      {/* System Health */}
      <div className="metrics-section">
        <div className="section-title">System Health</div>
        {systemHealth && (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <div className="health-item-label">CPU Usage</div>
                <div className="health-item-value">{systemHealth.cpuUsage}%</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${systemHealth.cpuUsage}%` }}></div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <div className="health-item-label">Memory Usage</div>
                <div className="health-item-value">{systemHealth.memoryUsage}%</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${systemHealth.memoryUsage}%` }}></div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <div className="health-item-label">DB Latency</div>
                <div className="health-item-value">{systemHealth.databaseLatency}ms</div>
                <div style={{ fontSize: 12, color: '#666' }}>Response time</div>
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="health-item">
                <div className="health-item-label">Uptime</div>
                <div className="health-item-value">{systemHealth.uptime}</div>
                <div style={{ fontSize: 12, color: '#666' }}>System availability</div>
              </div>
            </Col>
          </Row>
        )}
      </div>

      {/* Alerts Section */}
      <div className="metrics-section">
        <div className="section-title">
          <AlertOutlined style={{ marginRight: 8 }} />
          Alert Management
        </div>
        {alerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CheckCircleOutlined /></div>
            <div className="empty-state-text">All systems operating normally</div>
            <div style={{ fontSize: 12, marginTop: 8, color: '#aaa' }}>No active alerts at this time</div>
          </div>
        ) : (
          <div className="alerts-container">
            {alerts.map((alert, idx) => (
              <div key={idx} className={`alert-item ${alert.severity || 'info'}`}>
                <div className="alert-header">
                  <span className="alert-type">{alert.type?.toUpperCase()}</span>
                  <span className="alert-time">
                    <ClockCircleOutlined />
                    {new Date(alert.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="alert-message">{alert.message}</div>
                <span className={`alert-severity ${alert.severity || 'info'}`}>
                  {alert.severity || 'info'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prediction Statistics */}
      <div className="metrics-section">
        <div className="section-title">Prediction Statistics</div>
        <Row gutter={[16, 16]}>
          {predictions.map((pred, idx) => (
            <Col key={idx} xs={24} sm={12} md={8}>
              <Card className="chart-card">
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
                    {pred.category}
                  </div>
                  <Progress
                    type="circle"
                    percent={pred.percentage}
                    width={80}
                    format={percent => `${percent}%`}
                    strokeColor={{
                      '0%': '#667eea',
                      '100%': '#764ba2',
                    }}
                  />
                </div>
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: pred.color }}>
                    {pred.count.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>predictions</div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Feature Importance */}
      <div className="metrics-section">
        <div className="section-title">
          <BgColorsOutlined style={{ marginRight: 8 }} />
          Feature Importance
        </div>
        <Card className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={featureImportance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
              <XAxis type="number" stroke={theme.textTertiary} />
              <YAxis type="category" dataKey="feature" stroke={theme.textTertiary} width={150} />
              <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
              <Bar dataKey="importance" fill="#667eea" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Model Performance Classification Metrics */}
      <div className="metrics-section">
        <div className="section-title">
          <EyeOutlined style={{ marginRight: 8 }} />
          Classification Performance by Class
        </div>
        <Row gutter={[16, 16]}>
          {performanceByClass.map((cls, idx) => (
            <Col key={idx} xs={24} md={12}>
              <Card className="chart-card">
                <div style={{ marginBottom: 20, fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
                  {cls.class} ({cls.support} samples)
                </div>
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#667eea', marginBottom: 4 }}>
                        {(cls.precision * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Precision</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#764ba2', marginBottom: 4 }}>
                        {(cls.recall * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>Recall</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: '#52c41a', marginBottom: 4 }}>
                        {(cls.f1 * 100).toFixed(1)}%
                      </div>
                      <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>F1-Score</div>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Model Information & Data Quality */}
      <div className="metrics-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <RobotOutlined style={{ marginRight: 8 }} />
                Model Information
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666', fontWeight: 600 }}>Model Name:</span>
                  <span style={{ fontWeight: 700 }}>{modelMetrics?.modelName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666', fontWeight: 600 }}>Deployed:</span>
                  <span style={{ fontWeight: 700 }}>{modelMetrics?.deployedDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666', fontWeight: 600 }}>Last Retraining:</span>
                  <span style={{ fontWeight: 700 }}>{modelMetrics?.lastRetraining}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666', fontWeight: 600 }}>Next Retraining:</span>
                  <Tag color="blue">{modelMetrics?.nextRetrainingScheduled}</Tag>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px' }}>
                  <span style={{ color: '#666', fontWeight: 600 }}>Throughput:</span>
                  <span style={{ fontWeight: 700, color: '#52c41a' }}>{modelMetrics?.throughput}</span>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <DatabaseOutlined style={{ marginRight: 8 }} />
                Data Quality Metrics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#666' }}>Overall Quality Score</span>
                    <span style={{ fontWeight: 700, color: '#667eea' }}>{(modelMetrics?.dataQualityScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${modelMetrics?.dataQualityScore * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#666' }}>Completeness</span>
                    <span style={{ fontWeight: 700, color: '#764ba2' }}>{(modelMetrics?.completenessScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${modelMetrics?.completenessScore * 100}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, color: '#666' }}>Consistency</span>
                    <span style={{ fontWeight: 700, color: '#52c41a' }}>{(modelMetrics?.consistencyScore * 100).toFixed(1)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${modelMetrics?.consistencyScore * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Advanced Metrics - AUC and Training Loss */}
      <div className="metrics-section">
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <EyeOutlined style={{ marginRight: 8 }} />
                ROC AUC Score Trend
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="date" stroke={theme.textTertiary} />
                  <YAxis stroke={theme.textTertiary} domain={[0.93, 0.97]} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="auc" stroke="#52c41a" strokeWidth={3} dot={{ fill: '#52c41a', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card className="chart-card">
              <div className="chart-title">
                <ThunderboltOutlined style={{ marginRight: 8 }} />
                Training Loss Progression
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis dataKey="date" stroke={theme.textTertiary} />
                  <YAxis stroke={theme.textTertiary} />
                  <RechartsTooltip contentStyle={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.border}`, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="training_loss" stroke="#f5576c" strokeWidth={3} dot={{ fill: '#f5576c', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Predictions Confidence Distribution Pie Chart */}
      <div className="metrics-section">
        <div className="section-title">Confidence Distribution</div>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card className="chart-card">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={predictions}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="percentage"
                  >
                    {predictions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card className="chart-card">
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Prediction Breakdown</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {predictions.map((pred, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: idx < predictions.length - 1 ? '1px solid #e0e0e0' : 'none' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '3px', backgroundColor: pred.color }}></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{pred.category}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{pred.count.toLocaleString()} predictions</div>
                    </div>
                    <div style={{ fontWeight: 700, color: '#667eea' }}>{pred.percentage}%</div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Additional System Metrics */}
      <div className="metrics-section">
        <div className="section-title">Extended System Metrics</div>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Requests/Second"
              value={systemHealth?.requestsPerSecond?.toLocaleString()}
              subtitle="Throughput"
              icon={<ThunderboltOutlined />}
              color="#52c41a"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Data Processed"
              value={systemHealth?.dataProcessed}
              subtitle="Total volume"
              icon={<DatabaseOutlined />}
              color="#667eea"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Total Predictions"
              value={modelMetrics?.totalPredictions?.toLocaleString()}
              subtitle="All time"
              icon={<EyeOutlined />}
              color="#764ba2"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatCard
              title="Avg Inference"
              value={`${modelMetrics?.avgInferenceTime}ms`}
              subtitle="Response time"
              icon={<ClockCircleOutlined />}
              color="#f5576c"
            />
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Dashboard;