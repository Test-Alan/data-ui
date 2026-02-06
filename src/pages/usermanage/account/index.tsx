import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import { listUserPaing, addUser, deleteUser } from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, message } from 'antd';
import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import * as _ from 'lodash';
import { checkSuperAuthority, checkUserAuthority } from '@/global';
const account: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const initialFormValues = (entity?: API.UserResponseDTO) => {
    form.resetFields();
    form.setFieldsValue(entity);
  };

  const openAddUserModal = () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('新增账号');
    initialFormValues(undefined);
    setModalVisible(true);
  };

  const handleAddUser = async (value: API.AddUserRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await addUser(value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDeleteUser = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteUser(id);
    reloadTableData();
  };

  const columns: ProColumns<API.UserResponseDTO>[] = [
    {
      search: false,
      title: '用户ID',
      dataIndex: 'id',
    },
    {
      title: '账号名',
      dataIndex: 'name',
    },
    {
      search: false,
      title: '账号密码',
      dataIndex: 'password',
    },
    {
      search: false,
      title: '角色类型',
      dataIndex: 'roleType',
      valueEnum: {
        '1': { text: '超级管理员', status: 'Success' }, // 绿色
        '2': { text: '普通管理员', status: 'Warning' }, // 黄色
        '3': { text: '普通用户', status: 'Default' }, // 默认色
      },
    },
    {
      title: '启用状态',
      dataIndex: 'enableStatus',
      initialValue: '',
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
          <>
            <Popconfirm
              title={`确认要删除用户"${entity.name}"吗?`}
              onConfirm={async () => handleDeleteUser(entity.id)}
              okText="是"
              cancelText="否"
            >
              <Button size="small" style={{ marginLeft: '5px', backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff', border: '1px solid #ff4d4f' }}>
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
              path: '/user-management/',
              breadcrumbName: '用户管理',
            },
            {
              path: '/user-management/accounts/',
              breadcrumbName: '系统账号',
            },
          ],
        },
      }}
    >
      <ProTable<API.UserResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => listUserPaing(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openAddUserModal}>
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
        onFinish={async (value) => handleAddUser(value)}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormText
          rules={[
            {
              required: true,
              message: '账号名不能为空',
            },
          ]}
          name="name"
          label="账号名"
        />
        <ProFormDigit name="id" hidden={true} />
        <ProFormText
          rules={[
            {
              required: true,
              message: '账号密码不能为空',
            },
          ]}
          name="password"
          label="账号密码"
        />
        <ProFormSelect
          name="roleType"
          label="角色类型"
          rules={[{ required: true, message: '请选择角色类型' }]}
          options={[
            { label: '超级管理员', value: 1 },
            { label: '普通管理员', value: 2 },
            { label: '普通用户', value: 3 },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default account;
