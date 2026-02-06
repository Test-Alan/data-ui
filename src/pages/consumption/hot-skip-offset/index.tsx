import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns, ActionType } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import {
  getKafkaOffsetConfigPaging,
  listKafkaInstanceConfigIdNames,
  saveKafkaOffsetConfig,
  deleteKafkaOffsetConfigById,
  updateKafkaOffsetById,
} from '@/services/consumption-management/api';
import { Button, Form, Popconfirm, Tooltip, message, Tag } from 'antd';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-form';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { checkSuperAuthority } from '@/global';
import type { RequestOptionsType } from '@ant-design/pro-utils';
import * as _ from 'lodash';

const HotSkipOffsetPage: React.FC = () => {
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<API.KafkaOffsetConfigResponseDTO>();

  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  const tableActionRef = useRef<ActionType>();

  // 预定义的颜色数组，用于区分不同的名称（消费组/应用名等）
  const groupColors = [
    'blue', 'green', 'orange', 'red', 'purple', 
    'cyan', 'magenta', 'volcano', 'gold', 'lime',
    'geekblue', 'processing', 'success', 'warning', 'error'
  ];

  // 根据名称生成一致的颜色
  const getNameColor = (name: string) => {
    if (!name) return 'default';
    // 使用简单的哈希函数确保相同的消费组总是得到相同的颜色
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % groupColors.length;
    return groupColors[index];
  };

  const tagPillStyle: React.CSSProperties = {
    marginInlineEnd: 0,
    maxWidth: '100%',
    borderRadius: 999,
    paddingInline: 10,
    lineHeight: '22px',
  };

  const renderPillTag = (text?: string) => {
    if (!text) return '-';
    return (
      <Tag color={getNameColor(text)} style={tagPillStyle}>
        <span
          style={{
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            verticalAlign: 'bottom',
          }}
          title={text}
        >
          {text}
        </span>
      </Tag>
    );
  };

  const reloadTableData = () => {
    tableActionRef.current?.reload();
  };

  const openCreateModal = (): void => {
    if (!checkSuperAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setCreateModalVisible(true);
    createForm.resetFields();
    createForm.setFieldsValue({
      useHermesKafka: 1,
    });
  };

  const openUpdateModal = (record: API.KafkaOffsetConfigResponseDTO): void => {
    if (!checkSuperAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setCurrentRecord(record);
    setUpdateModalVisible(true);
    updateForm.resetFields();
    updateForm.setFieldsValue({
      id: record.id,
      offset: record.offset,
    });
  };

  const handleCreate = async (values: API.KafkaOffsetConfigSaveRequestDTO) => {
    try {
      const response = await saveKafkaOffsetConfig(values);
      if (response) {
        message.success('创建成功');
        setCreateModalVisible(false);
        reloadTableData();
      } else {
        message.error('创建失败');
      }
    } catch (error) {
      message.error('创建失败');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    try {
      await deleteKafkaOffsetConfigById(id);
      message.success('删除成功');
      reloadTableData();
    } catch (error) {
      console.error(error);
      message.error('删除失败');
    }
  };

  const handleUpdate = async (values: API.KafkaOffsetConfigUpdateRequestDTO) => {
    try {
      const response = await updateKafkaOffsetById(values);
      if (response) {
        message.success('更新成功');
        setUpdateModalVisible(false);
        reloadTableData();
      } else {
        message.error('更新失败');
      }
    } catch (error) {
      message.error('更新失败');
      console.error(error);
    }
  };

  const columns: ProColumns<API.KafkaOffsetConfigResponseDTO>[] = [
    {
      title: 'Kafka实例名',
      dataIndex: 'instanceName',
      width: 140,
      ellipsis: true,
      render: (_, record) => {
        return renderPillTag(record.instanceName);
      },
    },
    {
      title: '主题',
      dataIndex: 'topic',
      width: 280,
      ellipsis: true,
    },
    {
      title: '消费组',
      dataIndex: 'groupName',
      width: 200,
      ellipsis: true,
    },
    {
      title: '分区号',
      dataIndex: 'partitionId',
      width: 90,
      align: 'center',
      search: false,
    },
    {
      title: '偏移量',
      dataIndex: 'offset',
      width: 120,
      search: false,
      align: 'right',
      render: (text) => (
        <span style={{ fontFamily: 'monospace' }}>{text}</span>
      ),
    },
    {
      title: '应用名称',
      dataIndex: 'appName',
      width: 150,
      ellipsis: true,
      render: (_, record) => {
        return renderPillTag(record.appName);
      },
    },
    {
      title: (
        <Tooltip title="是否使用HermesKafka框架">
          <span>使用内部框架</span>
        </Tooltip>
      ),
      dataIndex: 'useHermesKafka',
      width: 120,
      align: 'center',
      valueType: 'select',
      valueEnum: {
        1: { text: '是' },
        0: { text: '否' },
      },
      render: (_, record) => {
        const v = record.useHermesKafka;
        if (v === 1) return <Tag color="success" style={tagPillStyle}>是</Tag>;
        if (v === 0) return <Tag style={tagPillStyle}>否</Tag>;
        return '-';
      },
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      search: false,
      width: 210,
      fixed: 'right' as const,
      render: (_, record) => {
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
            <Button
              key="edit"
              type="link"
              size="small"
              icon={<EditOutlined />}
              style={{ paddingInline: 4 }}
              onClick={() => openUpdateModal(record)}
            >
              编辑偏移量
            </Button>
            <Popconfirm
              key="delete"
              title="确认要删除这条配置吗?"
              onConfirm={async () => handleDelete(record.id)}
              okText="是"
              cancelText="否"
            >
              <Button size="small" type="link" danger icon={<DeleteOutlined />} style={{ paddingInline: 4 }}>
                删除
              </Button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: '热跳点位',
        subTitle: 'Kafka偏移量配置管理，支持热点数据快速跳转',
        breadcrumb: {
          routes: [
            {
              path: '/consumption-management/',
              breadcrumbName: '消费管理',
            },
            {
              path: '/consumption-management/hot-skip-offset/',
              breadcrumbName: '热跳点位',
            },
          ],
        },
      }}
    >
      <ProTable<API.KafkaOffsetConfigResponseDTO>
        actionRef={tableActionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        scroll={{ x: 1400 }}
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            新建配置
          </Button>,
        ]}
        request={getKafkaOffsetConfigPaging}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
        }}
      />

      <ModalForm
        title="新建Kafka偏移量配置"
        visible={createModalVisible}
        form={createForm}
        autoFocusFirstInput
        modalProps={{
          destroyOnClose: true,
          onCancel: () => setCreateModalVisible(false),
        }}
        submitTimeout={2000}
        onFinish={handleCreate}
        width={600}
      >
        <ProFormSelect
          name="kicId"
          label="Kafka实例"
          placeholder="请选择Kafka实例"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listKafkaInstanceConfigIdNames();
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
              message: '请选择Kafka实例',
            },
          ]}
        />
        <ProFormText
          name="groupName"
          label="消费组"
          placeholder="请输入消费组名称"
          rules={[
            {
              required: true,
              message: '请输入消费组名称',
            },
          ]}
        />
        <ProFormText
          name="topic"
          label="主题"
          placeholder="请输入主题名称"
          rules={[
            {
              required: true,
              message: '请输入主题名称',
            },
          ]}
        />
        <ProFormDigit
          name="partitionId"
          label="分区号"
          placeholder="请输入分区号"
          min={0}
          rules={[
            {
              required: true,
              message: '请输入分区号',
            },
          ]}
        />
        <ProFormDigit
          name="offset"
          label="偏移量"
          placeholder="请输入偏移量"
          min={0}
          rules={[
            {
              required: true,
              message: '请输入偏移量',
            },
          ]}
        />
        <ProFormSelect
          name="useHermesKafka"
          label="是否使用HermesKafka框架"
          placeholder="请选择"
          initialValue={1}
          options={[
            { label: '是', value: 1 },
            { label: '否', value: 0 },
          ]}
          rules={[
            {
              required: true,
              message: '请选择是否使用HermesKafka',
            },
          ]}
        />
      </ModalForm>

      <ModalForm
        title="更新偏移量"
        visible={updateModalVisible}
        form={updateForm}
        autoFocusFirstInput
        modalProps={{
          destroyOnClose: true,
          onCancel: () => setUpdateModalVisible(false),
        }}
        submitTimeout={2000}
        onFinish={handleUpdate}
        width={400}
      >
        <ProFormDigit
          name="id"
          hidden
        />
        <div style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}>
          <p><strong>kafka实例:</strong> {currentRecord?.instanceName}</p>
          <p><strong>消费组:</strong> {currentRecord?.groupName}</p>
          <p><strong>主题:</strong> {currentRecord?.topic}</p>
          <p><strong>分区号:</strong> {currentRecord?.partitionId}</p>
          <p><strong>当前偏移量:</strong> <span style={{ fontFamily: 'monospace', color: '#1890ff' }}>{currentRecord?.offset}</span></p>
        </div>
        <ProFormDigit
          name="offset"
          label="新偏移量"
          placeholder="请输入新的偏移量"
          min={0}
          rules={[
            {
              required: true,
              message: '请输入新的偏移量',
            },
          ]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default HotSkipOffsetPage;
