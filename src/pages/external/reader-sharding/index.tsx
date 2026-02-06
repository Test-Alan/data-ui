import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import moment from 'moment';
import {
  addReaderDynamicConfig,
  deleteReaderDynamicConfig,
  listJdbcDatasourceIdNames,
  listReaderDynamicConfigPaging,
  listReaderDynamicConfigShardingRules,
} from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, message } from 'antd';
import { ModalForm, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import * as _ from 'lodash';
import { checkSuperAuthority } from '@/global';
import type { RequestOptionsType } from '@ant-design/pro-utils';

const ReaderShardingConfig: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [form] = Form.useForm();

  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const openAddModal = () => {
    if (!checkSuperAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setModalTitle('新增分片读取器');
    form.resetFields();
    setModalVisible(true);
  };

  const handleAdd = async (value: API.AddReaderDynamicConfigRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await addReaderDynamicConfig(value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDelete = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteReaderDynamicConfig(id);
    reloadTableData();
  };

  const columns: ProColumns<API.ReaderDynamicConfigResponseDTO>[] = [
    {
      search: false,
      title: '流水号',
      dataIndex: 'id',
    },
    {
      title: '名称',
      dataIndex: 'name',
      search: false,
    },
    {
      search: false,
      title: '数据源名',
      dataIndex: 'sourceDatasourceName',
    },
    {
      search: false,
      title: '源库名',
      dataIndex: 'sourceSchemaName',
    },
    {
      title: '逻辑表名前缀',
      dataIndex: 'logicalTablePrefix',
    },
    {
      search: false,
      title: '分片规则',
      dataIndex: 'shardingRuleName',
    },
    {
      search: false,
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      render: (_, record) => {
        const v = record.createTime as unknown;
        if (v === undefined || v === null || v === '') return '-';
        const n = typeof v === 'number' ? v : Number(v);
        return moment(Number.isNaN(n) ? (v as any) : n).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      search: false,
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      valueType: 'dateTime',
      render: (_, record) => {
        const v = record.updateTime as unknown;
        if (v === undefined || v === null || v === '') return '-';
        const n = typeof v === 'number' ? v : Number(v);
        return moment(Number.isNaN(n) ? (v as any) : n).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      search: false,
      title: '操作',
      width: '150px',
      render: (dom, entity) => {
        return (
          <>
            <Popconfirm
              title={`确认要删除配置"${entity.id}"吗?`}
              onConfirm={async () => handleDelete(entity.id)}
              okText="是"
              cancelText="否"
            >
              <Button
                size="small"
                style={{
                  marginLeft: '5px',
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f',
                  color: '#fff',
                  border: '1px solid #ff4d4f',
                }}
              >
                删除
              </Button>
            </Popconfirm>
          </>
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
              path: '/sync/',
              breadcrumbName: '同步管理',
            },
            {
              path: '/sync/sharding-reader/',
              breadcrumbName: '分片读取器',
            },
          ],
        },
      }}
    >
      <ProTable<API.ReaderDynamicConfigResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        search={{ labelWidth: 120 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => listReaderDynamicConfigPaging(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openAddModal}>
            <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>,
        ]}
      />

      <ModalForm
        modalProps={{ maskClosable: false }}
        form={form}
        formRef={createFormRef}
        title={modalTitle}
        width={640}
        visible={modalVisible}
        onVisibleChange={setModalVisible}
        onFinish={async (value) => handleAdd(value as API.AddReaderDynamicConfigRequestDTO)}
      >
        <ProFormText
          rules={[
            {
              required: true,
            },
          ]}
          name="name"
          label="名称"
          placeholder="名称"
        />
        <ProFormSelect
          name="sourceDatasourceId"
          label="数据源"
          placeholder="请选择数据源"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listJdbcDatasourceIdNames();
            return _.map(keyValues, (x) => {
              const item: RequestOptionsType = {
                label: x.value,
                value: x.key,
              };
              return item;
            });
          }}
          rules={[
            {
              required: true,
            },
          ]}
        />

        <ProFormText
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          name="sourceSchemaName"
          label="源数据库名"
          placeholder="源数据库名"
        />

        <ProFormText
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          name="logicalTablePrefix"
          label="逻辑表名前缀"
          placeholder="逻辑表名前缀"
        />

        <ProFormSelect
          name="shardingRule"
          label="分片规则"
          placeholder="请选择分片规则"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listReaderDynamicConfigShardingRules();
            return _.map(keyValues, (x) => {
              const item: RequestOptionsType = {
                label: x.value,
                value: x.key,
              };
              return item;
            });
          }}
          rules={[
            {
              required: true,
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default ReaderShardingConfig;

