import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import {
  getClientTablePaging,
  saveClientTable,
  deleteClientTable,
  listClientInfoIdNames,
  listSyncTableIdNames,
  upgradeBinlog,
  getTableBinlogPositionByTime,
  openHashSync,
  listHashFieldNames,
  getClientInfo,
  listJdbcTargetDatasourceIdNames,
  batchImportCreateSyncTask,
} from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, message, Upload } from 'antd';
import type { UploadProps } from 'antd';
import {
  ModalForm,
  ProFormDateTimePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import * as _ from 'lodash';
import type { RequestOptionsType } from '@ant-design/pro-utils';
import { checkSuperAuthority } from '@/global';

const Page: React.FC = () => {
  const [saveClientTableModalVisible, setSaveClientTableModalVisible] = useState<boolean>(false);
  const [saveClientTableModalTitle, setSaveClientTableModalTitle] = useState<string>();
  const [upgradeBinlogModalVisible, setUpgradeBinlogModalVisible] = useState<boolean>(false);
  const [upgradeBinlogModalTitle, setUpgradeBinlogModalTitle] = useState<string>();
  const [openHashSyncModalTitle, setOpenHashSyncModalTitle] = useState<string>();
  const [openHashSyncModalVisible, setOpenHashSyncModalVisible] = useState<boolean>(false);
  const [selectedClientType, setSelectedClientType] = useState<number | undefined>(undefined);
  const [selectedClientDatasourceId, setSelectedClientDatasourceId] = useState<number | undefined>(undefined);
  const [showDatasourceSelect, setShowDatasourceSelect] = useState<boolean>(false);
  const [availableDatasourceIds, setAvailableDatasourceIds] = useState<number[]>([]);

  const [saveForm] = Form.useForm();
  const [upgradeForm] = Form.useForm();
  const createFormRef = useRef();
  const upgradeFormRef = useRef();
  const tableActionRef = useRef();
  const [openHashSyncForm] = Form.useForm();
  const openHashSyncFormRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const initialSaveClientTableFormValues = (entity?: API.ClientTableResponseDTO) => {
    saveForm.resetFields();
    saveForm.setFieldsValue(entity);
  };

  const initUpgradeBinlogFormValues = (entity?: { id: number }) => {
    upgradeForm.resetFields();
    upgradeForm.setFieldsValue(entity);
  };

  const initOpenHashSyncFormValues = (entity?: { id: number }) => {
    openHashSyncForm.resetFields();
    openHashSyncForm.setFieldsValue(entity);
  };

  const openSaveClientTableModal = () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setSaveClientTableModalTitle('保存同步服务写入器');
    initialSaveClientTableFormValues(undefined);
    setSelectedClientType(undefined);
    setSelectedClientDatasourceId(undefined);
    setShowDatasourceSelect(false);
    setAvailableDatasourceIds([]);
    setSaveClientTableModalVisible(true);
  };

  const handleClientChange = async (clientId: number) => {
    try {
      // 获取客户端详细信息
      const clientInfo = await getClientInfo(clientId);
      if (clientInfo) {
        setSelectedClientType(clientInfo.type);
        
        if (clientInfo.type === 1) {
          // 对外类型，自动填充数据源ID
          setSelectedClientDatasourceId(clientInfo.targetDatasourceId);
          saveForm.setFieldsValue({ targetDatasourceId: clientInfo.targetDatasourceId });
          setShowDatasourceSelect(false);
          setAvailableDatasourceIds([]);
        } else if (clientInfo.type === 2) {
          // 对内类型，显示数据源选择框，并解析可用的数据源ID列表
          if (clientInfo.targetDatasourceIds) {
            const datasourceIds = clientInfo.targetDatasourceIds
              .split(',')
              .map(id => parseInt(id.trim()))
              .filter(id => !isNaN(id));
            setAvailableDatasourceIds(datasourceIds);
          } else {
            setAvailableDatasourceIds([]);
          }
          setShowDatasourceSelect(true);
          setSelectedClientDatasourceId(undefined);
          saveForm.setFieldsValue({ targetDatasourceId: undefined });
        }
      }
    } catch (error) {
      console.error('获取客户端信息失败:', error);
      message.error('获取客户端信息失败');
    }
  };

  const handleSaveClientTable = async (value: API.SaveClientTableRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await saveClientTable(value);
    reloadTableData();
    setSaveClientTableModalVisible(false);
  };

  const handleDeleteClientTable = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteClientTable(id);
    reloadTableData();
  };

  const openUpgradeBinlogModal = (entity: API.ClientTableResponseDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setUpgradeBinlogModalTitle('重置消费位置');
    initUpgradeBinlogFormValues(entity);
    setUpgradeBinlogModalVisible(true);
  };

  const handleUpgradeBinlog = async (value: { id: number; binlogPosition: number }) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await upgradeBinlog({
      clientTableId: value.id,
      binlogPosition: value.binlogPosition,
    });
    reloadTableData();
    setUpgradeBinlogModalVisible(false);
  };

  const openHashSyncModal = (entity: API.ClientTableResponseDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setOpenHashSyncModalTitle('开启Hash同步');
    initOpenHashSyncFormValues(entity);
    setOpenHashSyncModalVisible(true);
  };

  const handleOpenHashSync = async (value: { id: number; hashFieldName: string }) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await openHashSync({
      clientTableId: value.id,
      hashFieldName: value.hashFieldName,
    });
    reloadTableData();
    setOpenHashSyncModalVisible(false);
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

  const columns: ProColumns<API.ClientTableResponseDTO>[] = [
    {
      title: '服务名',
      dataIndex: 'clientName',
      width: 120,
    },
    {
      title: '服务启用状态',
      dataIndex: 'clientInfoEnableStatus',
      initialValue: '',
      search: false,
      width: 120,
      valueEnum: {
        '0': { text: '禁用' },
        '1': { text: '启用' },
        '': { text: '全部' },
      },
      render: (dom, entity) => {
        return (
          <>
            {entity.clientInfoEnableStatus == 1 ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>启用</span>
            ) : (
              <span style={{ color: 'red', fontWeight: 'bold' }}>禁用</span>
            )}
          </>
        );
      },
    },
    {
      title: '读取器ID',
      dataIndex: 'syncTableId',
      width: 100,
    },
    {
      title: '目标数据源ID',
      dataIndex: 'targetDatasourceId',
      search: false,
      width: 120,
    },
    {
      title: '源库名',
      dataIndex: 'schemaName',
      width: 140,
      ellipsis: { showTitle: true },
    },
    {
      title: '源表名',
      dataIndex: 'tableName',
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      title: '目标库名',
      dataIndex: 'targetSchemaName',
      search: false,
      width: 140,
      ellipsis: { showTitle: true },
    },
    {
      title: '目标表名',
      dataIndex: 'targetTableName',
      search: false,
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      search: false,
      title: '源表启用状态',
      dataIndex: 'enableStatus',
      width: 120,
      render: (dom, entity) => {
        return (
          <>
            {entity.syncTableEnableStatus == 1 ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>启用</span>
            ) : (
              <span style={{ color: 'red', fontWeight: 'bold' }}>禁用</span>
            )}
          </>
        );
      },
    },
    {
      title: '消费版本',
      dataIndex: 'binlogVersion',
      search: false,
      width: 100,
    },
    {
      title: '消费位置',
      dataIndex: 'binlogPosition',
      search: false,
      width: 120,
    },
    {
      title: '同步模式',
      dataIndex: 'syncModeName',
      search: false,
      width: 100,
    },
    {
      title: '增量同步',
      dataIndex: 'enableIncremental',
      width: 100,
      valueEnum: {
        '0': { text: '未开启' },
        '1': { text: '已开启' },
      },
      render: (dom, entity) => {
        return (
          <>
            {entity.enableIncremental == 1 ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>已开启</span>
            ) : (
              <span style={{ color: 'red', fontWeight: 'bold' }}>未开启</span>
            )}
          </>
        );
      },
    },
    {
      search: false,
      title: '操作',
      width: 280,
      fixed: 'right' as const,
      render: (dom, entity) => {
        return (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'flex-start', 
              gap: '6px', 
              flexWrap: 'wrap',
              minHeight: '32px',
              minWidth: '240px',
            }}
          >
              <Button type="primary" size="small" onClick={() => openUpgradeBinlogModal(entity)}>
                重置位置
              </Button>
              <Popconfirm
                title="确认要删除这条客户表吗?"
                onConfirm={async () => handleDeleteClientTable(entity.id)}
                okText="是"
                cancelText="否"
              >
                <Button size="small" style={{ backgroundColor: '#ff4d4f', borderColor: '#ff4d4f', color: '#fff', border: '1px solid #ff4d4f' }}>
                  删除
                </Button>
              </Popconfirm>
              <Button
                type="primary"
                size="small"
                disabled={!!entity.hashFieldName}
                onClick={() => {
                  if (!entity.hashFieldName) {
                    openHashSyncModal(entity);
                  }
                }}
              >
                {entity.hashFieldName ? '已开启' : '开启hash同步'}
              </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="client-table-page">
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
                path: '/sync/table-writer/',
                breadcrumbName: '数据写入器',
              },
            ],
          },
        }}
      >
      <ProTable<API.ClientTableResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => getClientTablePaging(params)}
        scroll={{ x: 1400 }}
        toolBarRender={() => [
          <Upload {...uploadProps} key="import">
            <Button icon={<UploadOutlined />} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: '#fff' }}>
              导入
            </Button>
          </Upload>,
          <Button type="primary" key="primary" onClick={openSaveClientTableModal}>
            <PlusOutlined /> <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>,
        ]}
      />
      <ModalForm
        modalProps={{ maskClosable: false, destroyOnClose: true }}
        form={saveForm}
        formRef={createFormRef}
        title={saveClientTableModalTitle}
        width={640}
        visible={saveClientTableModalVisible}
        onVisibleChange={setSaveClientTableModalVisible}
        onFinish={async (value) => handleSaveClientTable(value)}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormSelect
          name="clientId"
          label="同步服务"
          placeholder="请选择同步服务"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listClientInfoIdNames();
            return _.map(keyValues, (x) => {
              const item: RequestOptionsType = {
                label: x.value,
                value: x.key,
              };
              return item;
            });
          }}
          fieldProps={{
            onChange: (value: number) => {
              handleClientChange(value);
            },
          }}
          rules={[
            {
              required: true,
            },
          ]}
        />
        {showDatasourceSelect && (
          <ProFormSelect
            name="targetDatasourceId"
            label="目标数据源"
            placeholder="请选择目标数据源"
            showSearch
            required={true}
            request={async () => {
              const keyValues = await listJdbcTargetDatasourceIdNames();
              // 只返回该客户端绑定的数据源
              return _.map(keyValues, (x) => {
                const item: RequestOptionsType = {
                  label: x.value,
                  value: x.key,
                };
                return item;
              }).filter(item => availableDatasourceIds.includes(item.value as number));
            }}
            rules={[
              {
                required: true,
              },
            ]}
          />
        )}
        {!showDatasourceSelect && selectedClientDatasourceId && (
          <ProFormDigit 
            name="targetDatasourceId" 
            label="目标数据源ID" 
            readonly={true}
            placeholder="自动填充"
          />
        )}
        <ProFormSelect
          name="syncTableIds"
          label="读取器"
          placeholder="请选择读取器"
          mode="multiple"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listSyncTableIdNames();
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
          name="targetSchemaName"
          label="目标数据库名"
          placeholder="目标数据库名"
        />
        <ProFormText
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          name="targetTableName"
          label="目标表名"
          placeholder="目标表名"
        />
      </ModalForm>
      <ModalForm
        width={640}
        form={upgradeForm}
        formRef={upgradeFormRef}
        visible={upgradeBinlogModalVisible}
        title={upgradeBinlogModalTitle}
        onVisibleChange={setUpgradeBinlogModalVisible}
        onFinish={async (value) => handleUpgradeBinlog(value)}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormText name="tableName" label="源表名" readonly={true} />
        <ProFormDateTimePicker
          name=""
          label="通过时间找位置（选择时间找最近的表位置）"
          placeholder="选择时间"
          dataFormat="yyyy-MM-dd HH:mm:ss"
          fieldProps={{
            async onChange(value, dateString) {
              const schemaName = upgradeForm.getFieldValue('schemaName');
              const tableName = upgradeForm.getFieldValue('tableName');
              const position = await getTableBinlogPositionByTime(
                schemaName,
                tableName,
                dateString,
              );
              upgradeForm.setFieldValue('binlogPosition', position);
              upgradeForm.validateFields();
            },
          }}
        />
        <ProFormDigit
          name="binlogPosition"
          required={true}
          label="重置消费位置"
          placeholder="重置消费位置"
          rules={[
            {
              required: true,
            },
          ]}
        />
      </ModalForm>

      <ModalForm
        width={640}
        form={openHashSyncForm}
        formRef={openHashSyncFormRef}
        visible={openHashSyncModalVisible}
        title={openHashSyncModalTitle}
        onVisibleChange={setOpenHashSyncModalVisible}
        onFinish={async (value) => handleOpenHashSync(value)}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormText name="tableName" label="源表名" readonly={true} />
        <ProFormSelect
          name="hashFieldName"
          label="按照Hash的字段名"
          placeholder="请选择Hash的字段名"
          showSearch
          required={true}
          request={async () => {
            const id = openHashSyncForm.getFieldValue('id');
            console.log('定位：' + id);
            if (!id) {
              return []; // 如果 id 为空，返回空数组
            }
            const keyValues = await listHashFieldNames(id);
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
              message: '请选择一个Hash字段名',
            },
          ]}
        />
      </ModalForm>
      </PageContainer>
    </div>
  );
};

export default Page;
