import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import { getClientInfoPaging } from '@/services/ext-sync/api';
import { executeByClient, executeAll } from '@/services/hermes-data-check/api';
import { Button, Form, Switch, Tooltip, message } from 'antd';
import { FormattedMessage } from 'umi';
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { ObjectUtils } from 'ts-commons';
import type { RequestOptionsType } from '@ant-design/pro-utils';
import * as _ from 'lodash';
import { checkSuperAuthority, checkUserAuthority } from '@/global';

const client: React.FC = () => {
  const [downloadAppBusy] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [updateModal, setUpdateModal] = useState<boolean>(false);
  const [clientLabelReadonly, setClientLabelReadonly] = useState<boolean>(false);
  const [targetDatasourceIdReadonly, setTargetDatasourceIdReadonly] = useState<boolean>(false);

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const initialFormValues = (entity?: API.ClientInfoResponseDTO) => {
    form.resetFields();
    form.setFieldsValue(entity);
  };

  const handleExecuteByClient = async (id: number) => {
    if (checkUserAuthority()) return message.warning('当前用户没有权限操作');
    await executeByClient(id);
    reloadTableData();
  };

  const handleExecuteAll = async () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await executeAll();
    reloadTableData();
  };

  const columns: ProColumns<API.ClientInfoResponseDTO>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      search: false,
    },
    {
      title: '服务名',
      dataIndex: 'clientName',
    },
    {
      title: '服务描述',
      dataIndex: 'clientDescription',
      search: false,
    },
    {
      search: false,
      title: '是否启用',
      dataIndex: 'enableStatus',
      valueEnum: {
        '0': { text: '禁用' },
        '1': { text: '启用' },
      },
      render: (dom, entity) => {
        return (
          <>
            {entity.enableStatus == 1 ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>启用</span>
            ) : (
              <span style={{ color: 'red', fontWeight: 'bold' }}>禁用</span>
            )}
          </>
        );
      },
    },
    {
      search: false,
      title: '操作',
      width: '150px',
      render: (dom, entity) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button type="primary" size="small" onClick={() => handleExecuteByClient(entity.id)}>
              执行检查
            </Button>
          </div>
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
              path: '/validation/execute/',
              breadcrumbName: '执行检查',
            },
          ],
        },
      }}
    >
      <ProTable<API.ClientInfoResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => getClientInfoPaging(params)}
        toolBarRender={() => [
          <Button
            key="refresh"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleExecuteAll}
          >
            执行全部
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default client;
