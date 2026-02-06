import { PageContainer } from '@ant-design/pro-layout';
import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import { Button, Form, message, Tag, Tooltip, Modal } from 'antd';
import { ModalForm, ProFormSelect, ProFormText } from '@ant-design/pro-form';
import { PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  getDataPublishPaging,
  executeFlinkData,
  getWorkspaceNamespaceMap,
  listAvailableProjects,
} from '@/services/flink-management/api';
import { checkUserAuthority } from '@/global';
import moment from 'moment';

const FlinkDataManagement: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [workspaceMap, setWorkspaceMap] = useState<API.WorkspaceNamespaceMapDTO>({});
  const [gitlabProjects, setGitlabProjects] = useState<API.GitlabProjectDTO[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  
  // 错误详情模态框状态
  const [errorModalVisible, setErrorModalVisible] = useState<boolean>(false);
  const [currentErrorInfo, setCurrentErrorInfo] = useState<{
    errorMsg: string;
    recordInfo: API.FlinkDataPublishViewDTO | null;
  }>({ errorMsg: '', recordInfo: null });

  const [form] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  const reloadTableData = () => {
    (tableActionRef.current as any).reload();
  };

  // 加载工作空间映射和GitLab项目
  useEffect(() => {
    loadWorkspaceMap();
    loadGitlabProjects();
  }, []);

  const loadWorkspaceMap = async () => {
    try {
      const data = await getWorkspaceNamespaceMap();
      setWorkspaceMap(data);
    } catch (error) {
      message.error('加载工作空间信息失败');
    }
  };

  const loadGitlabProjects = async () => {
    try {
      const data = await listAvailableProjects();
      setGitlabProjects(data);
    } catch (error) {
      message.error('加载GitLab项目失败');
    }
  };

  const initialFormValues = () => {
    form.resetFields();
    setSelectedInstance('');
  };

  const openDataPublishModal = () => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setModalTitle('发布');
    initialFormValues();
    setModalVisible(true);
  };

  const handleDataPublish = async (values: any) => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    try {
      await executeFlinkData({
        instanceName: values.instanceName,
        namespace: values.namespace,
        gitlabProjectId: values.gitlabProjectId,
        filepath: values.filepath,
        branch: values.branch,
      });
      message.success('发布任务已提交');
      reloadTableData();
      setModalVisible(false);
    } catch (error) {
      message.error('发布失败');
      console.error('发布失败:', error);
    }
  };

  // 显示错误详情
  const showErrorDetails = (record: API.FlinkDataPublishViewDTO) => {
    setCurrentErrorInfo({
      errorMsg: record.publishErrMsg || '',
      recordInfo: record,
    });
    setErrorModalVisible(true);
  };

  // 显示成功详情
  const showSuccessDetails = (record: API.FlinkDataPublishViewDTO) => {
    setCurrentErrorInfo({
      errorMsg: '',
      recordInfo: record,
    });
    setErrorModalVisible(true);
  };

  const getPublishStateTag = (publishState: number) => {
    const stateMap: { [key: number]: { color: string; text: string } } = {
      1: { color: 'processing', text: '发布中' },
      2: { color: 'red', text: '发布失败' },
      3: { color: 'green', text: '发布成功' },
    };
    const stateInfo = stateMap[publishState] || { 
      color: 'default', 
      text: '未知状态'
    };

    return (
      <Tag color={stateInfo.color} style={{ fontSize: '12px', fontWeight: 'bold' }}>
        {stateInfo.text}
      </Tag>
    );
  };

  const columns: ProColumns<API.FlinkDataPublishViewDTO>[] = [
    {
      title: '实例名称',
      dataIndex: 'instanceName',
      width: 200,
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
      width: 180,
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
              fontSize: '12px',
            }}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      title: 'Git工程',
      dataIndex: 'projectName',
      width: 180,
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
              fontWeight: '500',
              color: '#262626',
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '12px',
            }}
          >
            {text}
          </span>
        </div>
      ),
    },
    {
      search: false,
      title: 'Git路径',
      dataIndex: 'filepath',
      width: 250,
      ellipsis: false, // 完全禁用ellipsis以避免默认tooltip
      render: (text: string) => {
        const formatPathTooltip = (path: string) => {
          if (!path) return 'SQL路径：无路径';
          return `SQL路径详情：\n${path}`;
        };

        const filepath = text || '';

        return (
          <Tooltip 
            title={formatPathTooltip(filepath)}
            placement="topLeft"
            overlayStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e0e0e0',
              maxWidth: '400px',
            }}
            overlayInnerStyle={{
              padding: '12px',
              color: '#333333',
              fontSize: '12px',
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.4',
              backgroundColor: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
              title="" // 显式清空原生title属性
            >
              <span
                style={{
                  fontWeight: '400',
                  color: '#262626',
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title="" // 显式清空原生title属性
              >
                {filepath && filepath.length > 30 ? `${filepath.substring(0, 30)}...` : (filepath || '-')}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      search: false,
      title: '发布状态',
      dataIndex: 'publishState',
      width: 120,
      render: (_, record) => getPublishStateTag(record.publishState),
    },
    {
      search: false,
      title: '  信息',
      dataIndex: 'publishErrMsg',
      width: 110,
      align: 'center' as const,
      render: (_, record) => {
        const isSuccess = record.publishState === 3;
        
        if (isSuccess) {
          return (
            <Button
              size="small"
              onClick={() => showSuccessDetails(record)}
              style={{
                height: '26px',
                fontSize: '12px',
                fontWeight: '400',
                borderRadius: '4px',
                background: '#f6ffed',
                border: '1px solid #b7eb8f',
                color: '#52c41a',
                boxShadow: 'none',
                transition: 'all 0.2s ease',
                padding: '0 12px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#52c41a';
                e.currentTarget.style.borderColor = '#52c41a';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 2px 6px rgba(82, 196, 26, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f6ffed';
                e.currentTarget.style.borderColor = '#b7eb8f';
                e.currentTarget.style.color = '#52c41a';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              查看详情
            </Button>
          );
        }
        
        if (!record.publishErrMsg) {
          return (
            <span style={{ 
              color: '#8c8c8c', 
              fontSize: '12px',
              fontStyle: 'italic'
            }}>
              -
            </span>
          );
        }
        
        return (
          <Button
            size="small"
            onClick={() => showErrorDetails(record)}
            style={{
              height: '26px',
              fontSize: '12px',
              fontWeight: '400',
              borderRadius: '4px',
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              color: '#ff4d4f',
              boxShadow: 'none',
              transition: 'all 0.2s ease',
              padding: '0 12px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ff4d4f';
              e.currentTarget.style.borderColor = '#ff4d4f';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(255, 77, 79, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff2f0';
              e.currentTarget.style.borderColor = '#ffccc7';
              e.currentTarget.style.color = '#ff4d4f';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            查看详情
          </Button>
        );
      },
    },
    {
      search: false,
      title: '分支',
      dataIndex: 'branch',
      width: 120,
      ellipsis: false,
      render: (text: string) => {
        const branchName = text || 'master';
        const formatBranchTooltip = (branch: string) => {
          return `🌿 分支详情：\n${branch}`;
        };

        return (
          <Tooltip
            title={formatBranchTooltip(branchName)}
            overlayStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #d0d7de',
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              padding: '0',
            }}
            overlayInnerStyle={{
              backgroundColor: '#ffffff',
              color: '#333333',
              fontFamily: 'Monaco, Consolas, "SF Mono", monospace',
              fontSize: '12px',
              lineHeight: '1.5',
              padding: '12px 16px',
              borderRadius: '8px',
              whiteSpace: 'pre-line',
              wordBreak: 'break-all',
            }}
            placement="topLeft"
          >
            <div
              title=""
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              <span style={{ fontSize: '12px', color: '#8c8c8c', flexShrink: 0 }}>🌿</span>
              <span
                title=""
                style={{
                  fontWeight: '500',
                  color: '#262626',
                  fontFamily: 'Monaco, Consolas, monospace',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'color 0.2s ease',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#52c41a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#262626';
                }}
              >
                {branchName}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      search: false,
      title: '创建时间',
      dataIndex: 'createTime',
      width: 150,
      render: (_, record) => moment(record.createTime).format('YYYY-MM-DD HH:mm:ss'),
    }
  ];

  return (
    <>
      <ProTable<API.FlinkDataPublishViewDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => getDataPublishPaging(params)}
        scroll={{ x: 1600 }}
        search={{
          labelWidth: 'auto',
          collapsed: false,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={openDataPublishModal}
            style={{
              borderRadius: '8px',
              height: '36px',
              padding: '0 20px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
            }}
          >
            <PlusOutlined /> 🚀 发布
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
        onFinish={handleDataPublish}
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

        <ProFormSelect
          name="gitlabProjectId"
          label="GitLab工程"
          placeholder="请选择GitLab工程"
          rules={[{ required: true, message: '请选择GitLab工程' }]}
          options={gitlabProjects.map((project) => ({
            label: project.description
              ? `${project.projectName} (${project.description})`
              : project.projectName,
            value: project.id,
          }))}
          fieldProps={{
            showSearch: true,
            filterOption: (input: string, option: any) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase()),
          }}
        />

        <ProFormText
          name="filepath"
          label="文件路径"
          placeholder="请输入文件路径，如：catalog/V004__create_mysql_xxx_catalog.sql"
          rules={[{ required: true, message: '请输入文件路径' }]}
        />

        <ProFormText
          name="branch"
          label="分支名称"
          placeholder="请输入分支名称"
          initialValue="master"
          rules={[{ required: true, message: '请输入分支名称' }]}
        />
      </ModalForm>

      {/* 详情模态框 */}
      <Modal
        title={
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '600',
              color: currentErrorInfo.errorMsg ? '#cf1322' : '#389e0d',
            }}
          >
            {currentErrorInfo.errorMsg ? (
              <ExclamationCircleOutlined style={{ color: '#cf1322', fontSize: '18px' }} />
            ) : (
              <span style={{ fontSize: '18px' }}>✅</span>
            )}
            <span>{currentErrorInfo.errorMsg ? '发布错误详情' : '发布成功详情'}</span>
          </div>
        }
        open={errorModalVisible}
        onCancel={() => setErrorModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setErrorModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
        style={{ top: '10vh' }}
        destroyOnClose
      >
        {currentErrorInfo.recordInfo && (
          <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
            {/* 基本信息 */}
            <div
              style={{
                background: '#f8f9fa',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #e9ecef',
              }}
            >
              <h4
                style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#495057',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>📋</span>
                <span>任务基本信息</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>流水号：</span>
                  <span style={{ fontWeight: '500' }}>{currentErrorInfo.recordInfo.id}</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>Flink实例：</span>
                  <span style={{ fontWeight: '500' }}>{currentErrorInfo.recordInfo.instanceName}</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>命名空间：</span>
                  <span style={{ fontWeight: '500' }}>{currentErrorInfo.recordInfo.namespace}</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>GitLab工程：</span>
                  <span style={{ fontWeight: '500' }}>{currentErrorInfo.recordInfo.projectName}</span>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>SQL路径：</span>
                  <span 
                    style={{ 
                      fontWeight: '500', 
                      fontFamily: 'Monaco, Consolas, monospace',
                      fontSize: '12px',
                      wordBreak: 'break-all',
                    }}
                  >
                    {currentErrorInfo.recordInfo.filepath}
                  </span>
                </div>
              </div>
            </div>

            {/* 错误信息或成功信息 */}
            {currentErrorInfo.errorMsg ? (
              <div
                style={{
                  background: '#fff5f5',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #fed7d7',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#cf1322',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🚨</span>
                  <span>错误详细信息</span>
                </h4>
                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #fecaca',
                    maxHeight: '200px',
                    overflow: 'auto',
                  }}
                >
                  <pre
                    style={{
                      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
                      fontSize: '12px',
                      lineHeight: '1.5',
                      color: '#b91c1c',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {currentErrorInfo.errorMsg}
                  </pre>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#f6ffed',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #b7eb8f',
                }}
              >
                <h4
                  style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#389e0d',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>🎉</span>
                  <span>发布成功信息</span>
                </h4>
                <div
                  style={{
                    background: '#ffffff',
                    padding: '12px',
                    borderRadius: '6px',
                    border: '1px solid #95de64',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '24px' }}>🎊</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#389e0d', marginBottom: '4px' }}>
                      发布任务已成功完成！
                    </div>
                    <div style={{ fontSize: '12px', color: '#52c41a' }}>
                      数据发布任务执行成功，所有配置已生效。
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 时间信息 */}
            <div
              style={{
                marginTop: '16px',
                padding: '12px',
                background: '#f1f5f9',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#64748b',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  创建时间：{moment(currentErrorInfo.recordInfo.createTime).format('YYYY-MM-DD HH:mm:ss')}
                </span>
                <span>
                  更新时间：{moment(currentErrorInfo.recordInfo.updateTime).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default FlinkDataManagement;
