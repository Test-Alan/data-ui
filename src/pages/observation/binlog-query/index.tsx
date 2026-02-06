import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import { Card, Form, Button, Row, Col, Input, Select, Space, Typography, Tag, Tooltip, message, DatePicker, Modal } from 'antd';
import { SearchOutlined, DatabaseOutlined, TableOutlined, ClearOutlined, InfoCircleOutlined, CalendarOutlined, EyeOutlined } from '@ant-design/icons';
import { listTableBinlog } from '@/services/ext-sync/api';
import styles from './index.less';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;
const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const BinlogQueryPage: React.FC = () => {
  const [searchForm] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<API.TableBinlogResponseDTO[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [binlogDetailModalVisible, setBinlogDetailModalVisible] = useState<boolean>(false);
  const [currentBinlogContent, setCurrentBinlogContent] = useState<string>('');
  const [currentBinlogInfo, setCurrentBinlogInfo] = useState<API.TableBinlogResponseDTO | null>(null);
  const actionRef = useRef<ActionType>();

  // 获取默认时间范围：昨天00:00:00 到 当前时间
  const getDefaultTimeRange = () => {
    const yesterday = moment().subtract(1, 'days').startOf('day'); // 昨天00:00:00
    const now = moment(); // 当前时间
    return [yesterday, now];
  };

  // 时间戳格式化函数
  const formatTimestamp = (timestamp: number): string => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  };

  // 时间范围禁用规则
  const disabledDate = (current: moment.Moment) => {
    // 禁用15天前的日期和未来日期
    const fifteenDaysAgo = moment().subtract(15, 'days').startOf('day');
    const today = moment().endOf('day');
    return current && (current < fifteenDaysAgo || current > today);
  };

  // 显示binlog详情
  const showBinlogDetail = (record: API.TableBinlogResponseDTO) => {
    setCurrentBinlogContent(record.binlogContent);
    setCurrentBinlogInfo(record);
    setBinlogDetailModalVisible(true);
  };

  // 格式化JSON内容
  const formatJsonContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return content;
    }
  };

  // 执行搜索
  const handleSearch = async () => {
    try {
      const values = await searchForm.validateFields();
      setLoading(true);
      setHasSearched(true);
      
      // 处理时间范围（现在是必选的）
      const startTime = values.timeRange[0].format('YYYY-MM-DD HH:mm:ss');
      const endTime = values.timeRange[1].format('YYYY-MM-DD HH:mm:ss');
      
      const results = await listTableBinlog({
        schemaName: values.schemaName,
        tableName: values.tableName,
        queryFieldName: values.queryFieldName,
        queryFieldValue: values.queryFieldValue,
        binlogType: values.binlogType,
        startTime,
        endTime,
      });
      
      setSearchResults(results || []);
      message.success(`查询完成，共找到 ${results?.length || 0} 条记录`);
    } catch (error) {
      console.error('搜索失败:', error);
      message.error('搜索失败，请检查输入参数');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    // 重置时间范围为默认值
    searchForm.setFieldsValue({
      timeRange: getDefaultTimeRange(),
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  // 表格列定义
  const columns: ProColumns<API.TableBinlogResponseDTO>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      fixed: 'left',
      render: (text: any) => <Text strong style={{ color: '#1890ff' }}>{text}</Text>,
    },
    {
      title: '消息ID',
      dataIndex: 'msgId',
      width: 200,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '数据库',
      dataIndex: 'schemaName',
      width: 120,
      ellipsis: true,
      copyable: true,
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      width: 120,
      ellipsis: true,
      copyable: true,
    },
    {
      title: 'Binlog类型',
      dataIndex: 'binlogType',
      width: 100,
      render: (text: any) => {
        const colorMap: Record<string, string> = {
          INSERT: 'success',
          UPDATE: 'warning',
          DELETE: 'error',
        };
        return (
          <Tag color={colorMap[text as string] || 'default'}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: 'DDL状态',
      dataIndex: 'ddlStatus',
      width: 100,
      render: (text: any) => (
        <Tag color={text === 1 ? 'success' : 'default'}>
          {text === 1 ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: 'Topic',
      dataIndex: 'topic',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Binlog时间',
      dataIndex: 'binlogTs',
      width: 180,
      render: (text: any) => (
        <Text style={{ fontSize: '12px', color: '#666' }}>
          {formatTimestamp(text as number)}
        </Text>
      ),
      sorter: (a, b) => a.binlogTs - b.binlogTs,
    },
    {
      title: 'Binlog内容',
      dataIndex: 'binlogContent',
      width: 300,
      ellipsis: {
        showTitle: false,
      },
      render: (text: any, record: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tooltip title="点击查看完整内容" placement="topLeft">
            <Text 
              style={{ 
                fontSize: '12px',
                color: '#666',
                flex: 1,
                cursor: 'pointer',
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '200px',
              }}
              onClick={() => showBinlogDetail(record)}
            >
              {text as string}
            </Text>
          </Tooltip>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showBinlogDetail(record)}
            style={{ padding: 0, minWidth: 'auto', flexShrink: 0 }}
          >
            详情
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer
      title={
        <div className={styles.pageTitle}>
          <SearchOutlined className={styles.titleIcon} />
          Binlog精确查询
        </div>
      }
      content="根据指定字段和值精确查询表的binlog记录，支持按操作类型和时间范围过滤（时间范围限制在近15天内）"
    >
      <div className={styles.container}>
        {/* 搜索表单 */}
        <Card className={styles.searchCard} title="查询条件" size="small">
          <Form
            form={searchForm}
            layout="vertical"
            initialValues={{
              binlogType: undefined,
              timeRange: getDefaultTimeRange(), // 设置默认时间范围
            }}
          >
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  label="数据库名"
                  name="schemaName"
                  rules={[{ required: true, message: '请输入数据库名' }]}
                >
                  <Input 
                    placeholder="请输入数据库名" 
                    prefix={<DatabaseOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="表名"
                  name="tableName"
                  rules={[{ required: true, message: '请输入表名' }]}
                >
                  <Input 
                    placeholder="请输入表名" 
                    prefix={<TableOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="查询字段名"
                  name="queryFieldName"
                  rules={[{ required: false, message: '请输入查询字段名' }]}
                >
                  <Input placeholder="可选，用于精确匹配" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="查询字段值"
                  name="queryFieldValue"
                  rules={[{ required: false, message: '请输入查询字段值' }]}
                >
                  <Input placeholder="可选，配合字段名使用" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  label={
                    <span>
                      Binlog类型
                      <Tooltip title="可选择特定的binlog操作类型进行过滤">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                      </Tooltip>
                    </span>
                  }
                  name="binlogType"
                >
                  <Select placeholder="全部类型" allowClear>
                    <Option value="INSERT">INSERT</Option>
                    <Option value="UPDATE">UPDATE</Option>
                    <Option value="DELETE">DELETE</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label={
                    <span>
                      时间范围 <span style={{ color: '#ff4d4f' }}>*</span>
                      <Tooltip title="必须选择时间范围，限制在近15天内。默认为昨天00:00:00到当前时间">
                        <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
                      </Tooltip>
                    </span>
                  }
                  name="timeRange"
                  rules={[
                    { required: true, message: '请选择时间范围' },
                    {
                      validator: (_, value) => {
                        if (!value || value.length !== 2) {
                          return Promise.reject(new Error('请选择完整的时间范围'));
                        }
                        const [start, end] = value;
                        const fifteenDaysAgo = moment().subtract(15, 'days').startOf('day');
                        
                        if (start.isBefore(fifteenDaysAgo)) {
                          return Promise.reject(new Error('开始时间不能早于15天前'));
                        }
                        
                        if (end.isBefore(start)) {
                          return Promise.reject(new Error('结束时间不能早于开始时间'));
                        }
                        
                        if (end.isAfter(moment())) {
                          return Promise.reject(new Error('结束时间不能晚于当前时间'));
                        }
                        
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                  <RangePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    placeholder={['开始时间（必选）', '结束时间（必选）']}
                    style={{ width: '100%' }}
                    suffixIcon={<CalendarOutlined />}
                    disabledDate={disabledDate}
                    showNow={false}
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item label=" " style={{ marginBottom: 0 }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                      loading={loading}
                      size="large"
                    >
                      精确查询
                    </Button>
                    <Button 
                      icon={<ClearOutlined />} 
                      onClick={handleReset}
                      size="large"
                    >
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>

        {/* 结果表格 */}
        {hasSearched && (
          <Card 
            className={styles.resultCard} 
            title={
              <div className={styles.resultTitle}>
                <SearchOutlined />
                查询结果
                {searchResults.length > 0 && (
                  <Tag color="blue" style={{ marginLeft: 8 }}>
                    共 {searchResults.length} 条
                  </Tag>
                )}
              </div>
            }
          >
            <ProTable<API.TableBinlogResponseDTO>
              actionRef={actionRef}
              rowKey="id"
              dataSource={searchResults}
              columns={columns}
              search={false}
              toolBarRender={false}
              pagination={{
                pageSize: 10,
                showQuickJumper: true,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
              }}
              scroll={{ x: 1400 }}
              size="small"
              locale={{
                emptyText: searchResults.length === 0 ? '暂无查询结果' : '暂无数据',
              }}
              rowClassName={(record, index) => {
                return index % 2 === 0 ? styles.evenRow : styles.oddRow;
              }}
            />
          </Card>
        )}

        {/* Binlog详情弹窗 */}
        <Modal
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <EyeOutlined style={{ marginRight: 8 }} />
              Binlog详情
              {currentBinlogInfo && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  ID: {currentBinlogInfo.id}
                </Tag>
              )}
            </div>
          }
          open={binlogDetailModalVisible}
          onCancel={() => setBinlogDetailModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setBinlogDetailModalVisible(false)}>
              关闭
            </Button>,
            <Button 
              key="copy" 
              type="primary" 
              onClick={() => {
                navigator.clipboard.writeText(currentBinlogContent);
                message.success('已复制到剪贴板');
              }}
            >
              复制内容
            </Button>,
          ]}
          width={800}
          style={{ top: 20 }}
        >
          {currentBinlogInfo && (
            <div style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>数据库：</Text>
                  <Text copyable>{currentBinlogInfo.schemaName}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>表名：</Text>
                  <Text copyable>{currentBinlogInfo.tableName}</Text>
                </Col>
                <Col span={8}>
                  <Text strong>操作类型：</Text>
                  <Tag color={
                    currentBinlogInfo.binlogType === 'INSERT' ? 'success' :
                    currentBinlogInfo.binlogType === 'UPDATE' ? 'warning' : 'error'
                  }>
                    {currentBinlogInfo.binlogType}
                  </Tag>
                </Col>
              </Row>
              <Row style={{ marginTop: 8 }}>
                <Col span={12}>
                  <Text strong>Binlog时间：</Text>
                  <Text>{formatTimestamp(currentBinlogInfo.binlogTs)}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>消息ID：</Text>
                  <Text copyable style={{ fontSize: '12px' }}>{currentBinlogInfo.msgId}</Text>
                </Col>
              </Row>
            </div>
          )}
          <div style={{ marginBottom: 8 }}>
            <Text strong>Binlog内容：</Text>
          </div>
          <TextArea
            value={formatJsonContent(currentBinlogContent)}
            readOnly
            style={{ 
              height: 400, 
              fontFamily: 'Consolas, Monaco, monospace',
              fontSize: '12px',
            }}
          />
        </Modal>
      </div>
    </PageContainer>
  );
};

export default BinlogQueryPage; 