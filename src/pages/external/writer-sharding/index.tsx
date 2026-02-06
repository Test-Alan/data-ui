import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import React, { useRef, useState } from 'react';
import moment from 'moment';
import {
  addWriterDynamicConfig,
  deleteWriterDynamicConfig,
  getClientInfo,
  listClientInfoIdNames,
  listJdbcTargetDatasourceIdNames,
  listWriterDynamicConfigIdNames,
  listWriterDynamicConfigPaging,
} from '@/services/ext-sync/api';
import { Button, Form, Popconfirm, message } from 'antd';
import { ModalForm, ProFormDigit, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { FormattedMessage } from 'umi';
import { PlusOutlined } from '@ant-design/icons';
import * as lodash from 'lodash';
import { checkSuperAuthority } from '@/global';
import type { RequestOptionsType } from '@ant-design/pro-utils';

const WriterShardingConfig: React.FC = () => {
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

  const openAddModal = () => {
    if (!checkSuperAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setModalTitle('新增分片写入器');
    form.resetFields();
    setShowTargetDatasourceSelect(false);
    setAvailableTargetDatasourceIds([]);
    setSelectedTargetDatasourceId(undefined);
    setModalVisible(true);
  };

  const handleClientChange = async (clientId: number) => {
    try {
      const clientInfo = await getClientInfo(clientId);
      if (!clientInfo) return;

      // 与“数据写入器”一致：type=1 对外（唯一目标数据源ID直接展示）；type=2 对内（下拉选择并按 client 过滤）
      if (clientInfo.type === 1) {
        setShowTargetDatasourceSelect(false);
        setAvailableTargetDatasourceIds([]);
        setSelectedTargetDatasourceId(clientInfo.targetDatasourceId);
        form.setFieldsValue({ targetDatasourceId: clientInfo.targetDatasourceId });
      } else if (clientInfo.type === 2) {
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
      // eslint-disable-next-line no-console
      console.error('获取客户端信息失败:', error);
      message.error('获取客户端信息失败');
    }
  };

  const handleAdd = async (value: API.AddWriterDynamicConfigRequestDTO) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    // 后端字段 targetDatasourceId 是 String，这里统一转成字符串传递
    const payload: API.AddWriterDynamicConfigRequestDTO = {
      ...value,
      targetDatasourceId: value?.targetDatasourceId?.toString?.() ?? (value as any).targetDatasourceId,
      targetLogicalTablePrefix:
        value?.targetLogicalTablePrefix?.trim?.() === '' ? undefined : value?.targetLogicalTablePrefix,
    };
    await addWriterDynamicConfig(payload);
    reloadTableData();
    setModalVisible(false);
  };

  const handleDelete = async (id: number) => {
    if (!checkSuperAuthority()) return message.warning('当前用户没有权限操作');
    await deleteWriterDynamicConfig(id);
    reloadTableData();
  };

  const columns: ProColumns<API.WriterDynamicConfigResponseDTO>[] = [
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
      title: '逻辑表名前缀',
      dataIndex: 'logicalTablePrefix',
    },
    {
      search: false,
      title: '分片规则',
      dataIndex: 'shardingRuleName',
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
      title: '目标逻辑表名前缀',
      dataIndex: 'targetLogicalTablePrefix',
    },
    {
      search: false,
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      valueType: 'dateTime',
      render: (dom, record) => {
        const v = record.createTime as unknown;
        if (v === undefined || v === null || v === '') return '-';
        const n = typeof v === 'number' ? v : Number(v);
        return moment(Number.isNaN(n) ? (v as any) : n).format('YYYY-MM-DD HH:mm:ss');
      },
    },
    {
      search: false,
      title: '更新时间',
      dataIndex: 'updateTime',
      width: 180,
      valueType: 'dateTime',
      render: (dom, record) => {
        const v = record.updateTime as unknown;
        if (v === undefined || v === null || v === '') return '-';
        const n = typeof v === 'number' ? v : Number(v);
        return moment(Number.isNaN(n) ? (v as any) : n).format('YYYY-MM-DD HH:mm:ss');
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
              title={`确认要删除配置"${entity.id}"吗?`}
              onConfirm={async () => handleDelete(entity.id)}
              okText="是"
              cancelText="否"
            >
              <Button
                size="small"
                style={{
                  marginLeft: '5px',
                  backgroundColor: '#ff4d4f',
                  borderColor: '#ff4d4f',
                  color: '#fff',
                  border: '1px solid #ff4d4f',
                }}
              >
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
              path: '/sync/sharding-writer/',
              breadcrumbName: '分片写入器',
            },
          ],
        },
      }}
    >
      <ProTable<API.WriterDynamicConfigResponseDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        search={{ labelWidth: 120 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => listWriterDynamicConfigPaging(params)}
        toolBarRender={() => [
          <Button type="primary" key="primary" onClick={openAddModal}>
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
        onFinish={async (value) => handleAdd(value as API.AddWriterDynamicConfigRequestDTO)}
      >
        <ProFormSelect
          name="clientId"
          label="同步服务ID"
          placeholder="请选择同步服务ID"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listClientInfoIdNames();
            return lodash.map(keyValues, (x) => {
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
          fieldProps={{
            onChange: (value: number) => {
              handleClientChange(value);
            },
          }}
        />

        <ProFormSelect
          name="readerDynamicConfigId"
          label="读取器动态配置"
          placeholder="请选择读取器动态配置"
          showSearch
          required={true}
          request={async () => {
            const keyValues = await listWriterDynamicConfigIdNames();
            return lodash.map(keyValues, (x) => {
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

        {showTargetDatasourceSelect && (
          <ProFormSelect
            name="targetDatasourceId"
            label="目标数据源"
            placeholder="请选择目标数据源"
            showSearch
            required={true}
            request={async () => {
              const keyValues = await listJdbcTargetDatasourceIdNames();
              const all = lodash.map(keyValues, (x) => {
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

        <ProFormText
          rules={[
            {
              pattern: new RegExp(/^[a-z][_a-z0-9]*$/),
              message: '只能输入小写字母和数字/^[a-z][_a-z0-9]*$/',
            },
          ]}
          name="targetLogicalTablePrefix"
          label="目标逻辑表名前缀"
          tooltip="不填和读取器配置保持一致"
          placeholder="不填和读取器配置保持一致"
        />
      </ModalForm>
    </PageContainer>
  );
};

export default WriterShardingConfig;

