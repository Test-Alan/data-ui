import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import { listMemberPaing, addMember, deleteMember } from '@/services/ext-sync/api';
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

  const initialFormValues = (entity?: API.JdbcDatasourceResponseDTO) => {
    form.resetFields();
    form.setFieldsValue(entity);
  };

  const openAddMemberModal = () => {
    if (checkUserAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('新增使用者');
    initialFormValues(undefined);
    setModalVisible(true);
  };

  const handleAddMember = async (value: API.AddUserRequestDTO) => {
    if (checkUserAuthority()) return message.warning('当前用户没有权限操作');
    await addMember(value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDeleteMember = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteMember(id);
    reloadTableData();
  };

  const columns: ProColumns<API.UserResponseDTO>[] = [
    {
      search: false,
      title: '使用者ID',
      dataIndex: 'id',
    },
    {
      title: '名字',
      dataIndex: 'name',
    },
    {
      search: false,
      title: '所属研发组',
      dataIndex: 'groupName',
    },
    {
      search: false,
      title: '操作',
      width: '150px',
      render: (dom, entity) => {
        return (
          <>
            <Popconfirm
              title={`确认要删除使用者"${entity.name}"吗?`}
              onConfirm={async () => handleDeleteMember(entity.id)}
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
              path: '/user-management/members/',
              breadcrumbName: '团队成员',
            },
          ],
        },
      }}
    >
      <ProTable<API.MemberResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => listMemberPaing(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openAddMemberModal}>
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
        onFinish={async (value) => handleAddMember(value)}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormText
          rules={[
            {
              required: true,
              message: '名字不能为空',
            },
          ]}
          name="name"
          label="名字"
        />
        <ProFormText
          rules={[
            {
              required: true,
              message: '所属组名不能为空',
            },
          ]}
          name="groupName"
          label="所属组名"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default account;
