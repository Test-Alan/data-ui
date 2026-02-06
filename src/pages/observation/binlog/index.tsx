import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import { getBinlogStatPaging } from '@/services/hermes-data-insight/api';
import styles from '../index.less';
import { Card, Row, Col, Statistic, Typography, Divider, Badge, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ThunderboltOutlined, LineChartOutlined, CloudSyncOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const BinlogStatPage: React.FC = () => {
  const [sorterInfo, setSorterInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [topStats, setTopStats] = useState<any>({
    totalBinlogs: 0,
    maxBinlogs: 0,
    maxBinlogsTable: '',
    recentTable: '',
    recentTime: '',
    tableCount: 0
  });

  // 时间戳格式化函数
  const formatTimestamp = (timestamp: number | string): string => {
    if (!timestamp) return '';
    
    const date = new Date(Number(timestamp));
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  useEffect(() => {
    // 模拟获取顶部统计数据
    const fetchTopStats = async () => {
      setLoading(true);
      try {
        // 这里应该是真实的API调用，目前用模拟数据
        const data = await getBinlogStatPaging({ pageSize: 100 });
        
        if (data && data.data && data.data.length > 0) {
          const sortedByCount = [...data.data].sort((a, b) => b.binlogCount - a.binlogCount);
          const sortedByTime = [...data.data].sort((a, b) => 
            new Date(b.binlogLastTime).getTime() - new Date(a.binlogLastTime).getTime());
          
          const totalBinlogs = data.data.reduce((sum, item) => sum + item.binlogCount, 0);
          
          setTopStats({
            totalBinlogs,
            maxBinlogs: sortedByCount[0]?.binlogCount || 0,
            maxBinlogsTable: sortedByCount[0] ? `${sortedByCount[0].schemaName}.${sortedByCount[0].tableName}` : '',
            recentTable: sortedByTime[0] ? `${sortedByTime[0].schemaName}.${sortedByTime[0].tableName}` : '',
            recentTime: sortedByTime[0]?.binlogLastTime || '',
            tableCount: data.total || 0
          });
        }
      } catch (error) {
        console.error('获取顶部统计数据失败', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopStats();
  }, []);

  const getBinlogCountStyle = (count: number) => {
    if (count > 1000000) {
      return styles.binlogCountHigh;
    }
    return '';
  };

  const columns: ProColumns<API.BinlogStatResponseDTO>[] = [
    {
      title: '库名',
      dataIndex: 'schemaName',
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: '表名',
      dataIndex: 'tableName',
      render: (text) => <Text strong style={{ color: '#722ed1' }}>{text}</Text>,
    },
    {
      title: 'binlog总数',
      dataIndex: 'binlogCount',
      search: false,
      sorter: { multiple: 1 },
      render: (_, entity) => {
        const style = getBinlogCountStyle(entity.binlogCount);
        return (
          <div>
            <span className={style} style={{ 
              background: entity.binlogCount > 500000 ? 'linear-gradient(to right, #ff4d4f, #ff7a45)' : '', 
              padding: entity.binlogCount > 500000 ? '2px 8px' : '',
              borderRadius: entity.binlogCount > 500000 ? '10px' : '',
              color: entity.binlogCount > 500000 ? 'white' : ''
            }}>
              {entity.binlogCount.toLocaleString()}
            </span>
            {sorterInfo && sorterInfo.field === 'binlogCount' && (
              <span style={{ marginLeft: '5px', fontSize: '12px', color: '#999' }}>
                ({sorterInfo.order === 'descend' ? '降序' : '升序'})
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: '最近一次时间',
      dataIndex: 'binlogLastTime',
      search: false,
      valueType: 'dateTime',
      sorter: { multiple: 2 },
      render: (text, record) => {
        const now = new Date();
        const recordDate = new Date(Number(record.binlogLastTime));
        const hoursDiff = (now.getTime() - recordDate.getTime()) / (1000 * 60 * 60);
        
        return (
          <div>
            <span>{formatTimestamp(record.binlogLastTime)}</span>
            {hoursDiff < 2 && (
              <Badge 
                status="processing" 
                style={{ marginLeft: 8 }} 
                text={<Text type="warning">最近</Text>} 
              />
            )}
            {sorterInfo && sorterInfo.field === 'binlogLastTime' && (
              <span style={{ marginLeft: '5px', fontSize: '12px', color: '#999' }}>
                ({sorterInfo.order === 'descend' ? '降序' : '升序'})
              </span>
            )}
          </div>
        );
      }
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      search: false,
      valueType: 'dateTime',
    },
  ];

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: {
          routes: [
            {
              path: '/monitoring/',
              breadcrumbName: '流量监控',
            },
            {
              path: '/monitoring/binlog-insights/',
              breadcrumbName: 'Binlog分析',
            },
          ],
        },
      }}
    >
      <div className={styles.dashboardWrapper}>
        <Spin spinning={loading}>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card bordered={false} className={styles.statCard} hoverable>
                <Statistic
                  title={<Title level={5}><ThunderboltOutlined /> 总Binlog数</Title>}
                  value={topStats.totalBinlogs}
                  valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
                  prefix={<ArrowUpOutlined />}
                  suffix="条"
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} className={styles.statCard} hoverable>
                <Statistic
                  title={<Title level={5}><LineChartOutlined /> 最大Binlog表</Title>}
                  value={topStats.maxBinlogs}
                  valueStyle={{ color: '#cf1322', fontWeight: 'bold' }}
                  suffix="条"
                />
                <Text type="secondary">{topStats.maxBinlogsTable}</Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} className={styles.statCard} hoverable>
                <Statistic
                  title={<Title level={5}><CloudSyncOutlined /> 最近同步表</Title>}
                  value={topStats.recentTable}
                  valueStyle={{ color: '#722ed1', fontWeight: 'bold', fontSize: '16px' }}
                />
                <Text type="secondary">{formatTimestamp(topStats.recentTime)}</Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card bordered={false} className={styles.statCard} hoverable>
                <Statistic
                  title="监控表总数"
                  value={topStats.tableCount}
                  valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                  prefix={<ArrowDownOutlined />}
                  suffix="张"
                />
              </Card>
            </Col>
          </Row>
        </Spin>

        <Divider orientation="left">
          <Title level={4} style={{ margin: 0 }}>
          </Title>
        </Divider>

        <ProTable<API.BinlogStatResponseDTO>
          headerTitle={
            <div className={styles.tableHeader}>
              <ThunderboltOutlined /> Binlog数据同步监控
            </div>
          }
          rowKey="id"
          search={{
            labelWidth: 120,
          }}
          request={(params, sorter, filter) => {
            console.log('Request params:', params);
            console.log('Request sorter:', sorter);
            console.log('Request filter:', filter);

            // 手动构建排序参数
            const sortParams: any = params;
            if (sorter && Object.keys(sorter).length > 0) {
              // 将sorter对象直接传递给API调用
              sortParams.sorter = sorter;
            }

            return getBinlogStatPaging(sortParams);
          }}
          columns={columns}
          pagination={{
            pageSize: 10,
            showQuickJumper: true,
          }}
          onChange={(_, _filter, sorter) => {
            console.log('排序参数:', sorter);
            setSorterInfo(Array.isArray(sorter) ? sorter[0] : sorter);
          }}
          toolBarRender={false}
          rowClassName={(record) => {
            if (record.binlogCount > 500000) return styles.highBinlogRow;
            return '';
          }}
        />
      </div>
    </PageContainer>
  );
};

export default BinlogStatPage;
