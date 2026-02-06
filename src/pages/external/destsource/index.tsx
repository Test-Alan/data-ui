import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import {
  getJdbcTargetDatasourcePaing,
  addJdbcTargetDatasource,
  updateJdbcTargetDatasource,
  deleteJdbcTargetDatasource,
} from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, message } from 'antd';
import { ModalForm, ProFormDigit, ProFormText, ProFormTextArea } from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import * as _ from 'lodash';
import { checkSuperAuthority, checkUserAuthority } from '@/global';
const TargetDatasourcePage: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [datasourceNameReadonly, setDatasourceNameReadonly] = useState<boolean>(false);
  const [updateModal, setUpdateModal] = useState<boolean>(false);

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

  const openAddDatasourceModal = () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('创建数据源');
    initialFormValues(undefined);
    setDatasourceNameReadonly(false);
    setUpdateModal(false);
    setModalVisible(true);
  };

  const openUpdateDatasourceModal = (entity: API.JdbcDatasourceResponseDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('修改数据源');
    initialFormValues(entity);
    setDatasourceNameReadonly(true);
    setUpdateModal(true);
    setModalVisible(true);
  };

  const handleAddDatasource = async (value: API.AddJdbcDatasourceRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await addJdbcTargetDatasource(value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleUpdateDatasource = async (id: number, value: API.UpdateJdbcDatasourceRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await updateJdbcTargetDatasource(id, value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDeleteDatasource = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteJdbcTargetDatasource(id);
    reloadTableData();
  };

  const columns: ProColumns<API.JdbcDatasourceResponseDTO>[] = [
    {
      search: false,
      title: '数据源ID',
      dataIndex: 'id',
    },
    {
      title: '名称',
      dataIndex: 'name',
    },
    {
      search: false,
      title: 'jdbc url',
      dataIndex: 'jdbcUrl',
    },
    {
      title: '描述',
      dataIndex: 'description',
    },
    {
      search: false,
      title: '操作',
      width: '150px',
      render: (dom, entity) => {
        return (
          <>
            <Button type="primary" size="small" onClick={() => openUpdateDatasourceModal(entity)}>
              修改
            </Button>
            <Popconfirm
              title={`确认要删除数据源"${entity.name}"吗?`}
              onConfirm={async () => handleDeleteDatasource(entity.id)}
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
              path: '/sync/',
              breadcrumbName: '同步管理',
            },
            {
              path: '/sync/target-source/',
              breadcrumbName: '目标数据源',
            },
          ],
        },
      }}
    >
      <ProTable<API.JdbcDatasourceResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => getJdbcTargetDatasourcePaing(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openAddDatasourceModal}>
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
        onFinish={async (value) =>
          updateModal ? handleUpdateDatasource(value.id, value) : handleAddDatasource(value)
        }
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormText
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          readonly={datasourceNameReadonly}
          name="name"
          label="名称(不能修改，谨慎添加)"
          placeholder={'名称(不能修改，谨慎添加)'}
        />
        <ProFormDigit name="id" hidden={true} />
        <ProFormText
          rules={[
            {
              required: true,
              message: '输入正确jdbc url比如: jdbc:mysql://192.168.0.1:3306',
            },
          ]}
          name="jdbcUrl"
          label="jdbc url"
          placeholder={'jdbc:mysql://192.168.0.1:3306'}
        />
        <ProFormText
          rules={[
            {
              required: true,
              message: 'jdbc用户名不能为空',
            },
          ]}
          name="jdbcUsername"
          label="jdbc用户名"
          placeholder={'jdbc用户名'}
        />
        <ProFormText.Password
          rules={[
            {
              required: true,
              message: 'jdbc密码不能为空',
            },
          ]}
          name="jdbcPassword"
          label="jdbc密码"
          placeholder={'jdbc密码'}
        />
        <ProFormTextArea name="description" placeholder={'描述'} label="描述" />
      </ModalForm>
    </PageContainer>
  );
};

export default TargetDatasourcePage;
