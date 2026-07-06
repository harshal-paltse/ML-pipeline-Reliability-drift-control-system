import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Alert, Spin, Typography, Space, Statistic, Upload, Table, Tabs, Row, Col, Progress, Tag, Divider, Select, message, Tooltip } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ThunderboltOutlined, UploadOutlined, FileOutlined, DownloadOutlined, RobotOutlined, DatabaseOutlined, ArrowRightOutlined, SafetyCertificateOutlined, RiseOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

const Prediction = () => {
  const { theme, isDark } = useTheme();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [uploadedModel, setUploadedModel] = useState(null);
  const [uploadedDataset, setUploadedDataset] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // Backend URL
  const BACKEND_URL = 'http://localhost:8000/api';

  // Manual Prediction
  const onFinish = async (values) => {
    if (!uploadedModel) {
      message.error('Please upload a model first!');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call backend endpoint
      const response = await axios.post(`${BACKEND_URL}/predictions/manual`, {
        model_id: uploadedModel.model_id,
        amount: values.amount,
        merchant_type: values.merchant_type,
        time_of_day: values.time_of_day,
        user_history: values.user_history
      });

      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to get prediction. Please try again.');
      console.error('Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Model Upload Handler
  const modelUploadProps = {
    name: 'model',
    multiple: false,
    accept: '.pkl,.h5,.joblib,.pth,.onnx',
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${BACKEND_URL}/uploads/model`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setUploadedModel(response.data);
        message.success(`Model ${file.name} uploaded successfully!`);
        onSuccess({ status: 'success' });
      } catch (error) {
        message.error(`Failed to upload model: ${error.response?.data?.detail || error.message}`);
        onError(error);
      }
    },
  };

  // Dataset Upload Handler
  const datasetUploadProps = {
    name: 'dataset',
    multiple: false,
    accept: '.csv,.xlsx,.json',
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${BACKEND_URL}/uploads/dataset`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setUploadedDataset(response.data);
        message.success(`Dataset ${file.name} processed successfully!`);
        onSuccess({ status: 'success' });
      } catch (error) {
        message.error(`Failed to upload dataset: ${error.response?.data?.detail || error.message}`);
        onError(error);
      }
    },
  };

  // Batch Prediction
  const handleBatchPrediction = async () => {
    if (!uploadedModel || !uploadedDataset) {
      message.error('Please upload both model and dataset!');
      return;
    }

    setBatchLoading(true);
    try {
      // Call backend batch prediction endpoint
      const response = await axios.post(`${BACKEND_URL}/predictions/batch`, {
        model_id: uploadedModel.model_id,
        dataset_id: uploadedDataset.dataset_id
      });

      setPredictions(response.data.predictions);
      message.success('Batch predictions completed successfully!');
    } catch (error) {
      message.error(`Batch prediction failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  // Download Results
  const handleDownloadResults = () => {
    const csv = [
      ['Transaction ID', 'Amount', 'Prediction', 'Confidence', 'Risk Score'],
      ...predictions.map(p => [p.transaction_id, p.amount, p.prediction, p.confidence, p.risk_score])
    ].map(row => row.join(',')).join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'predictions.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    message.success('Results downloaded!');
  };

  const predictionColumns = [
    { title: 'Transaction ID', dataIndex: 'transaction_id', key: 'transaction_id', width: 120 },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 100, render: (text) => `$${text}` },
    { title: 'Category', dataIndex: 'merchant_category', key: 'merchant_category', width: 130 },
    { title: 'Time', dataIndex: 'time_of_day', key: 'time_of_day', width: 100 },
    {
      title: 'Prediction',
      dataIndex: 'prediction',
      key: 'prediction',
      width: 110,
      render: (text) => (
        <Tag color={text === 'Legitimate' ? 'green' : 'red'}>{text}</Tag>
      )
    },
    {
      title: 'Confidence',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 110,
      render: (text) => <Tag color="blue">{(text * 100).toFixed(1)}%</Tag>
    },
    {
      title: 'Risk Score',
      dataIndex: 'risk_score',
      key: 'risk_score',
      width: 100,
      render: (text) => (
        <span style={{ color: text > 50 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          {text}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (text) => (
        <Tag color={text === 'Low Risk' ? 'green' : 'red'}>{text}</Tag>
      )
    },
  ];

  const tabItems = [
    {
      key: 'manual',
      label: '⚡ Manual Prediction',
      children: (
        <div style={{ padding: '32px 0' }}>
          {uploadedModel ? (
            <Alert
              message="✓ Model Ready"
              description={`${uploadedModel.name} loaded with ${uploadedModel.accuracy} accuracy`}
              type="success"
              showIcon
              style={{ marginBottom: 36, borderRadius: 14, border: 'none', background: 'rgba(6, 199, 85, 0.1)', color: theme.success, fontSize: 14, fontWeight: 500 }}
              icon={<CheckCircleOutlined style={{ fontSize: 18 }} />}
            />
          ) : (
            <Alert
              message="⚠ No Model Loaded"
              description="Upload a trained ML model to start making predictions"
              type="warning"
              showIcon
              style={{ marginBottom: 36, borderRadius: 14, border: 'none', background: 'rgba(255, 149, 0, 0.1)', fontSize: 14, fontWeight: 500 }}
            />
          )}

          <Row gutter={40}>
            {/* LEFT SECTION - INPUT FORM */}
            <Col xs={24} lg={13}>
              <Card className="premium-card" style={{ borderRadius: 20, padding: 32, height: '100%' }}>
                <div className="section-header" style={{ marginTop: -10, marginLeft: -32, marginRight: -32, marginTop: -32, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: theme.gradient1,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DatabaseOutlined style={{ fontSize: 20, color: 'white' }} />
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0, color: theme.text, fontWeight: 800, fontSize: 18 }}>
                        Transaction Input
                      </Title>
                      <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: 500 }}>Enter transaction details for analysis</Text>
                    </div>
                  </div>
                </div>

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{
                    amount: 250,
                    merchant_type: 'E-commerce',
                    time_of_day: 'Evening',
                    user_history: 45
                  }}
                >
                  <div style={{ marginBottom: 24 }}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>💰 Transaction Amount ($)</span>}
                      name="amount"
                      rules={[{ required: true, message: 'Enter transaction amount' }]}
                    >
                      <InputNumber 
                        min={0} 
                        max={10000} 
                        style={{ width: '100%', fontSize: 15 }}
                        className="premium-input"
                        formatter={(value) => `$${value}`}
                        parser={(value) => value.replace('$', '')}
                        placeholder="0"
                      />
                    </Form.Item>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>🏪 Merchant Category</span>}
                      name="merchant_type"
                      rules={[{ required: true, message: 'Select merchant category' }]}
                    >
                      <Select 
                        className="premium-input"
                        style={{ borderRadius: 10 }}
                        placeholder="Choose category"
                        options={[
                          { label: 'E-commerce', value: 'E-commerce' },
                          { label: 'Gas Station', value: 'Gas Station' },
                          { label: 'Restaurant', value: 'Restaurant' },
                          { label: 'Grocery', value: 'Grocery' }
                        ]} 
                      />
                    </Form.Item>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>⏰ Time of Day</span>}
                      name="time_of_day"
                      rules={[{ required: true, message: 'Select time' }]}
                    >
                      <Select 
                        className="premium-input"
                        placeholder="Choose time"
                        options={[
                          { label: '🌅 Morning', value: 'Morning' },
                          { label: '☀️ Afternoon', value: 'Afternoon' },
                          { label: '🌆 Evening', value: 'Evening' },
                          { label: '🌙 Night', value: 'Night' }
                        ]} 
                      />
                    </Form.Item>
                  </div>

                  <div style={{ marginBottom: 32 }}>
                    <Form.Item
                      label={<span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>📊 Customer History (Days)</span>}
                      name="user_history"
                      rules={[{ required: true, message: 'Enter customer history' }]}
                    >
                      <InputNumber 
                        min={0} 
                        max={365} 
                        style={{ width: '100%', fontSize: 15 }}
                        className="premium-input"
                        placeholder="0"
                      />
                    </Form.Item>
                  </div>

                  <div className="section-divider" />

                  <Form.Item style={{ marginTop: 32, marginBottom: 0 }}>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      loading={loading} 
                      size="large" 
                      block
                      className="premium-btn"
                      style={{
                        background: theme.gradient1,
                        border: 'none'
                      }}
                    >
                      <ThunderboltOutlined style={{ marginRight: 8 }} /> Analyze Transaction
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            {/* RIGHT SECTION - RESULTS */}
            <Col xs={24} lg={11}>
              {error && (
                <Alert
                  message="❌ Prediction Error"
                  description={error}
                  type="error"
                  showIcon
                  style={{ marginBottom: 24, borderRadius: 14, border: 'none', background: 'rgba(255, 59, 48, 0.1)' }}
                  icon={<CloseCircleOutlined style={{ fontSize: 18 }} />}
                />
              )}

              {result && (
                <Spin spinning={loading}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Main Prediction Card */}
                    <Card className="premium-card" style={{
                      borderRadius: 20,
                      padding: 0,
                      overflow: 'hidden',
                      border: 'none'
                    }}>
                      <div className={`result-card ${result.prediction === 'Approved' ? 'success' : 'error'}`}>
                        <div style={{ marginBottom: 20 }}>
                          {result.prediction === 'Approved' 
                            ? <CheckCircleOutlined style={{ fontSize: 64, color: theme.success }} />
                            : <CloseCircleOutlined style={{ fontSize: 64, color: theme.error }} />
                          }
                        </div>
                        <Title level={1} style={{
                          margin: '16px 0',
                          color: result.prediction === 'Approved' ? theme.success : theme.error,
                          fontWeight: 900,
                          fontSize: 44
                        }}>
                          {result.prediction}
                        </Title>
                        <Text style={{ fontSize: 16, color: theme.textSecondary, fontWeight: 500 }}>
                          {result.confidence}% Confidence
                        </Text>
                      </div>
                    </Card>

                    {/* Probability Section */}
                    <Card className="premium-card" style={{ borderRadius: 20, padding: 24 }}>
                      <Title level={5} style={{ margin: '0 0 20px 0', color: theme.text, fontWeight: 800 }}>
                        📈 Probability Analysis
                      </Title>
                      <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>✅ Legitimate</span>
                            <Tag color="green" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>{(parseFloat(result.probability.approved) * 100).toFixed(1)}%</Tag>
                          </div>
                          <Progress 
                            percent={parseFloat(result.probability.approved) * 100} 
                            strokeColor={{ '0%': theme.success, '100%': theme.success }}
                            strokeWidth={8}
                            style={{ borderRadius: 4 }}
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                            <span style={{ fontWeight: 700, color: theme.text, fontSize: 14 }}>⚠️ Fraudulent</span>
                            <Tag color="red" style={{ borderRadius: 6, fontWeight: 600, fontSize: 12 }}>{(parseFloat(result.probability.rejected) * 100).toFixed(1)}%</Tag>
                          </div>
                          <Progress 
                            percent={parseFloat(result.probability.rejected) * 100} 
                            strokeColor={{ '0%': theme.error, '100%': theme.error }}
                            strokeWidth={8}
                          />
                        </div>
                      </Space>
                    </Card>

                    {/* Stats Section */}
                    <Row gutter={16}>
                      <Col span={12}>
                        <div className="stat-box">
                          <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Risk Score</Text>
                          <Title level={2} style={{ margin: 0, color: theme.primary, fontWeight: 900, fontSize: 32 }}>
                            {result.risk_score}<span style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)' }}>/100</span>
                          </Title>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="stat-box">
                          <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Recommendation</Text>
                          <Title level={2} style={{ margin: 0, color: theme.secondary, fontWeight: 900, fontSize: 32 }}>
                            {result.recommendation}
                          </Title>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Spin>
              )}
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'batch',
      label: '📊 Batch Prediction',
      children: (
        <div style={{ padding: '32px 0' }}>
          {/* UPLOAD SECTION */}
          <Row gutter={40} style={{ marginBottom: 40 }}>
            <Col xs={24} lg={12}>
              <Card className="premium-card" style={{ borderRadius: 20, padding: 32, height: '100%' }}>
                <div className="section-header" style={{ marginTop: -10, marginLeft: -32, marginRight: -32, marginTop: -32, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: theme.gradient1,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <RobotOutlined style={{ fontSize: 20, color: 'white' }} />
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0, color: theme.text, fontWeight: 800, fontSize: 18 }}>
                        AI Model Selection
                      </Title>
                      <Text style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, fontWeight: 500 }}>Choose your trained ML model</Text>
                    </div>
                  </div>
                </div>

                <Dragger 
                  {...modelUploadProps} 
                  className="premium-dragger"
                  style={{ marginBottom: 20, borderRadius: 16 }}
                >
                  <UploadOutlined style={{ fontSize: 44, color: theme.primary, marginBottom: 16 }} />
                  <p style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700, color: theme.text }}>
                    Drop model file here
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                    or click to browse
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 12, color: 'rgba(0,0,0,0.35)', fontWeight: 500 }}>
                    Supported: .pkl, .h5, .joblib, .pth, .onnx
                  </p>
                </Dragger>

                {uploadedModel && (
                  <Card style={{
                    background: `linear-gradient(135deg, ${theme.primary}10, ${theme.primary}05)`,
                    border: `2px solid ${theme.primary}30`,
                    borderRadius: 14,
                    padding: 18
                  }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: theme.text, fontSize: 15, fontWeight: 700 }}>
                          <FileOutlined style={{ marginRight: 10, color: theme.primary, fontSize: 16 }} />
                          {uploadedModel.name}
                        </Text>
                        <Tag color="blue" style={{ borderRadius: 8, fontWeight: 700, fontSize: 12 }}>✓ Ready</Tag>
                      </div>
                      <div className="section-divider" style={{ margin: '10px 0' }} />
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ background: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 8 }}>
                            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 500, display: 'block' }}>Size</Text>
                            <Text strong style={{ color: theme.text, fontSize: 13 }}>{uploadedModel.size} MB</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ background: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 8 }}>
                            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 500, display: 'block' }}>Accuracy</Text>
                            <Text strong style={{ color: theme.primary, fontSize: 13 }}>{uploadedModel.accuracy}</Text>
                          </div>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                )}
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className="premium-card" style={{ borderRadius: 20, padding: 32, height: '100%' }}>
                <div className="section-header" style={{ marginTop: -10, marginLeft: -32, marginRight: -32, marginTop: -32, marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      background: theme.gradient2,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <DatabaseOutlined style={{ fontSize: 20, color: 'white' }} />
                    </div>
                    <div>
                      <Title level={4} style={{ margin: 0, color: theme.text, fontWeight: 800, fontSize: 18 }}>
                        Data Upload
                      </Title>
                      <Text style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, fontWeight: 500 }}>Load your prediction dataset</Text>
                    </div>
                  </div>
                </div>

                <Dragger 
                  {...datasetUploadProps}
                  className="premium-dragger"
                  style={{ marginBottom: 20, borderRadius: 16 }}
                >
                  <UploadOutlined style={{ fontSize: 44, color: theme.secondary, marginBottom: 16 }} />
                  <p style={{ margin: '0 0 4px 0', fontSize: 15, fontWeight: 700, color: theme.text }}>
                    Drop dataset here
                  </p>
                  <p style={{ margin: '0 0 4px 0', fontSize: 13, color: 'rgba(0,0,0,0.45)' }}>
                    or click to browse
                  </p>
                  <p style={{ margin: '8px 0 0 0', fontSize: 12, color: 'rgba(0,0,0,0.35)', fontWeight: 500 }}>
                    Supported: .csv, .xlsx, .json
                  </p>
                </Dragger>

                {uploadedDataset && (
                  <Card style={{
                    background: `linear-gradient(135deg, ${theme.secondary}10, ${theme.secondary}05)`,
                    border: `2px solid ${theme.secondary}30`,
                    borderRadius: 14,
                    padding: 18
                  }}>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text strong style={{ color: theme.text, fontSize: 15, fontWeight: 700 }}>
                          <FileOutlined style={{ marginRight: 10, color: theme.secondary, fontSize: 16 }} />
                          {uploadedDataset.name}
                        </Text>
                        <Tag color="purple" style={{ borderRadius: 8, fontWeight: 700, fontSize: 12 }}>✓ Ready</Tag>
                      </div>
                      <div className="section-divider" style={{ margin: '10px 0' }} />
                      <Row gutter={16}>
                        <Col span={12}>
                          <div style={{ background: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 8 }}>
                            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 500, display: 'block' }}>Records</Text>
                            <Text strong style={{ color: theme.text, fontSize: 13 }}>{uploadedDataset.rows?.toLocaleString()}</Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div style={{ background: 'rgba(255,255,255,0.6)', padding: 10, borderRadius: 8 }}>
                            <Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.6)', fontWeight: 500, display: 'block' }}>Status</Text>
                            <Text strong style={{ color: theme.secondary, fontSize: 13 }}>{uploadedDataset.status}</Text>
                          </div>
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                )}
              </Card>
            </Col>
          </Row>

          {/* ACTION SECTION */}
          {uploadedDataset && uploadedModel && (
            <Card className="premium-card" style={{
              marginBottom: 40,
              borderRadius: 16,
              padding: 24,
              background: `linear-gradient(135deg, #fffbe6, #fff7e6)`,
              border: `2px solid #ffc53d`,
              boxShadow: '0 8px 24px rgba(255, 197, 61, 0.2)'
            }}>
              <Row gutter={24} align="middle">
                <Col flex="auto">
                  <Space>
                    <ThunderboltOutlined style={{ fontSize: 24, color: '#ff9500' }} />
                    <div>
                      <Text style={{ fontSize: 16, fontWeight: 700, color: theme.text, display: 'block' }}>
                        Ready to Process
                      </Text>
                      <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)' }}>
                        <strong style={{ color: theme.primary }}>{uploadedDataset.rows?.toLocaleString()}</strong> records will be analyzed
                      </Text>
                    </div>
                  </Space>
                </Col>
                <Col>
                  <Button 
                    type="primary" 
                    size="large" 
                    loading={batchLoading} 
                    onClick={handleBatchPrediction}
                    className="premium-btn"
                    style={{
                      background: theme.gradient2,
                      border: 'none',
                      height: 48,
                      fontSize: 15,
                      fontWeight: 700
                    }}
                  >
                    <ThunderboltOutlined /> Run Predictions
                  </Button>
                </Col>
              </Row>
            </Card>
          )}

          {/* RESULTS SECTION */}
          {predictions.length > 0 && (
            <Card className="premium-card" style={{ borderRadius: 20, padding: 32, overflow: 'hidden' }}>
              <div className="section-header" style={{ marginTop: -10, marginLeft: -32, marginRight: -32, marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    background: theme.gradient3,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircleOutlined style={{ fontSize: 20, color: 'white' }} />
                  </div>
                  <div>
                    <Title level={4} style={{ margin: 0, color: theme.text, fontWeight: 800, fontSize: 18 }}>
                      Prediction Results
                    </Title>
                    <Text style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, fontWeight: 500 }}>Summary and detailed analysis</Text>
                  </div>
                </div>
              </div>

              <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} md={6}>
                  <div className="stat-box">
                    <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Total Predictions</Text>
                    <Title level={2} style={{ margin: 0, color: theme.primary, fontWeight: 900, fontSize: 32 }}>
                      {predictions.length}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="stat-box">
                    <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Legitimate</Text>
                    <Title level={2} style={{ margin: 0, color: theme.success, fontWeight: 900, fontSize: 32 }}>
                      {predictions.filter(p => p.prediction === 'Legitimate').length}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="stat-box">
                    <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Fraudulent</Text>
                    <Title level={2} style={{ margin: 0, color: theme.error, fontWeight: 900, fontSize: 32 }}>
                      {predictions.filter(p => p.prediction === 'Fraudulent').length}
                    </Title>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div className="stat-box">
                    <Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Avg Confidence</Text>
                    <Title level={2} style={{ margin: 0, color: theme.secondary, fontWeight: 900, fontSize: 32 }}>
                      {(predictions.reduce((sum, p) => sum + parseFloat(p.confidence), 0) / predictions.length * 100).toFixed(0)}%
                    </Title>
                  </div>
                </Col>
              </Row>

              <div className="section-divider" />

              <div style={{ overflowX: 'auto', marginBottom: 28, marginTop: 28 }}>
                <Table
                  dataSource={predictions}
                  columns={predictionColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10, position: ['bottomCenter'], style: { marginTop: 20 } }}
                  scroll={{ x: 1200 }}
                  style={{
                    background: 'rgba(255,255,255,0.5)',
                    borderRadius: 12,
                    overflow: 'hidden'
                  }}
                  rowClassName={(record, index) => index % 2 === 0 ? 'even-row' : 'odd-row'}
                />
              </div>

              <Button 
                type="primary" 
                icon={<DownloadOutlined />} 
                onClick={handleDownloadResults}
                className="premium-btn"
                size="large"
                style={{
                  background: theme.gradient3,
                  border: 'none',
                  width: '100%',
                  height: 48,
                  fontSize: 15,
                  fontWeight: 700
                }}
              >
                ⬇️ Download Results as CSV
              </Button>
            </Card>
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{
      background: isDark ? 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' : theme.bg,
      minHeight: '100vh',
      padding: '48px 24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 6s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        left: '-5%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 8s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(30px); }
        }
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
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.3), 0 0 40px rgba(102, 126, 234, 0.1); }
          50% { box-shadow: 0 0 30px rgba(102, 126, 234, 0.5), 0 0 60px rgba(102, 126, 234, 0.2); }
        }
        .premium-card {
          background: rgba(255, 255, 255, 0.95) !important;
          backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 20px !important;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .premium-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15) !important;
        }
        .section-divider {
          height: 3px;
          background: linear-gradient(90deg, ${theme.primary}, ${theme.secondary}, transparent);
          border-radius: 2px;
          margin: 20px 0;
        }
        .premium-btn {
          background: ${theme.gradient1};
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          letter-spacing: 0.5px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          height: 44px;
        }
        .premium-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6) !important;
        }
        .premium-input input, .premium-input .ant-select-selector {
          border-radius: 10px !important;
          border: 2px solid rgba(102, 126, 234, 0.15) !important;
          background: rgba(255, 255, 255, 0.9) !important;
          transition: all 0.3s;
          font-size: 14px;
          font-weight: 500;
        }
        .premium-input input:focus, .premium-input .ant-select-selector:focus,
        .premium-input input:hover, .premium-input .ant-select-selector:hover {
          border-color: ${theme.primary} !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15) !important;
          background: rgba(255, 255, 255, 1) !important;
        }
        .premium-input .ant-select-focused .ant-select-selector {
          border-color: ${theme.primary} !important;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15) !important;
        }
        .header-section {
          animation: slideInDown 0.6s ease-out;
        }
        .premium-tab .ant-tabs-tab {
          border-radius: 14px !important;
          margin: 0 8px;
          transition: all 0.3s;
          font-weight: 600;
          font-size: 16px;
        }
        .premium-tab .ant-tabs-tab-active {
          background: ${theme.gradient1};
          color: white !important;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        .premium-dragger {
          background: rgba(255, 255, 255, 0.95) !important;
          border: 2.5px dashed ${theme.primary} !important;
          border-radius: 16px !important;
          transition: all 0.3s;
          padding: 48px 24px !important;
        }
        .premium-dragger:hover {
          border-color: ${theme.secondary} !important;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.02), rgba(118, 75, 162, 0.02)) !important;
          transform: scale(1.01);
        }
        .stat-box {
          background: linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85));
          backdrop-filter: blur(10px);
          border-radius: 14px;
          padding: 22px;
          border: 1.5px solid rgba(102, 126, 234, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }
        .stat-box:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: rgba(102, 126, 234, 0.2);
        }
        .result-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.05));
          border: 2px solid ${theme.primary};
          border-radius: 18px;
          padding: 36px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(102, 126, 234, 0.15);
        }
        .result-card.success {
          background: linear-gradient(135deg, rgba(6, 199, 85, 0.08), rgba(6, 199, 85, 0.03));
          border-color: ${theme.success};
        }
        .result-card.error {
          background: linear-gradient(135deg, rgba(255, 59, 48, 0.08), rgba(255, 59, 48, 0.03));
          border-color: ${theme.error};
        }
        .section-header {
          background: linear-gradient(135deg, ${theme.primary}15, ${theme.secondary}10);
          padding: 16px 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          border-left: 4px solid ${theme.primary};
        }
      `}</style>

      <div style={{ maxWidth: 1500, margin: '0 auto', position: 'relative', zIndex: 10 }}>
        {/* Hero Header */}
        <div style={{ marginBottom: 60, textAlign: 'center' }} className="header-section">
          <div style={{ marginBottom: 16 }}>
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
              <RobotOutlined style={{ fontSize: 44, color: 'white' }} />
            </div>
          </div>
          <Title level={1} style={{
            background: theme.gradient1,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0 0 12px 0',
            fontSize: 48,
            fontWeight: 900,
            letterSpacing: '-1px'
          }}>
            Prediction Intelligence
          </Title>
          <Paragraph style={{
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: 18,
            margin: 0,
            fontWeight: 300,
            letterSpacing: '0.3px'
          }}>
            Enterprise-grade ML predictions with real-time inference
          </Paragraph>
        </div>

        {/* Main Tabs */}
        <Card className="premium-card" style={{ 
          borderRadius: 24,
          overflow: 'hidden',
          marginBottom: 0
        }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabItems}
            className="premium-tab"
            size="large"
            style={{ marginTop: -14 }}
          />
        </Card>
      </div>
    </div>
  );
};

export default Prediction;
