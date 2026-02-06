import React, { useState, useEffect } from 'react';
import { Button, Modal, message, Tabs, Table, Card, Input, Alert } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined, BarChartOutlined, DatabaseOutlined, TableOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getSyncTablesPaging } from '@/services/ext-sync/api';
import { queryUpdateDistribution, getBinlogCountLastOneMinute } from '@/services/hermes-data-insight/api';
import * as echarts from 'echarts';

const { TabPane } = Tabs;



const Reader: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [distributionData, setDistributionData] = useState<API.BinlogHourStatResponseDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<API.SyncTableResponseDTO | null>(null);

  // 数据窥探相关状态
  const [dataSpyModalVisible, setDataSpyModalVisible] = useState<boolean>(false);
  const [dataSpyLoading, setDataSpyLoading] = useState<boolean>(false);
  const [dataSpyData, setDataSpyData] = useState<API.BinlogCountLastOneMinuteDTO[]>([]);
  const [currentSpyRecord, setCurrentSpyRecord] = useState<API.SyncTableResponseDTO | null>(null);
  const [continueSpyLoading, setContinueSpyLoading] = useState<boolean>(false);
  
  // 搜索过滤状态
  const [searchFilters, setSearchFilters] = useState({
    datasourceName: '',
    schemaName: '',
    tableName: '',
  });
  const [tableData, setTableData] = useState<API.SyncTableResponseDTO[]>([]);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 处理搜索
  const handleSearch = async () => {
    setTableLoading(true);
    try {
      const response = await getSyncTablesPaging({
        current: 1,
        pageSize: pagination.pageSize,
        ...searchFilters,
      });
      setTableData(response.data || []);
      setPagination({
        ...pagination,
        current: 1,
        total: response.total || 0,
      });
    } catch (error) {
      message.error('搜索失败');
    } finally {
      setTableLoading(false);
    }
  };

  // 处理重置
  const handleReset = () => {
    setSearchFilters({
      datasourceName: '',
      schemaName: '',
      tableName: '',
    });
    setPagination({
      current: 1,
      pageSize: 10,
      total: 0,
    });
    handleSearch();
  };

  // 处理分页变化
  const handleTableChange = async (page: number, pageSize?: number) => {
    setTableLoading(true);
    try {
      const response = await getSyncTablesPaging({
        current: page,
        pageSize: pageSize || pagination.pageSize,
        ...searchFilters,
      });
      setTableData(response.data || []);
      setPagination({
        current: page,
        pageSize: pageSize || pagination.pageSize,
        total: response.total || 0,
      });
    } catch (error) {
      message.error('分页查询失败');
    } finally {
      setTableLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    handleSearch();
  }, []);

  // 处理查看更新分布
  const handleViewDistribution = async (record: API.SyncTableResponseDTO) => {
    setLoading(true);
    setCurrentRecord(record);
    try {
      const data = await queryUpdateDistribution({
        schemaName: record.schemaName,
        tableName: record.tableName,
      });
      setDistributionData(data);
      setModalVisible(true);
    } catch (error) {
      message.error('获取更新分布数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理数据窥探
  const handleDataSpy = async (record: API.SyncTableResponseDTO) => {
    setDataSpyLoading(true);
    setCurrentSpyRecord(record);
    try {
      const data = await getBinlogCountLastOneMinute({
        id: record.id,
      });
      setDataSpyData(data ? [data] : []);
      setDataSpyModalVisible(true);
    } catch (error) {
      message.error('获取数据窥探信息失败');
    } finally {
      setDataSpyLoading(false);
    }
  };

  // 处理继续窥探
  const handleContinueSpy = async (id: number, startTime: number) => {
    setContinueSpyLoading(true);
    try {
      const data = await getBinlogCountLastOneMinute({
        id: id,
        binlogLastTime: startTime,
      });
      
      if (data) {
        // 将新数据添加到现有数据数组中
        setDataSpyData(prevData => [...prevData, data]);
        
        if (data.binlogCount && data.binlogCount > 0) {
          message.success('继续窥探成功，已添加新数据');
        } else {
          message.info('没有更多数据（binlog数量为0）');
        }
      } else {
        message.info('没有更多数据');
      }
    } catch (error) {
      message.error('继续窥探失败');
    } finally {
      setContinueSpyLoading(false);
    }
  };

  // 检查数据是否有效（binlogCount > 0）
  const hasValidData = (data: API.BinlogCountLastOneMinuteDTO[]) => {
    return data.some(item => item.binlogCount && item.binlogCount > 0);
  };

  // 过滤出有效数据（binlogCount > 0）
  const getValidData = (data: API.BinlogCountLastOneMinuteDTO[]) => {
    return data.filter(item => item.binlogCount && item.binlogCount > 0);
  };

  // 时间格式化函数
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // 根据日期渲染图表
  const renderChart = (updateDate: string) => {
    const dateData = distributionData.filter(item => item.updateDate === updateDate);
    if (dateData.length === 0) {
      return <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>暂无数据</div>;
    }

    // 准备图表数据 - 按小时点排序
    const sortedData = dateData.sort((a, b) => a.hourPoint - b.hourPoint);
    const xData = sortedData.map(item => `${item.hourPoint}:00`);
    const yData = sortedData.map(item => item.binlogCount);

    const option = {
      title: {
        text: `${updateDate} 数据更新分布`,
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: '#2c3e50'
        },
        padding: [20, 0, 30, 0]
      },
      backgroundColor: '#fafafa',
      grid: {
        left: '10%',
        right: '10%',
        top: '20%',
        bottom: '15%',
        containLabel: true
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        borderColor: '#1890ff',
        borderWidth: 1,
        textStyle: {
          color: '#fff',
          fontSize: 14
        },
        axisPointer: {
          type: 'cross',
          crossStyle: {
            color: '#1890ff'
          },
          lineStyle: {
            color: 'rgba(24, 144, 255, 0.8)',
            width: 1,
            type: 'dashed'
          }
        },
        formatter: function (params: any) {
          const dataPoint = params[0];
          const value = Number(dataPoint.value).toLocaleString();
          return `<div style="padding: 8px;">
            <div style="margin-bottom: 4px; font-weight: bold;">📊 ${dataPoint.name}</div>
            <div style="color: #1890ff;">📈 更新数量: ${value}</div>
          </div>`;
        }
      },
      xAxis: {
        type: 'category',
        data: xData,
        name: '小时',
        nameTextStyle: {
          fontSize: 14,
          color: '#666',
          padding: [10, 0, 0, 0]
        },
        axisLine: {
          lineStyle: {
            color: '#e1e1e1',
            width: 2
          }
        },
        axisTick: {
          alignWithLabel: true,
          lineStyle: {
            color: '#e1e1e1'
          }
        },
        axisLabel: {
          interval: 0,
          rotate: 45,
          fontSize: 12,
          color: '#666',
          margin: 15
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '更新数量',
        nameTextStyle: {
          fontSize: 14,
          color: '#666',
          padding: [0, 0, 0, 10]
        },
        axisLine: {
          lineStyle: {
            color: '#e1e1e1',
            width: 2
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          fontSize: 12,
          color: '#666',
          formatter: function (value: number) {
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + 'K';
            }
            return value.toString();
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
            type: 'dashed'
          }
        }
      },
      series: [{
        name: '更新数量',
        type: 'line',
        data: yData,
        smooth: true,
        smoothMonotone: 'x',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 0.5, color: '#36cfc9' },
              { offset: 1, color: '#52c41a' }
            ]
          }
        },
        itemStyle: {
                  color: '#1890ff',
          borderColor: '#fff',
          borderWidth: 2,
          shadowColor: 'rgba(24, 144, 255, 0.3)',
          shadowBlur: 5
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.25)' },
              { offset: 0.5, color: 'rgba(54, 207, 201, 0.15)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
            ]
          }
        },
        markPoint: {
          data: [
            { 
              type: 'max', 
              name: '最大值',
              itemStyle: {
                color: '#ff4d4f'
              },
              label: {
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold'
              }
            },
            { 
              type: 'min', 
              name: '最小值',
              itemStyle: {
                color: '#52c41a'
              },
              label: {
                color: '#fff',
                fontSize: 12,
                fontWeight: 'bold'
              }
            }
          ],
          symbolSize: 60,
          animation: true,
          animationDuration: 1000
        },
        markLine: {
          silent: true,
          lineStyle: {
            color: '#faad14',
            type: 'dashed',
            width: 2
          },
          data: [{
            type: 'average',
            name: '平均值',
            label: {
              formatter: '平均值: {c}',
              position: 'end',
              color: '#faad14',
              fontWeight: 'bold'
            }
          }]
        },
        emphasis: {
          itemStyle: {
            color: '#ff7a45',
            borderColor: '#fff',
            borderWidth: 3,
            shadowColor: 'rgba(255, 122, 69, 0.5)',
            shadowBlur: 10
          }
        }
      }],
      animation: true,
      animationDuration: 1500,
      animationEasing: 'cubicOut' as any
    };

    // 使用 useEffect 来确保 DOM 渲染后再初始化图表
        return (
      <div 
        id={`chart-${updateDate}`} 
        style={{ height: 400, width: '100%' }}
        ref={(el) => {
          if (el && yData.length > 0) {
            setTimeout(() => {
              const chart = echarts.init(el);
              chart.setOption(option);
              
              // 监听窗口大小变化
              const handleResize = () => chart.resize();
              window.addEventListener('resize', handleResize);
              
              // 清理函数
              return () => {
                window.removeEventListener('resize', handleResize);
                chart.dispose();
              };
            }, 100);
              }
            }}
          />
        );
  };



  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#fff', 
        borderBottom: '1px solid #e2e8f0',
        marginBottom: '16px'
      }}>
        <div style={{ 
          width: '100%', 
          padding: '0 16px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            height: '64px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DatabaseOutlined style={{ fontSize: '24px', color: '#2563eb' }} />
                <h1 style={{ 
                  fontSize: '20px', 
                  fontWeight: '600', 
                  color: '#1e293b',
                  margin: 0
                }}>
                  活跃度分析
                </h1>
        </div>
              <nav style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '14px', 
                color: '#64748b'
              }}>
                <span>数据洞察</span>
                <span>/</span>
                <span style={{ color: '#1e293b' }}>活跃度分析</span>
              </nav>
            </div>
          </div>
        </div>
        </div>

        <div style={{ 
        width: '100%', 
        padding: '0 16px 16px'
      }}>
        {/* Info Alert */}
        <Alert
          message={<strong>功能说明</strong>}
          description="通过数据更新分布图，可以分析各表在不同时间段的活跃程度，帮助优化数据处理策略"
          type="info"
          icon={<InfoCircleOutlined />}
            style={{
            marginBottom: '16px',
            border: '1px solid #bfdbfe',
            backgroundColor: '#eff6ff'
          }}
        />

        {/* Search Filters */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SearchOutlined />
              数据筛选
            </div>
          }
          style={{ marginBottom: '16px' }}
        >
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px', 
            marginBottom: '16px'
          }}>
            <div>
              <label style={{ 
              fontSize: '14px', 
                fontWeight: '500', 
                color: '#374151', 
              display: 'flex',
              alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <DatabaseOutlined style={{ fontSize: '16px' }} />
                数据源名
              </label>
              <Input
                placeholder="请输入数据源名"
                value={searchFilters.datasourceName}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, datasourceName: e.target.value }))}
                style={{ borderRadius: '6px' }}
              />
            </div>
            <div>
              <label style={{ 
                fontSize: '14px',
                fontWeight: '500', 
                color: '#374151', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <DatabaseOutlined style={{ fontSize: '16px' }} />
                数据库名
              </label>
              <Input
                placeholder="请输入数据库名"
                value={searchFilters.schemaName}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, schemaName: e.target.value }))}
                style={{ borderRadius: '6px' }}
              />
              </div>
            <div>
              <label style={{ 
                fontSize: '14px',
                fontWeight: '500', 
                color: '#374151', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                marginBottom: '8px'
              }}>
                <TableOutlined style={{ fontSize: '16px' }} />
                数据表名
              </label>
              <Input
                placeholder="请输入数据表名"
                value={searchFilters.tableName}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, tableName: e.target.value }))}
                style={{ borderRadius: '6px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button 
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={tableLoading}
              style={{
                backgroundColor: '#2563eb',
                borderColor: '#2563eb',
                borderRadius: '6px'
              }}
            >
              {tableLoading ? '查询中...' : '查询'}
            </Button>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleReset}
              style={{ borderRadius: '6px' }}
            >
              重置
            </Button>
          </div>
        </Card>

        {/* Results Table */}
                <Card
          title={
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600' }}>数据源列表</div>
              <div style={{ fontSize: '14px', color: '#64748b' }}>
                共找到 {pagination.total} 条数据源记录
              </div>
            </div>
          }
    >
          <div style={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <Table
              columns={[
                {
                  title: <span style={{ fontWeight: '600' }}>数据源名</span>,
                  dataIndex: 'datasourceName',
                  key: 'datasourceName',
                  render: (text: string) => (
                    <span style={{ 
                      fontWeight: '500',
                      color: '#1e293b'
                    }}>
                      {text}
                    </span>
                  ),
                },
                {
                  title: <span style={{ fontWeight: '600' }}>数据库名</span>,
                  dataIndex: 'schemaName',
                  key: 'schemaName',
                  render: (text: string) => (
                    <span style={{ color: '#64748b' }}>{text}</span>
                  ),
                },
                {
                  title: <span style={{ fontWeight: '600' }}>数据表名</span>,
                  dataIndex: 'tableName',
                  key: 'tableName',
                  render: (text: string) => (
                    <span style={{ color: '#64748b' }}>{text}</span>
                  ),
                },
                {
                  title: <span style={{ fontWeight: '600' }}>操作</span>,
                  key: 'action',
                  align: 'right' as const,
                  render: (_: any, record: API.SyncTableResponseDTO) => (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        type="primary"
                        icon={<BarChartOutlined />}
                        loading={loading && currentRecord?.id === record.id}
                        onClick={() => handleViewDistribution(record)}
                        style={{
                          backgroundColor: '#2563eb',
                          borderColor: '#2563eb',
                          borderRadius: '6px'
                        }}
                      >
                        更新分布
                      </Button>
                      <Button
        size="small"
                        icon={<EyeOutlined />}
                        loading={dataSpyLoading && currentSpyRecord?.id === record.id}
                        onClick={() => handleDataSpy(record)}
                        style={{
                          borderColor: '#10b981',
                          color: '#10b981',
                          borderRadius: '6px'
                        }}
                        className="hover:bg-green-50"
                      >
                        数据窥探
                      </Button>
                    </div>
                  ),
                },
              ]}
              dataSource={tableData}
              loading={tableLoading}
              rowKey="id"
          pagination={{ 
                current: pagination.current,
                pageSize: pagination.pageSize,
                total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => (
                  <span style={{ color: '#64748b' }}>
                    共 {total} 条记录，当前显示第 {range[0]}-{range[1]} 条
              </span>
            ),
            onChange: handleTableChange,
            onShowSizeChange: handleTableChange,
          }}
              style={{ backgroundColor: '#fff' }}
            />
          </div>
        </Card>
      </div>
      
      <Modal
        title={
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <BarChartOutlined style={{ color: '#2563eb' }} />
            {currentRecord?.schemaName}.{currentRecord?.tableName} - 数据更新分布
          </div>
        }
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={1300}
        destroyOnClose
        style={{ top: 20 }}
        bodyStyle={{ 
          padding: '24px',
          backgroundColor: '#fafafa',
          minHeight: '500px'
        }}
      >
        {distributionData.length > 0 && (
          <Tabs 
            defaultActiveKey={[...new Set(distributionData.map(item => item.updateDate))].sort()[0]} 
            type="card"
            style={{ 
              backgroundColor: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            tabBarStyle={{
              marginBottom: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              padding: '8px'
            }}
          >
            {[...new Set(distributionData.map(item => item.updateDate))].sort().map(date => (
              <TabPane 
                tab={
                  <span style={{ 
                    fontSize: '14px', 
                    fontWeight: '500',
                    padding: '8px 16px',
                    display: 'inline-block'
                  }}>
                    📅 {date}
                  </span>
                } 
                key={date}
              >
                <div style={{ 
                  backgroundColor: '#fff',
                  borderRadius: '6px',
                  padding: '16px'
                }}>
                  {renderChart(date)}
                </div>
              </TabPane>
            ))}
          </Tabs>
        )}
        {distributionData.length === 0 && (
          <div style={{ 
            height: 400, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '2px dashed #d9d9d9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>暂无数据</div>
            <div style={{ fontSize: '14px', color: '#999' }}>该时间段内没有数据更新记录</div>
          </div>
        )}
      </Modal>

      {/* 数据窥探弹窗 */}
      <Modal
        title={
          <div style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <EyeOutlined style={{ color: '#10b981' }} />
            {currentSpyRecord?.schemaName}.{currentSpyRecord?.tableName} - 数据窥探
          </div>
        }
        visible={dataSpyModalVisible}
        onCancel={() => setDataSpyModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
        bodyStyle={{ 
          padding: '16px'
        }}
      >
        {dataSpyData && dataSpyData.length > 0 && hasValidData(dataSpyData) ? (
          <div>
            <Table
              dataSource={getValidData(dataSpyData).map((item, index) => ({
                key: `${index + 1}`,
                schemaName: item.schemaName,
                tableName: item.tableName,
                binlogCount: item.binlogCount,
                startTime: item.startTime,
                endTime: item.endTime,
                id: currentSpyRecord?.id
              }))}
              columns={[
                {
                  title: '#',
                  dataIndex: 'key',
                  key: 'index',
                  width: 60,
                  align: 'center' as const,
                },
                {
                  title: '数据库名',
                  dataIndex: 'schemaName',
                  key: 'schemaName',
                },
                {
                  title: '表名',
                  dataIndex: 'tableName',
                  key: 'tableName',
                },
                {
                  title: '更新数',
                  dataIndex: 'binlogCount',
                  key: 'binlogCount',
                  render: (count: number) => (
                    <span style={{ fontWeight: '500' }}>
                      {count != null ? count.toLocaleString() : '0'}
                    </span>
                  ),
                },
                {
                  title: '开始时间',
                  dataIndex: 'startTime',
                  key: 'startTime',
                  render: (time: number) => time ? formatTime(time) : '-',
                },
                {
                  title: '结束时间',
                  dataIndex: 'endTime',
                  key: 'endTime',
                  render: (time: number) => time ? formatTime(time) : '-',
                },
              ]}
              pagination={false}
              size="small"
              style={{
                marginBottom: '16px'
              }}
            />
            
            {hasValidData(dataSpyData) && (
              <div style={{ textAlign: 'center' }}>
                <Button
                  type="primary"
                  loading={continueSpyLoading}
                  onClick={() => {
                    const validData = getValidData(dataSpyData);
                    const latestData = validData[validData.length - 1];
                    const startTime = latestData?.startTime || 0;
                    handleContinueSpy(currentSpyRecord?.id || 0, startTime);
                  }}
                >
                  继续窥探
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            height: 300, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#fff',
            borderRadius: '8px',
            border: '2px dashed #d9d9d9'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
            <div style={{ fontSize: '18px', color: '#666', marginBottom: '8px' }}>暂无数据</div>
            <div style={{ fontSize: '14px', color: '#999' }}>该时间段内没有数据更新记录</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Reader;

