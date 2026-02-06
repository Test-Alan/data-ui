
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import { Tooltip, message, Result, Button } from 'antd';
import React, { useRef, useEffect, useState } from 'react';
import { getOperationLogPaging } from '@/services/flink-management/api';
import { checkSuperAuthority } from '@/global';
import { history } from 'umi';
import moment from 'moment';

const OperationLogPage: React.FC = () => {
  const tableActionRef = useRef();
  const [hasPermission, setHasPermission] = useState(true);

  // 检查权限
  useEffect(() => {
    if (!checkSuperAuthority()) {
      setHasPermission(false);
      message.warning('当前用户没有权限访问操作日志');
      // 3秒后自动跳转
      setTimeout(() => {
        window.location.href = '/realtime-compute/flink-management/?tab=deployment';
      }, 3000);
    }
  }, []);

  // 如果没有权限，显示无权限页面
  if (!hasPermission) {
    return (
      <Result
        status="403"
        title="权限不足"
        subTitle="抱歉，操作日志功能仅限超级管理员访问。如需查看操作日志，请联系系统管理员获取相应权限。"
        extra={[
          <Button type="primary" onClick={() => {
            console.log('点击了返回作业部署按钮');
            // 使用window.location.href强制页面跳转
            window.location.href = '/realtime-compute/flink-management/?tab=deployment';
          }} key="deployment">
            返回作业部署
          </Button>,
          <Button onClick={() => {
            console.log('点击了返回首页按钮');
            history.push('/welcome/');
          }} key="home">
            返回首页
          </Button>,
        ]}
      />
    );
  }

  const columns: ProColumns<API.OperationLogResponseDTO>[] = [
    {
      search: false,
      title: '日志ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '操作人',
      dataIndex: 'operatorName',
      width: 120,
      render: (text) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              background: '#e6f7ff',
              color: '#1890ff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold',
              border: '1px solid #91d5ff',
            }}
          >
            👤
          </span>
          <span
            style={{
              fontWeight: '600',
              color: '#262626',
              fontSize: '14px',
            }}
          >
            {text || '未知用户'}
          </span>
        </div>
      ),
    },
    {
      search: false,
      title: '请求URL',
      dataIndex: 'requestUrl',
      width: 300,
      ellipsis: false, // 完全禁用ellipsis以避免默认tooltip
      render: (text: any, record: API.OperationLogResponseDTO) => {
        const url = record.requestUrl || '';
        const formatUrlTooltip = (url: string) => {
          if (!url) return '🌐 请求URL：无URL';
          return `🌐 请求URL详情：\n${url}`;
        };

        return (
          <Tooltip 
            title={formatUrlTooltip(url)}
            placement="topLeft"
            overlayStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e0e0e0',
              maxWidth: '550px',
            }}
            overlayInnerStyle={{
              padding: '12px',
              color: '#1890ff',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.4',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
              title="" // 显式清空原生title属性
            >
              <span
                style={{
                  fontWeight: '400',
                  color: '#262626',
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title="" // 显式清空原生title属性
              >
                {url && url.length > 35 ? `${url.substring(0, 35)}...` : (url || '-')}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      search: false,
      title: '请求参数',
      dataIndex: 'requestParam',
      width: 350,
      ellipsis: false, // 完全禁用ellipsis以避免默认tooltip
      render: (text: any, record: API.OperationLogResponseDTO) => {
        const param = record.requestParam || '';
        // 格式化JSON数据用于tooltip显示
        const formatTooltipContent = (jsonStr: string) => {
          if (!jsonStr || jsonStr === '-') return '🔧 请求参数：无参数';
          
          try {
            const parsed = JSON.parse(jsonStr);
            return `🔧 请求参数详情：\n${JSON.stringify(parsed, null, 2)}`;
          } catch (error) {
            return `📄 请求参数：\n${jsonStr}`;
          }
        };

        return (
          <Tooltip 
            title={formatTooltipContent(param)}
            placement="topLeft"
            overlayStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e0e0e0',
              maxWidth: '450px',
            }}
            overlayInnerStyle={{
              padding: '12px',
              color: '#333333',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.4',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
              title="" // 显式清空原生title属性
            >
              <span
                style={{
                  fontWeight: '400',
                  color: '#262626',
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title="" // 显式清空原生title属性
              >
                {param && param.length > 30 ? `${param.substring(0, 30)}...` : (param || '-')}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      search: false,
      title: '操作时间',
      dataIndex: 'createTime',
      width: 180,
      render: (_, record) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>🕒</span>
          <span
            style={{
              fontWeight: '600',
              color: '#262626',
              fontSize: '14px',
            }}
          >
            {moment(record.createTime).format('YYYY-MM-DD HH:mm:ss')}
          </span>
        </div>
      ),
    },
    {
      search: false,
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      render: (_, record) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              fontWeight: '600',
              color: '#595959',
              fontSize: '14px',
            }}
          >
            {moment(record.updateTime).format('YYYY-MM-DD HH:mm:ss')}
          </span>
        </div>
      ),
    },
  ];

  return (
    <ProTable<API.OperationLogResponseDTO, API.PageParams>
      columns={columns}
      size="small"
      pagination={{ pageSize: 10 }}
      rowKey="id"
      actionRef={tableActionRef}
      request={(params) => getOperationLogPaging(params)}
      scroll={{ x: 1200 }}
      search={{
        labelWidth: 'auto',
        collapsed: false,
      }}
      toolBarRender={false}
      headerTitle={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '16px' }}>📋</span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#262626' }}>
            系统操作日志
          </span>
        </div>
      }
    />
  );
};

export default OperationLogPage; 