import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import { Button, Form, message, Tag, Popconfirm, Space, Switch } from 'antd';
import { ModalForm, ProFormText, ProFormSelect } from '@ant-design/pro-form';
import React, { useRef, useState, useEffect } from 'react';
import {
  getVariablePaging,
  publishVariable,
  deleteVariable,
} from '@/services/flink-management/variable-api';
import { getWorkspaceNamespaceMap } from '@/services/flink-management/api';
import { checkUserAuthority } from '@/global';
import moment from 'moment';

const FlinkVariable: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [workspaceMap, setWorkspaceMap] = useState<API.WorkspaceNamespaceMapDTO>({});
  const [selectedInstance, setSelectedInstance] = useState<string>('');

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  // 表单值保存的localStorage key
  const VARIABLE_FORM_VALUES_KEY = 'flink_variable_form_values';

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  // 加载工作空间映射
  useEffect(() => {
    loadWorkspaceMap();
  }, []);

  const loadWorkspaceMap = async () => {
    try {
      const data = await getWorkspaceNamespaceMap();
      setWorkspaceMap(data);
    } catch (error) {
      message.error('加载工作空间信息失败');
    }
  };

  // 保存表单值到localStorage（排除变量值）
  const saveFormValues = (values: any) => {
    try {
      const valuesToSave = { ...values };
      delete valuesToSave.variableValue; // 排除变量值
      localStorage.setItem(VARIABLE_FORM_VALUES_KEY, JSON.stringify(valuesToSave));
    } catch (error) {
      console.error('保存表单值失败:', error);
    }
  };

  // 从localStorage恢复表单值
  const loadSavedFormValues = () => {
    try {
      const savedValues = localStorage.getItem(VARIABLE_FORM_VALUES_KEY);
      if (savedValues) {
        const parsedValues = JSON.parse(savedValues);
        form.setFieldsValue(parsedValues);
        if (parsedValues.instanceName) {
          setSelectedInstance(parsedValues.instanceName);
        }
        return parsedValues;
      }
    } catch (error) {
      console.error('加载保存的表单值失败:', error);
    }
    return null;
  };

  const initialFormValues = () => {
    form.resetFields();
    setSelectedInstance('');
    
    // 设置默认值
    const defaultValues = {
      isEncrypted: false, // 默认不加密
    };
    
    // 加载之前保存的值（除变量值外）
    const savedValues = loadSavedFormValues();
    
    // 合并默认值和保存的值
    const finalValues = { ...defaultValues, ...(savedValues || {}) };
    form.setFieldsValue(finalValues);
  };

  const openPublishModal = () => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setModalTitle('变量发布');
    initialFormValues();
    setModalVisible(true);
  };

  const handlePublish = async (values: any) => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    try {
      // 保存表单值（除了变量值）
      saveFormValues(values);
      
      await publishVariable({
        type: values.isEncrypted ? 1 : 2, // 加密时type=1，不加密时type=2
        name: values.variableName,
        value: values.variableValue,
        namespace: values.namespace,
        instanceName: values.instanceName,
      });
      message.success('变量发布成功');
      reloadTableData();
      setModalVisible(false);
    } catch (error) {
      message.error('变量发布失败');
    }
  };

  const handleDelete = async (record: API.FlinkVariablePublishViewDTO) => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    try {
      await deleteVariable(record.id);
      message.success('变量删除成功');
      reloadTableData();
    } catch (error) {
      message.error('变量删除失败');
    }
  };

  const getPublishStateTag = (publishState: number) => {
    const stateMap: { [key: number]: { color: string; text: string } } = {
      1: { color: 'processing', text: '发布中' },
      2: { color: 'red', text: '发布失败' },
      3: { color: 'green', text: '发布成功' },
    };
    const stateInfo = stateMap[publishState] || { color: 'default', text: '未知状态' };
    return (
      <Tag color={stateInfo.color} style={{ fontSize: '12px', fontWeight: 'bold' }}>
        {stateInfo.text}
      </Tag>
    );
  };

  const getTypeTag = (type: number) => {
    return type === 1 ? (
      <Tag color="orange" style={{ fontSize: '12px', fontWeight: 'bold' }}>
        加密
      </Tag>
    ) : (
      <Tag color="blue" style={{ fontSize: '12px', fontWeight: 'bold' }}>
        普通
      </Tag>
    );
  };

  const columns: ProColumns<API.FlinkVariablePublishViewDTO>[] = [
    {
      title: '变量名',
      dataIndex: 'variableName',
      width: 160,
      ellipsis: true,
      copyable: true,
    },
    {
      search: false,
      title: '变量值',
      dataIndex: 'variableValue',
      width: 150,
      ellipsis: true,
      render: (text, record) => {
        // 如果是加密变量，显示掩码
        const displayValue = record.type === 1 ? '******' : text;
        
        return (
          <span style={{ 
            fontFamily: 'Monaco, Consolas, monospace',
            fontSize: '12px',
            color: record.type === 1 ? '#999' : '#333'
          }}>
            {displayValue}
          </span>
        );
      },
      copyable: false, // 禁用复制功能，加密变量不能复制
    },
    {
      search: false,
      title: '变量类型',
      dataIndex: 'type',
      width: 90,
      render: (_, record) => getTypeTag(record.type),
    },
    {
      search: false,
      title: '发布状态',
      dataIndex: 'publishState',
      width: 90,
      render: (_, record) => getPublishStateTag(record.publishState),
    },
    {
      title: '实例名称',
      dataIndex: 'instanceName',
      width: 130,
      render: (text) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              fontWeight: '600',
              color: '#1f2937',
              fontSize: '13px',
            }}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      width: 120,
      render: (text) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              background: '#f0f2f5',
              color: '#1890ff',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 'bold',
              border: '1px solid #d9d9d9',
            }}
          >
            NS
          </span>
          <span
            style={{
              fontWeight: '500',
              color: '#262626',
              fontFamily: 'Monaco, Consolas, monospace',
            }}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      search: false,
      title: '创建时间',
      dataIndex: 'createTime',
      width: 140,
      render: (_, record) => moment(record.createTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      search: false,
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 140,
      render: (_, record) => moment(record.updateTime).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      search: false,
      title: '操作',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Space size={8}>
          <Popconfirm
            title="确认删除此变量？删除后将无法恢复，请谨慎操作"
            onConfirm={() => handleDelete(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button
              size="small"
              style={{
                fontSize: '14px',
                borderRadius: '4px',
                backgroundColor: '#ff4d4f',
                borderColor: '#ff4d4f',
                color: '#fff',
                border: '1px solid #ff4d4f',
                fontWeight: 'normal',
              }}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<API.FlinkVariablePublishViewDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={async (params: any) => {
          try {
            const response = await getVariablePaging({
              searchVariableName: params.variableName,
              instanceName: params.instanceName,
              namespace: params.namespace,
              pageNum: params.current,
              pageSize: params.pageSize,
            });

            // 处理后端返回的分页数据结构
            const result = response?.data || response;
            const dataList = result?.list || result?.dataList || result?.data || [];
            const total = result?.total || result?.totalCount || 0;

            console.log('变量API响应数据:', response);
            console.log('解析后的数据列表:', dataList);
            console.log('总数:', total);

            return {
              data: Array.isArray(dataList) ? dataList : [],
              success: true,
              total: total,
            };
          } catch (error) {
            console.error('获取变量数据失败:', error);
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
            onClick={openPublishModal}
            size="small"
            style={{
              fontSize: '14px',
              borderRadius: '4px',
              background: '#1677ff',
              border: 'none',
              fontWeight: 'normal',
            }}
          >
            变量发布
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
        onFinish={handlePublish}
      >
        <ProFormSelect
          name="instanceName"
          label="Flink实例名称"
          placeholder="请选择Flink实例"
          rules={[{ required: true, message: '请选择Flink实例' }]}
          options={Object.keys(workspaceMap).map((instance) => ({
            label: instance,
            value: instance,
          }))}
          fieldProps={{
            onChange: (value) => {
              setSelectedInstance(value);
              form.setFieldsValue({ namespace: undefined });
            },
          }}
        />

        <ProFormSelect
          name="namespace"
          label="Flink命名空间"
          placeholder="请选择命名空间"
          rules={[{ required: true, message: '请选择命名空间' }]}
          options={(workspaceMap[selectedInstance] || []).map((namespace) => ({
            label: namespace,
            value: namespace,
          }))}
          dependencies={['instanceName']}
        />

        <ProFormText
          name="variableName"
          label="变量名"
          placeholder="请输入变量名，如：mysql_third_host"
          rules={[{ required: true, message: '请输入变量名' }]}
        />

        <ProFormText
          name="variableValue"
          label="变量值"
          placeholder="不填默认从Nacos获取变量值"
          rules={[]}
        />

        <Form.Item
          name="isEncrypted"
          label="是否加密"
          valuePropName="checked"
          initialValue={false}
        >
          <Switch checkedChildren="加密" unCheckedChildren="普通" style={{ width: '80px' }} />
        </Form.Item>
      </ModalForm>
    </>
  );
};

export default FlinkVariable;
 