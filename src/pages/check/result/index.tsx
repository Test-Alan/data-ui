import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef } from 'react';
import { listDataCheckResultPage } from '@/services/hermes-data-check/api';
import * as _ from 'lodash';

const CheckConfig: React.FC = () => {
  const tableActionRef = useRef();

  const columns: ProColumns<API.DataCheckResultResponseDTO>[] = [
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
      title: '源表数量',
      dataIndex: 'sourceCount',
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
      title: '目标表数量',
      dataIndex: 'targetCount',
    },
    {
      title: '差异值',
      dataIndex: 'difference',
      render: (dom, entity) => {
        return (
          <>
            {entity.difference > 0 ? (
              <span style={{ color: 'red', fontWeight: 'bold' }}>{entity.difference}</span>
            ) : (
              <span style={{ color: 'green', fontWeight: 'bold' }}>{entity.difference}</span>
            )}
          </>
        );
      },
    },
    {
      title: '批次号',
      dataIndex: 'batchId',
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
              path: '/validation/result/',
              breadcrumbName: '检查结果',
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
        request={(params) => listDataCheckResultPage(params)}
      />
    </PageContainer>
  );
};

export default CheckConfig;
