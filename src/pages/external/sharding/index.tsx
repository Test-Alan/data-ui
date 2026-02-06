import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import {
  listJdbcDatasourceIdNames,
  listJdbcTargetDatasourceIdNames,
  listClientInfoIdNames,
  listShardingRules,
  listShardingConfigPaing,
  addShardingConfig,
  deleteShardingConfig,
  getClientInfo,
} from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, message } from 'antd';
import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import * as _ from 'lodash';
import { checkSuperAuthority } from '@/global';
import type { RequestOptionsType } from '@ant-design/pro-utils';
const shardingConfig: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [showTargetDatasourceSelect, setShowTargetDatasourceSelect] = useState<boolean>(false);
  const [availableTargetDatasourceIds, setAvailableTargetDatasourceIds] = useState<number[]>([]);
  const [selectedTargetDatasourceId, setSelectedTargetDatasourceId] = useState<number | undefined>(
    undefined,
  );

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  const initialFormValues = (entity?: API.ShardingConfigResponseDTO) => {
    form.resetFields();
    form.setFieldsValue(entity);
  };

  const openAddShardingModal = () => {
    if (!checkSuperAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setModalTitle('新增分表');
    initialFormValues(undefined);
    setShowTargetDatasourceSelect(false);
    setAvailableTargetDatasourceIds([]);
    setSelectedTargetDatasourceId(undefined);
    setModalVisible(true);
  };

  const handleClientChange = async (clientId: number) => {
    try {
      const clientInfo = await getClientInfo(clientId);
      if (!clientInfo) return;

      // 与“数据写入器”一致：type=1 对外（唯一目标数据源ID直接展示）；type=2 对内（下拉选择）
      if (clientInfo.type === 1) {
        setShowTargetDatasourceSelect(false);
        setAvailableTargetDatasourceIds([]);
        setSelectedTargetDatasourceId(clientInfo.targetDatasourceId);
        form.setFieldsValue({ targetDatasourceId: clientInfo.targetDatasourceId });
      } else if (clientInfo.type === 2) {
        // 对内：按 client 绑定的 targetDatasourceIds 过滤下拉
        const ids =
          clientInfo.targetDatasourceIds
            ?.split(',')
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id)) || [];
        setAvailableTargetDatasourceIds(ids);
        setShowTargetDatasourceSelect(true);
        setSelectedTargetDatasourceId(undefined);
        form.setFieldsValue({ targetDatasourceId: undefined });
      } else {
        // 兜底：未知类型，默认下拉可选全部
        setAvailableTargetDatasourceIds([]);
        setShowTargetDatasourceSelect(true);
        setSelectedTargetDatasourceId(undefined);
        form.setFieldsValue({ targetDatasourceId: undefined });
      }
    } catch (error) {
      console.error('获取客户端信息失败:', error);
      message.error('获取客户端信息失败');
    }
  };

  const handleAddSharding = async (value: API.AddShardingConfigRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await addShardingConfig(value);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDeleteSharding = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteShardingConfig(id);
    reloadTableData();
  };

  const columns: ProColumns<API.ShardingConfigResponseDTO>[] = [
    {
      search: false,
      title: '流水号',
      dataIndex: 'id',
    },
    {
      search: false,
      title: '同步端',
      dataIndex: 'clientName',
    },
    {
      search: false,
      title: '数据源名',
      dataIndex: 'sourceDatasourceName',
    },
    {
      search: false,
      title: '源库名',
      dataIndex: 'sourceSchemaName',
    },
    {
      title: '逻辑前缀',
      dataIndex: 'logicalTablePrefix',
    },
    {
      search: false,
      title: '目标数据源名',
      dataIndex: 'targetDatasourceName',
    },
    {
      search: false,
      title: '目标库名',
      dataIndex: 'targetSchemaName',
    },
    {
      search: false,
      title: '分片规则',
      dataIndex: 'shardingRuleName',
    },
    {
      search: false,
      title: '操作',
      width: '150px',
      render: (dom, entity) => {
        return (
          <>
            <Popconfirm
              title={`确认要删除分表"${entity.id}"吗?`}
              onConfirm={async () => handleDeleteSharding(entity.id)}
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
              path: '/sync/sharding/',
              breadcrumbName: '分表配置器',
            },
          ],
        },
      }}
    >
      <ProTable<API.ShardingConfigResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => listShardingConfigPaing(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openAddShardingModal}>
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
        onFinish={async (value) => handleAddSharding(value)}
      >
        <ProFormDigit name="id" hidden={true} />
        <ProFormSelect
          name="datasourceId"
          label="数据源"
          placeholder="请选择数据源"
          showSearch
          required={true}
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
          name="sourceSchemaName"
          label="源数据库名"
          placeholder="源数据库名"
        />
        <ProFormText
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          name="logicalTablePrefix"
          label="分表逻辑前缀"
          placeholder="分表逻辑前缀"
        />
        <ProFormSelect
          name="clientId"
          label="同步服务ID"
          placeholder="请选择同步服务ID"
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
        {showTargetDatasourceSelect && (
          <ProFormSelect
            name="targetDatasourceId"
            label="目标数据源"
            placeholder="请选择目标数据源"
            showSearch
            required={true}
            request={async () => {
              const keyValues = await listJdbcTargetDatasourceIdNames();
              const all = _.map(keyValues, (x) => {
                const item: RequestOptionsType = {
                  label: x.value,
                  value: x.key,
                };
                return item;
              });
              // 如果 client 没配置可用列表，则允许全部；否则按列表过滤
              return availableTargetDatasourceIds.length > 0
                ? all.filter((item) => availableTargetDatasourceIds.includes(item.value as number))
                : all;
            }}
            rules={[
              {
                required: true,
              },
            ]}
          />
        )}
        {!showTargetDatasourceSelect && selectedTargetDatasourceId !== undefined && (
          <ProFormDigit
            name="targetDatasourceId"
            label="目标数据源ID"
            readonly={true}
            placeholder="自动填充"
            required={true}
          />
        )}
        <ProFormText
          rules={[
            {
              required: true,
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          name="targetSchemaName"
          label="目标库名"
          placeholder="目标库名"
        />
        <ProFormSelect
          name="shardingRule"
          label="分片规则"
          placeholder="请选择分片规则"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listShardingRules();
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
      </ModalForm>
    </PageContainer>
  );
};

export default shardingConfig;
