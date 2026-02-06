import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import { listCdcPaing, addCdc, deleteCdc, updateDts } from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, message } from 'antd';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
} from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import * as _ from 'lodash';
import { checkSuperAuthority, checkUserAuthority } from '@/global';
const cdcInstance: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const initialFormValues = (entity?: API.JdbcDatasourceResponseDTO) => {
    form.resetFields();
    form.setFieldsValue(entity);
  };

  const openAddCdcModal = () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('新增抽水器');
    initialFormValues(undefined);
    setModalVisible(true);
  };

  const handleAddCdc = async (value: API.AddCdcInstanceInfoRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await addCdc(value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDelete = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteCdc(id);
    reloadTableData();
  };

  const handleUpdateDts = async (instanceId: string) => {
    if (checkUserAuthority()) return message.warning('当前用户没有权限操作');
    await updateDts(instanceId);
    reloadTableData();
  };

  const options = [
    {
      label: 'DTS',
      value: 1,
    },
    {
      label: 'FLINK',
      value: 2,
    },
  ];

  const columns: ProColumns<API.CdcInstanceInfoResponseDTO>[] = [
    {
      search: false,
      title: '流水号',
      dataIndex: 'id',
    },
    {
      title: '实例ID',
      dataIndex: 'instanceId',
    },
    {
      search: false,
      title: '名称',
      dataIndex: 'name',
    },
    {
      search: false,
      title: '类型',
      dataIndex: 'type',
      render: (dom, entity) => {
        return (
          <>
            {entity.type == 1 ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>DTS</span>
            ) : (
              <span style={{ color: 'blue', fontWeight: 'bold' }}>FLINK</span>
            )}
          </>
        );
      },
    },
    {
      search: false,
      title: 'ddl topic',
      dataIndex: 'ddlTopic',
    },
    {
      search: false,
      title: '描述',
      dataIndex: 'description',
    },
    {
      search: false,
      title: '操作',
      width: '150px',
      render: (dom, entity) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Popconfirm
              title={`确认要删除实例"${entity.instanceId}"吗?`}
              onConfirm={async () => handleDelete(entity.id)}
              okText="是"
              cancelText="否"
            >
              <Button size="small" style={{ marginLeft: '5px', backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff', border: '1px solid #ff4d4f' }}>
                删除
              </Button>
            </Popconfirm>
            {entity.type === 1 && (
              <Popconfirm
                title={`确认要更新DTS"${entity.instanceId}"吗?`}
                onConfirm={async () => handleUpdateDts(entity.instanceId)}
                okText="是"
                cancelText="否"
              >
                <Button
                  type="default"
                  size="small"
                  style={{
                    marginLeft: '5px',
                    backgroundColor: '#4CAF50',
                    color: '#fff',
                    borderColor: '#4CAF50',
                  }}
                >
                  更新DTS
                </Button>
              </Popconfirm>
            )}
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
              path: '/sync/',
              breadcrumbName: '同步管理',
            },
            {
              path: '/sync/stream-capture/',
              breadcrumbName: '数据流捕获',
            },
          ],
        },
      }}
    >
      <ProTable<API.CdcInstanceInfoResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => listCdcPaing(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openAddCdcModal}>
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
        onFinish={async (value) => handleAddCdc(value)}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormSelect
          name="type"
          label="抽水器类型"
          fieldProps={{
            options,
          }}
          placeholder="请选择抽水器类型"
          rules={[{ required: true, message: '请选择抽水器类型' }]}
        />
        <ProFormText
          rules={[
            {
              required: true,
              message: '实例ID不能为空',
            },
          ]}
          name="instanceId"
          label="实例ID"
        />
        <ProFormDigit name="id" hidden={true} />
        <ProFormText
          rules={[
            {
              required: true,
              message: '名称不能为空',
            },
          ]}
          name="name"
          label="名称"
        />
        <ProFormText
          rules={[
            {
              required: false,
              message: 'region id(DTS必填)',
            },
          ]}
          name="regionId"
          label="区域ID"
        />
        <ProFormText
          rules={[
            {
              required: true,
              message: 'ddl topic不能为空',
            },
          ]}
          name="ddlTopic"
          label="指定ddl topic"
        />
        <ProFormTextArea name="description" placeholder={'描述'} label="描述" />
      </ModalForm>
    </PageContainer>
  );
};

export default cdcInstance;
