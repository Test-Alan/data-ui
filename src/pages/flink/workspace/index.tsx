import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import { Button, Form, message, Tag } from 'antd';
import { ModalForm, ProFormText } from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';
import { getWorkspacePaging, createWorkspace } from '@/services/flink-management/workspace-api';
import { checkSuperAuthority } from '@/global';
import moment from 'moment';

const FlinkWorkspace: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const initialFormValues = () => {
    form.resetFields();
  };

  const openCreateModal = () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('新增工作空间');
    initialFormValues();
    setModalVisible(true);
  };

  const handleCreate = async (values: any) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    try {
      const result = await createWorkspace({
        instanceId: values.instanceId,
        instanceName: values.instanceName,
        workspace: values.workspace,
        namespace: values.namespace,
      });
      if (result === 0) {
        message.warning('工作空间已存在，未创建新记录');
      } else {
        message.success('工作空间创建成功');
      }
      reloadTableData();
      setModalVisible(false);
    } catch (error) {
      message.error('创建失败');
    }
  };

  const columns: ProColumns<API.FlinkWorkspaceResponseDTO>[] = [
    {
      search: false,
      title: '实例ID',
      dataIndex: 'instanceId',
      width: 180,
      ellipsis: true,
      render: (text) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            background: '#f0f9ff',
            color: '#0369a1',
            padding: '2px 6px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '600',
            border: '1px solid #bae6fd'
          }}>
            ID
          </span>
          <span style={{ 
            fontWeight: '500', 
            color: '#1f2937',
            fontSize: '12px',
            fontFamily: 'Monaco, Consolas, monospace'
          }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      title: '实例名称',
      dataIndex: 'instanceName',
      width: 150,
      render: (text) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ 
            fontWeight: '600', 
            color: '#1f2937',
            fontSize: '13px'
          }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      search: false,
      title: '工作空间ID',
      dataIndex: 'workspace',
      width: 200,
      ellipsis: true,
      render: (text) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '14px' }}>🏢</span>
          <span style={{ 
            fontWeight: '500', 
            color: '#262626',
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '12px'
          }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      search: false,
      title: '命名空间',
      dataIndex: 'namespace',
      width: 150,
      render: (text) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{
            background: '#f0f2f5',
            color: '#1890ff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 'bold',
            border: '1px solid #d9d9d9'
          }}>
            NS
          </span>
          <span style={{ 
            fontWeight: '500', 
            color: '#262626',
            fontFamily: 'Monaco, Consolas, monospace'
          }}>
            {text}
          </span>
        </div>
      ),
    },
    {
      search: false,
      title: '创建时间',
      dataIndex: 'createTime',
      width: 150,
      render: (_, record) => moment(record.createTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      search: false,
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 150,
      render: (_, record) => moment(record.updateTime).format('YYYY-MM-DD HH:mm:ss'),
    },
  ];

  return (
    <>
      <ProTable<API.FlinkWorkspaceResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={async (params: any) => {
          try {
            const response = await getWorkspacePaging({
              searchInstanceName: params.instanceName,
              pageNum: params.current,
              pageSize: params.pageSize,
            });
            
            // 处理后端返回的分页数据结构
            const result = response?.data || response;
            const dataList = result?.list || result?.dataList || result?.data || [];
            const total = result?.total || result?.totalCount || 0;
            
            console.log('API响应数据:', response);
            console.log('解析后的数据列表:', dataList);
            console.log('总数:', total);
            
            return {
              data: Array.isArray(dataList) ? dataList : [],
              success: true,
              total: total,
            };
          } catch (error) {
            console.error('获取工作空间数据失败:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        scroll={{ x: 1200 }}
        search={{
          labelWidth: 'auto',
          collapsed: false,
        }}
        toolBarRender={() => [
          <Button 
            type="primary" 
            key="primary" 
            onClick={openCreateModal}
            style={{
              borderRadius: '8px',
              height: '36px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none'
            }}
          >
            <PlusOutlined /> 🏢 新增工作空间
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
        onFinish={handleCreate}
      >
        <ProFormText
          name="instanceId"
          label="实例ID"
          placeholder="请输入实例ID，如：f-cn-omn40h9ip08"
          rules={[{ required: true, message: '请输入实例ID' }]}
        />

        <ProFormText
          name="instanceName"
          label="实例名称"
          placeholder="请输入实例名称，如：flink-qa"
          rules={[{ required: true, message: '请输入实例名称' }]}
        />

        <ProFormText
          name="workspace"
          label="工作空间ID"
          placeholder="请输入工作空间ID，如：a3531610304f47"
          rules={[{ required: true, message: '请输入工作空间ID' }]}
        />

        <ProFormText
          name="namespace"
          label="命名空间"
          placeholder="请输入命名空间，如：test"
          rules={[{ required: true, message: '请输入命名空间' }]}
        />
      </ModalForm>
    </>
  );
};

export default FlinkWorkspace; 