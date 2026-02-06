import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import {
  listJdbcDatasourceIdNames,
  getSyncTablesPaging,
  saveSyncTable,
  deleteSyncTable,
  enableSyncTable,
  disableSyncTable,
  listMqIdNames,
  updateSyncTable,
  listMemberIdNames,
  batchImportCreateSyncTask,
} from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, Switch, message, Tag, Upload } from 'antd';
import type { UploadProps } from 'antd';
import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import type { RequestOptionsType } from '@ant-design/pro-utils';
import * as _ from 'lodash';
import { checkSuperAuthority, checkUserAuthority } from '@/global';

const Reader: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [updateModal, setUpdateModal] = useState<boolean>(false);
  const [schemaNameReadonly, setSchemaNameReadonly] = useState<boolean>(false);
  const [tableNameReadonly, setTableNameReadonly] = useState<boolean>(false);
  const [mqIdReadonly, setMqIdReadonlyReadonly] = useState<boolean>(false);
  const [datasourceIdReadonly, setDatasourceIdReadonly] = useState<boolean>(false);
  const [lastFormValues, setLastFormValues] = useState<Partial<API.SaveSyncTableRequestDTO>>({});
  const [form] = Form.useForm();
  const createFormRef = useRef<any>();
  const tableActionRef = useRef<any>();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const resetMqId = () => {
    form.setFieldsValue({
      mqId: null,
    });
  };

  const initialFormValues = (entity?: API.SyncTableResponseDTO) => {
    form.resetFields();
    form.setFieldsValue(entity);
  };

  const initialNewFormValues = () => {
    const memoryValues = { ...lastFormValues };
    delete memoryValues.tableName;
    form.resetFields();
    form.setFieldsValue(memoryValues);
  };

  const openSaveSyncTableModal = () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('保存读取器');
    setUpdateModal(false);
    setSchemaNameReadonly(false);
    setTableNameReadonly(false);
    setDatasourceIdReadonly(false);
    setMqIdReadonlyReadonly(false);
    initialNewFormValues();
    setModalVisible(true);
  };

  const openUpdateSyncTableModal = (entity: API.SyncTableResponseDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('修改读取器');
    initialFormValues(entity);
    setSchemaNameReadonly(true);
    setTableNameReadonly(true);
    setDatasourceIdReadonly(true);
    setUpdateModal(true);
    setModalVisible(true);
  };

  const handleSaveSyncTable = async (value: API.SaveSyncTableRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await saveSyncTable(value);
    // 创建内存值副本，排除 id 和 tableName 字段用于下次新建
    const { id, tableName, ...memoryValues } = value;
    setLastFormValues(memoryValues);
    reloadTableData();
    setModalVisible(false);
  };

  const handleUpdateSyncTable = async (id: number, value: API.SaveSyncTableRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await updateSyncTable(id, value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDeleteSyncTable = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteSyncTable(id);
    reloadTableData();
  };

  const handleEnableSyncTable = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await enableSyncTable(id);
    reloadTableData();
  };

  const handleDisableSyncTable = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await disableSyncTable(id);
    reloadTableData();
  };

  const handleBatchImport = async (file: File) => {
    if (!checkSuperAuthority()) {
      message.warning('当前用户没有权限操作');
      return false;
    }
    try {
      const response = await batchImportCreateSyncTask(file);
      if (response.code === 0) {
        message.success(`导入成功，共创建 ${response.data} 条同步任务`);
        reloadTableData();
      } else {
        message.error(response.errorMessage || '导入失败');
      }
    } catch (error: any) {
      console.error('导入失败:', error);
      message.error(error?.message || '导入失败，请检查文件格式');
    }
    return false; // 阻止默认上传行为
  };

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx',
    showUploadList: false,
    beforeUpload: handleBatchImport,
  };

  const options = [
    {
      label: '是',
      value: 1,
    },
    {
      label: '否',
      value: 0,
    },
  ];

  const columns: ProColumns<API.SyncTableResponseDTO>[] = [
    {
      search: false,
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '数据源名',
      dataIndex: 'datasourceName',
    },
    {
      title: '数据库名',
      dataIndex: 'schemaName',
    },
    {
      title: '数据表名',
      dataIndex: 'tableName',
    },
    {
      title: '使用者',
      dataIndex: 'memberNames',
      render: (dom, entity) => {
        return entity.memberNames
          ? entity.memberNames.split(',').map((name: string, index: number) => (
              <span
                key={`member-${entity.id}-${name.trim()}`}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#e6f7ff',
                  color: '#1890ff',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  marginBottom: '4px',
                  marginRight: '4px',
                  fontSize: '14px',
                  fontWeight: 'bold', // 加粗字体
                  lineHeight: '1.5',
                }}
              >
                {name.trim()}
              </span>
            ))
          : '-';
      },
    },
    {
      title: '是否转发',
      dataIndex: 'relayFlag',
      search: false,
      render: (dom, entity) => {
        return (
          <>
            {entity.relayFlag == 1 ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>是</span>
            ) : (
              <span style={{ color: 'red', fontWeight: 'bold' }}>否</span>
            )}
          </>
        );
      },
    },
    {
      title: '转发的MQ',
      dataIndex: 'mqNames',
      search: false,
      render: (dom, entity) => {
        return entity.mqNames
          ? entity.mqNames.split(',').map((name: string, index: number) => (
              <span
                key={`mq-${entity.id}-${name.trim()}`}
                style={{
                  display: 'inline-block',
                  backgroundColor: '#f6ffed', // 浅绿色背景
                  color: '#52c41a', // 深绿色字体
                  borderRadius: '4px',
                  padding: '4px 10px',
                  marginBottom: '4px',
                  marginRight: '4px',
                  fontSize: '13px', // 字体稍微小一点
                  fontWeight: '500', // 正常粗细
                  lineHeight: '1.5',
                }}
              >
                {name.trim()}
              </span>
            ))
          : '-';
      },
    },
    {
      title: '批量大小',
      dataIndex: 'batchSize',
      search: false,
    },
    {
      title: '启用状态',
      dataIndex: 'enableStatus',
      initialValue: '',
      valueEnum: {
        '0': { text: '禁用' },
        '1': { text: '启用' },
        '': { text: '全部' },
      },
      render: (dom, entity) => {
        return (
          <Switch
            checkedChildren="启用"
            unCheckedChildren="禁用"
            size={'small'}
            checked={entity.enableStatus == 1}
            onChange={async (checked: boolean) => {
              if (checked) {
                await handleEnableSyncTable(entity.id);
              } else {
                await handleDisableSyncTable(entity.id);
              }
            }}
          />
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
            <Button type="primary" size="small" onClick={() => openUpdateSyncTableModal(entity)}>
              修改
            </Button>
            <Popconfirm
              title={`确认要删除这条读取器吗?`}
              onConfirm={async () => handleDeleteSyncTable(entity.id)}
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
              path: '/sync/table-reader/',
              breadcrumbName: '数据读取器',
            },
          ],
        },
      }}
    >
      <ProTable<API.SyncTableResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params: API.PageParams) => getSyncTablesPaging(params)}
        toolBarRender={() => [
          <Upload {...uploadProps} key="import">
            <Button icon={<UploadOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>
              导入
            </Button>
          </Upload>,
          <Button type="primary" key="primary" onClick={openSaveSyncTableModal}>
            <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>,
        ]}
      />
      <ModalForm
        modalProps={{ maskClosable: false, destroyOnClose: true }}
        form={form}
        formRef={createFormRef}
        title={modalTitle}
        width={640}
        visible={modalVisible}
        onVisibleChange={setModalVisible}
        onFinish={async (value: any) =>
          updateModal ? handleUpdateSyncTable(value.id, value) : handleSaveSyncTable(value)
        }
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormSelect
          name="datasourceId"
          label="数据源"
          placeholder="请选择数据源"
          showSearch
          required={true}
          readonly={datasourceIdReadonly}
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
          name="schemaName"
          label="数据库名"
          placeholder="数据库名"
          readonly={schemaNameReadonly}
        />
        <ProFormText
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          name="tableName"
          label="数据表名"
          placeholder="数据表名"
          readonly={tableNameReadonly}
        />
        <ProFormSelect
          name="relayFlag"
          label="是否转发"
          fieldProps={{
            options,
            onChange: (val: any) => {
              setMqIdReadonlyReadonly(val);
              resetMqId();
            },
          }}
          placeholder="请选择是否转发"
          initialValue={0} // 默认选择 "否"
          rules={[{ required: true, message: '请选择是否转发' }]}
        />
        <ProFormSelect
          name="mqIds"
          label="转发的MQ"
          placeholder="如果需要转发，请选择至少一个MQ"
          mode="multiple"
          showSearch
          required={mqIdReadonly}
          request={async () => {
            const keyValues = await listMqIdNames();
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
              required: mqIdReadonly,
              message: '如果需要转发，请选择至少一个MQ',
            },
          ]}
        />
        <ProFormDigit
          name="batchSize"
          label="批量大小(比如舆情又大文本，可以设置为1)"
          placeholder="批量大小"
          initialValue={10}
          required={true}
        />
        <ProFormSelect
          name="memberIds"
          label="使用者"
          placeholder="请选择使用者"
          mode="multiple"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listMemberIdNames();
            return _.map(keyValues, (x) => {
              const item: RequestOptionsType = {
                label: x.value,
                value: x.key,
              };
              return item;
            });
          }}
          rules={[{ required: true, message: '请选择至少一个使用者' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default Reader;
