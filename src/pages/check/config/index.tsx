import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef } from 'react';
import {
  listDataCheckConfigPage,
  enableDataCheckConfig,
  disableDataCheckConfig,
  updateCheckConfig,
} from '@/services/hermes-data-check/api';
import { Button, Switch, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import * as _ from 'lodash';
import { checkSuperAuthority } from '@/global';

const CheckConfig: React.FC = () => {
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const handleUpdateCheckConfig = async () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await updateCheckConfig();
    reloadTableData();
  };

  const handleEnableCheckConfig = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await enableDataCheckConfig(id);
    reloadTableData();
  };

  const handleDisableCheckConfig = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await disableDataCheckConfig(id);
    reloadTableData();
  };

  const columns: ProColumns<API.DataCheckConfigResponseDTO>[] = [
    {
      search: false,
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '客户端名',
      dataIndex: 'clientName',
    },
    {
      search: false,
      title: '数据源名称',
      dataIndex: 'sourceDatasourceName',
    },
    {
      title: '数据库名',
      dataIndex: 'sourceSchemaName',
    },
    {
      title: '表名',
      dataIndex: 'sourceTableName',
    },
    {
      search: false,
      title: '目标数据源名称',
      dataIndex: 'targetDatasourceName',
    },
    {
      title: '目标库名',
      dataIndex: 'targetSchemaName',
    },
    {
      title: '目标表名',
      dataIndex: 'targetTableName',
    },
    {
      search: false,
      title: '启用状态',
      dataIndex: 'enableStatus',
      render: (dom, entity) => {
        return (
          <Switch
            checkedChildren="启用"
            unCheckedChildren="禁用"
            size={'small'}
            checked={entity.enableStatus == 1}
            onChange={async (checked: boolean) => {
              if (checked) {
                await handleEnableCheckConfig(entity.id);
              } else {
                await handleDisableCheckConfig(entity.id);
              }
            }}
          />
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: '',
        breadcrumb: {
          routes: [
            {
              path: '/validation/',
              breadcrumbName: '同步检查',
            },
            {
              path: '/validation/config/',
              breadcrumbName: '检查配置',
            },
          ],
        },
      }}
    >
      <ProTable<API.DataCheckConfigResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => listDataCheckConfigPage(params)}
        toolBarRender={() => [
          <Button
            key="refresh"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleUpdateCheckConfig}
          >
            刷新配置
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default CheckConfig;
