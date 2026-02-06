import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState, useEffect } from 'react';
import {
  getClientInfoPaging,
  saveClientInfo,
  updateClientInfo,
  enableClientInfo,
  disableClientInfo,
  listJdbcTargetDatasourceIdNames,
  enableIncremental,
} from '@/services/ext-sync/api';
import { checkUniqueIndexAndNotify, checkTableExistAndNotify } from '@/services/hermes-data-check/api';
import { Button, Form, Switch, Tooltip, message, Tag } from 'antd';
import {
  ModalForm,
  ProFormDigit,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
} from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import { ObjectUtils } from 'ts-commons';
import type { RequestOptionsType } from '@ant-design/pro-utils';
import * as _ from 'lodash';
import { checkSuperAuthority } from '@/global';

const client: React.FC = () => {
  const [downloadAppBusy] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [updateModal, setUpdateModal] = useState<boolean>(false);
  const [clientLabelReadonly, setClientLabelReadonly] = useState<boolean>(false);
  const [targetDatasourceIdReadonly, setTargetDatasourceIdReadonly] = useState<boolean>(false);
  const [typeReadonly, setTypeReadonly] = useState<boolean>(false);
  const [uniqueIndexCheckLoadingMap, setUniqueIndexCheckLoadingMap] = useState<Record<number, boolean>>({});
  const [tableExistCheckLoadingMap, setTableExistCheckLoadingMap] = useState<Record<number, boolean>>({});
  const [clientType, setClientType] = useState<number>(1);
  const [datasourceMap, setDatasourceMap] = useState<Record<number, string>>({});

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  // 加载数据源ID到名称的映射
  useEffect(() => {
    const loadDatasourceMap = async () => {
      const keyValues = await listJdbcTargetDatasourceIdNames();
      const map: Record<number, string> = {};
      keyValues?.forEach((item: any) => {
        map[item.key] = item.value;
      });
      setDatasourceMap(map);
    };
    loadDatasourceMap();
  }, []);

  const initialFormValues = (entity?: API.ClientInfoResponseDTO) => {
    form.resetFields();
    if (entity) {
      // 如果类型为2且有targetDatasourceIds，将逗号分隔的字符串转换为数组
      if (entity.type === 2 && entity.targetDatasourceIds) {
        const datasourceIdsArray = entity.targetDatasourceIds.split(',').map(id => parseInt(id.trim()));
        form.setFieldsValue({ ...entity, targetDatasourceIds: datasourceIdsArray });
      } else {
        form.setFieldsValue(entity);
      }
    } else {
      form.setFieldsValue(entity);
    }
  };

  const openSaveClientInfoModal = () => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('保存客户信息');
    initialFormValues({ type: 1 });
    setModalVisible(true);
    setUpdateModal(false);
    setClientLabelReadonly(false);
    setTargetDatasourceIdReadonly(false);
    setTypeReadonly(false);
    setClientType(1);
  };

  const handleSaveClientInfo = async (value: API.SaveClientInfoRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await saveClientInfo(value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleUpdateClientInfo = async (id: number, value: API.UpdateClientInfoRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await updateClientInfo(id, value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleEnableClientInfo = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await enableClientInfo(id);
    reloadTableData();
  };

  const handleDisableClientInfo = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await disableClientInfo(id);
    reloadTableData();
  };

  const openUpdateClientInfoModal = (entity: API.ClientInfoResponseDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    setModalTitle('修改客户信息');
    initialFormValues(entity);
    setClientLabelReadonly(true);
    // 类型不允许修改
    setTypeReadonly(true);
    // 对外类型不允许修改数据源，对内类型可以修改数据源IDs
    setTargetDatasourceIdReadonly(entity.type === 1);
    setUpdateModal(true);
    setModalVisible(true);
    setClientType(entity.type || 1);
  };

  const handleEnableIncremental = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await enableIncremental(id);
    reloadTableData();
  };

  const handleUniqueIndexCheck = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    
    try {
      setUniqueIndexCheckLoadingMap(prev => ({ ...prev, [id]: true }));
      const response = await checkUniqueIndexAndNotify(id);
      
      console.log('扫描唯一键响应:', response);
      
      const isSuccess = response && (response.success === true || response.code === 200 || response.code === 0);
      
      if (isSuccess) {
        const taskCount = response.data || 0;
        if (taskCount > 0) {
          message.success(`已提交${taskCount}个唯一索引检查任务，请等待钉钉通知结果`);
        } else {
          message.success('扫描完成，该客户端暂无配置检查表，请等待钉钉通知结果');
        }
      } else {
        console.error('扫描唯一键失败，响应详情:', response);
        const errorMsg = response?.errorMessage || '扫描唯一键失败，请重试';
        message.error(errorMsg);
      }
    } catch (error) {
      console.error('扫描唯一键异常:', error);
      message.error('扫描唯一键失败，请重试');
    } finally {
      setUniqueIndexCheckLoadingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleTableExistCheck = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    
    try {
      setTableExistCheckLoadingMap(prev => ({ ...prev, [id]: true }));
      const response = await checkTableExistAndNotify(id);
      
      console.log('检查表存在响应:', response);
      
      const isSuccess = response && (response.success === true || response.code === 200 || response.code === 0);
      
      if (isSuccess) {
        const taskCount = response.data || 0;
        if (taskCount > 0) {
          message.success(`已提交${taskCount}个表存在检查任务，请等待钉钉通知结果`);
        } else {
          message.success('检查完成，该客户端暂无配置检查表，请等待钉钉通知结果');
        }
      } else {
        console.error('检查表存在失败，响应详情:', response);
        const errorMsg = response?.errorMessage || '检查表存在失败，请重试';
        message.error(errorMsg);
      }
    } catch (error) {
      console.error('检查表存在异常:', error);
      message.error('检查表存在失败，请重试');
    } finally {
      setTableExistCheckLoadingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  const columns: ProColumns<API.ClientInfoResponseDTO>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      search: false,
    },
    {
      title: '服务名',
      dataIndex: 'clientName',
    },
    {
      title: '服务IP',
      dataIndex: 'clientIp',
      search: false,
      onCell: () => {
        return {
          style: {
            maxWidth: 200,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
          },
        };
      },
      render: (dom, entity) => {
        return (
          <>
            <Tooltip placement="topLeft" title={entity.clientIp}>
              {ObjectUtils.hasValue(entity.clientIp) ? entity.clientIp.split(';').join('; ') : ''}
            </Tooltip>
          </>
        );
      },
      width: 200,
    },
    {
      title: '服务描述',
      dataIndex: 'clientDescription',
      search: false,
    },
    {
      title: '服务标签',
      dataIndex: 'clientLabel',
      search: false,
    },
    {
      search: false,
      title: '对外数据源名',
      dataIndex: 'targetDatasourceId',
      render: (dom, entity) => {
        if (entity.type === 1 && entity.targetDatasourceId) {
          return datasourceMap[entity.targetDatasourceId] || entity.targetDatasourceId;
        }
        return '-';
      },
    },
    {
      search: false,
      title: '类型',
      dataIndex: 'type',
      render: (dom, entity) => {
        if (entity.type === 1) {
          return <Tag color="blue">对外</Tag>;
        } else if (entity.type === 2) {
          return <Tag color="green">对内</Tag>;
        }
        return '-';
      },
    },
    {
      search: false,
      title: '对内数据源名',
      dataIndex: 'targetDatasourceIds',
      render: (dom, entity) => {
        if (entity.type === 2 && entity.targetDatasourceIds) {
          const ids = entity.targetDatasourceIds.split(',').map((id: string) => parseInt(id.trim()));
          const names = ids.map((id: number) => datasourceMap[id] || id).join(', ');
          return names;
        }
        return '-';
      },
    },
    {
      search: false,
      title: '节点在线数',
      dataIndex: 'onlineNumber',
      render: (dom, entity) => {
        return (
          <>
            {entity.onlineNumber > 0 ? (
              <span style={{ color: 'green', fontWeight: 'bold' }}>{entity.onlineNumber}</span>
            ) : (
              <span style={{ color: 'red', fontWeight: 'bold' }}>{entity.onlineNumber}</span>
            )}
          </>
        );
      },
    },
    {
      search: false,
      title: '是否启用',
      dataIndex: 'enableStatus',
      render: (dom, entity) => {
        return (
          <Switch
            checkedChildren="启用"
            unCheckedChildren="禁用"
            size={'small'}
            checked={entity.enableStatus == 1}
            onChange={async (checked: boolean) => {
              if (checked) {
                await handleEnableClientInfo(entity.id);
              } else {
                await handleDisableClientInfo(entity.id);
              }
            }}
          />
        );
      },
    },
    {
      search: false,
      title: '操作',
      width: '320px',
      render: (dom, entity) => {
        return (
          <>
            <Button
              type="primary"
              size="small"
              style={{ marginRight: '5px' }}
              onClick={() => openUpdateClientInfoModal(entity)}
            >
              修改
            </Button>

            <Button
              type="primary"
              size="small"
              style={{ marginRight: '5px' }}
              onClick={() => handleEnableIncremental(entity.id)}
            >
              开启增量
            </Button>

            <Button
              type="primary"
              size="small"
              style={{ marginRight: '5px' }}
              loading={uniqueIndexCheckLoadingMap[entity.id] || false}
              onClick={() => handleUniqueIndexCheck(entity.id)}
            >
              扫描唯一键
            </Button>

            <Button
              type="primary"
              size="small"
              loading={tableExistCheckLoadingMap[entity.id] || false}
              onClick={() => handleTableExistCheck(entity.id)}
            >
              检查表存在
            </Button>
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
              path: '/sync/sync-client/',
              breadcrumbName: '同步客户端',
            },
          ],
        },
      }}
    >
      <ProTable<API.ClientInfoResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => getClientInfoPaging(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openSaveClientInfoModal}>
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
        onFinish={async (value) => {
          // 处理多数据源ID：如果是数组，转换为逗号分隔的字符串
          if (value.type === 2 && Array.isArray(value.targetDatasourceIds)) {
            value.targetDatasourceIds = value.targetDatasourceIds.join(',');
          }
          return updateModal ? handleUpdateClientInfo(value.id, value) : handleSaveClientInfo(value);
        }}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormText
          rules={[
            {
              required: true,
            },
          ]}
          name="clientName"
          label="客户名"
          placeholder="客户名"
        />
        <ProFormText
          rules={[
            {
              required: true,
            },
          ]}
          name="clientLabel"
          label="服务标签"
          placeholder="服务标签"
          readonly={clientLabelReadonly}
        />
        <ProFormSelect
          name="type"
          label="类型"
          placeholder="请选择类型"
          required={true}
          readonly={typeReadonly}
          options={[
            { label: '对外', value: 1 },
            { label: '对内', value: 2 },
          ]}
          fieldProps={{
            onChange: (value: number) => {
              setClientType(value);
              if (value === 1) {
                form.setFieldsValue({ targetDatasourceIds: undefined });
              } else {
                form.setFieldsValue({ targetDatasourceId: undefined });
              }
            },
          }}
          rules={[
            {
              required: true,
            },
          ]}
        />
        {clientType === 1 && (
          <ProFormSelect
            name="targetDatasourceId"
            label="数据源名"
            placeholder="请选择目标数据源"
            showSearch
            required={true}
            readonly={targetDatasourceIdReadonly}
            request={async () => {
              const keyValues = await listJdbcTargetDatasourceIdNames();
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
        )}
        {clientType === 2 && (
          <ProFormSelect
            name="targetDatasourceIds"
            label="数据源名（多选）"
            placeholder="请选择目标数据源"
            mode="multiple"
            showSearch
            required={true}
            readonly={targetDatasourceIdReadonly}
            request={async () => {
              const keyValues = await listJdbcTargetDatasourceIdNames();
              return _.map(keyValues, (x) => {
                const item: RequestOptionsType = {
                  label: x.value,
                  value: x.key,
                };
                return item;
              });
            }}
            fieldProps={{
              mode: 'multiple',
            }}
            rules={[
              {
                required: true,
              },
            ]}
          />
        )}
        <ProFormText
          rules={[
            {
              required: false,
              pattern: new RegExp(
                /^(((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)|\*))\.){3}((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)))|\*)(;((25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d|\*)))\.){3}(25[0-5]|2[0-4]\d|((1\d{2})|([1-9]?\d)|\*)))*|\*)$/,
              ),
              message: '请输入有效的ip地址，多个请用;分割',
            },
          ]}
          name="clientIp"
          label="IP 白名单（默认 * ）"
          placeholder="*"
        />
        <ProFormTextArea name="clientDescription" label="服务描述" placeholder="服务描述" />
      </ModalForm>
    </PageContainer>
  );
};

export default client;
