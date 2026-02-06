import ProTable from '@ant-design/pro-table';
import type { ProColumns } from '@ant-design/pro-table';
import {
  Button,
  Form,
  message,
  Popconfirm,
  Modal,
  Timeline,
  Tooltip,
  Tabs,
  Tag,
} from 'antd';
import { ModalForm, ProFormSelect, ProFormText, ProFormDigit } from '@ant-design/pro-form';
import {
  PlusOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import React, { useRef, useState, useEffect } from 'react';
import {
  getJobDeploymentPaging,
  deployFlinkJob,
  deployUpdateFlinkJob,
  checkFlinkJobStatus,
  getWorkspaceNamespaceMap,
  listAvailableProjects,
  getEventsByMainId,
  getJobResourceConfig,
  updateJobResourceConfig,
  getLock,
} from '@/services/flink-management/api';
import { checkSuperAuthority, checkUserAuthority } from '@/global';
import moment from 'moment';

// 添加轮询动画样式
const pollingStyles = `
  @keyframes pollingDots {
    0% {
      opacity: 0.2;
    }
    20% {
      opacity: 1;
    }
    100% {
      opacity: 0.2;
    }
  }

  @keyframes pollingRotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

// 注入样式到页面
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = pollingStyles;
  if (!document.head.querySelector('style[data-polling-styles]')) {
    styleElement.setAttribute('data-polling-styles', 'true');
    document.head.appendChild(styleElement);
  }
}

const FlinkDeployment: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>();
  const [workspaceMap, setWorkspaceMap] = useState<API.WorkspaceNamespaceMapDTO>({});
  const [gitlabProjects, setGitlabProjects] = useState<API.GitlabProjectDTO[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [eventsModalVisible, setEventsModalVisible] = useState<boolean>(false);
  const [currentEvents, setCurrentEvents] = useState<API.FlinkJobDeploymentEventDTO[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);

  const [resourceConfigModalVisible, setResourceConfigModalVisible] = useState<boolean>(false);
  const [currentRecord, setCurrentRecord] = useState<API.FlinkJobDeploymentMainViewDTO | null>(
    null,
  );
  const [resourceConfigLoading, setResourceConfigLoading] = useState<boolean>(false);

  // 错误详情模态框状态
  const [errorModalVisible, setErrorModalVisible] = useState<boolean>(false);
  const [currentErrorInfo, setCurrentErrorInfo] = useState<{
    errorMsg: string;
    recordInfo: API.FlinkJobDeploymentMainViewDTO | null;
  }>({ errorMsg: '', recordInfo: null });

  // 轮询相关状态
  const [pollingTimers, setPollingTimers] = useState<Map<number, NodeJS.Timeout>>(new Map());
  const [pollingStartTimes, setPollingStartTimes] = useState<Map<number, number>>(new Map());

  const [form] = Form.useForm();
  const [resourceConfigForm] = Form.useForm();
  const createFormRef = useRef();
  const tableActionRef = useRef();

  // 表单值保存的localStorage key
  const FORM_VALUES_KEY = 'flink_deployment_form_values';

  // 清理所有轮询定时器
  useEffect(() => {
    return () => {
      // 组件卸载时清理所有定时器
      pollingTimers.forEach((timer, recordId) => {
        clearInterval(timer);
        console.log(`组件卸载，清理轮询定时器 - 记录ID: ${recordId}`);
      });
      pollingTimers.clear();
      pollingStartTimes.clear();
    };
  }, []);

  // 轮询配置
  const POLLING_INTERVAL = 3000; // 3秒
  const MAX_POLLING_TIME = 5 * 60 * 1000; // 5分钟

  // 开始轮询
  const startPolling = (recordId: number, targetStates: number[], operationType: string) => {
    // 清除已存在的轮询
    stopPolling(recordId);

    const startTime = Date.now();
    setPollingStartTimes((prev) => new Map(prev.set(recordId, startTime)));

    const timer = setInterval(async () => {
      try {
        // 检查是否超过最大轮询时间
        if (Date.now() - startTime > MAX_POLLING_TIME) {
          console.log(`${operationType}轮询超时，停止轮询 - 记录ID: ${recordId}`);
          stopPolling(recordId);
          return;
        }

        // 刷新表格数据
        reloadTableData();

        // 获取当前数据检查状态
        const response = await getJobDeploymentPaging({
          current: 1,
          pageSize: 1000, // 获取足够多的数据来查找目标记录
        });

        const dataList = response?.data || [];
        const targetRecord = dataList.find(
          (item: API.FlinkJobDeploymentMainViewDTO) => item.id === recordId,
        );

        if (targetRecord) {
          const currentState = targetRecord.jobState;
          console.log(
            `${operationType}轮询检查 - 记录ID: ${recordId}, 当前状态: ${currentState}, 目标状态: ${targetStates}`,
          );

          // 如果不在目标状态中，停止轮询
          if (!targetStates.includes(currentState)) {
            console.log(
              `${operationType}轮询完成，状态已变更 - 记录ID: ${recordId}, 最终状态: ${currentState}`,
            );
            stopPolling(recordId);
          }
        } else {
          console.log(`${operationType}轮询中未找到目标记录 - 记录ID: ${recordId}`);
        }
      } catch (error) {
        console.error(`${operationType}轮询出错:`, error);
      }
    }, POLLING_INTERVAL);

    setPollingTimers((prev) => new Map(prev.set(recordId, timer)));
    console.log(`开始${operationType}轮询 - 记录ID: ${recordId}, 目标状态: ${targetStates}`);
  };

  // 停止轮询
  const stopPolling = (recordId: number) => {
    const timer = pollingTimers.get(recordId);
    if (timer) {
      clearInterval(timer);
      setPollingTimers((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recordId);
        return newMap;
      });
      setPollingStartTimes((prev) => {
        const newMap = new Map(prev);
        newMap.delete(recordId);
        return newMap;
      });
      console.log(`停止轮询 - 记录ID: ${recordId}`);
    }
  };

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

  // 保存表单值到localStorage（排除文件路径）
  const saveFormValues = (values: any) => {
    try {
      const valuesToSave = { ...values };
      delete valuesToSave.filepath; // 排除文件路径
      localStorage.setItem(FORM_VALUES_KEY, JSON.stringify(valuesToSave));
    } catch (error) {
      console.error('保存表单值失败:', error);
    }
  };

  // 从localStorage恢复表单值
  const loadSavedFormValues = () => {
    try {
      const savedValues = localStorage.getItem(FORM_VALUES_KEY);
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
    // 加载之前保存的值（除文件路径外）
    loadSavedFormValues();
  };

  const openDeployModal = () => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setModalTitle('部署Flink作业');
    initialFormValues();
    setModalVisible(true);
  };

  const handleDeploy = async (values: any) => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    try {
      // 保存表单值（除了文件路径）
      saveFormValues(values);

      const response = await deployFlinkJob({
        instanceName: values.instanceName,
        namespace: values.namespace,
        gitlabProjectId: values.gitlabProjectId,
        filepath: values.filepath,
        branch: values.branch,
      });
      message.success('部署任务已提交');
      reloadTableData();
      setModalVisible(false);

      // 获取部署记录ID并开始轮询
      const recordId = response?.data?.id;
      if (recordId) {
        const deploymentStates = [1, 3, 4, 7, 10]; // 部署相关的轮询状态
        startPolling(recordId, deploymentStates, '部署');
        console.log('部署成功，开始轮询 - 记录ID:', recordId);
      } else {
        console.warn('部署响应中未找到记录ID:', response);
      }
    } catch (error) {
      message.error('部署失败');
      console.error('部署失败:', error);
    }
  };



  const handleRetry = async (record: API.FlinkJobDeploymentMainViewDTO) => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    try {
      await checkFlinkJobStatus(record.id);
      message.success('状态检查任务已提交');
      reloadTableData();
    } catch (error) {
      message.error('状态检查失败');
    }
  };

  const handleApplyUnlock = async (record: API.FlinkJobDeploymentMainViewDTO) => {
    if (!checkSuperAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    try {
      const response = await getLock(record.id);
      if (response?.code === 200) {
        const lockInfo = response?.data;
        const lockId = lockInfo?.id || lockInfo?.lockId || '';
        const holderName = lockInfo?.holderName || '';
        
        if (lockId) {
          message.success(`申请解锁成功！锁ID: ${lockId}${holderName ? `, 持有者: ${holderName}` : ''}`);
        } else {
          message.success('申请解锁成功');
        }
      } else {
        message.warning('申请解锁失败');
      }
      reloadTableData();
    } catch (error) {
      message.error('申请解锁失败');
      console.error('申请解锁失败:', error);
    }
  };

  const handleUpdateDeploy = async (record: API.FlinkJobDeploymentMainViewDTO) => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    try {
      const response = await deployUpdateFlinkJob(record.id);
      message.success('更新部署任务已提交');
      reloadTableData();

      // 获取部署记录ID并开始轮询
      const recordId = response?.data?.id;
      if (recordId) {
        const deploymentStates = [1, 3, 4, 7, 10]; // 部署相关的轮询状态
        startPolling(recordId, deploymentStates, '更新部署');
        console.log('更新部署成功，开始轮询 - 记录ID:', recordId);
      } else {
        console.warn('更新部署响应中未找到记录ID:', response);
      }
    } catch (error) {
      message.error('更新部署失败');
      console.error('更新部署失败:', error);
    }
  };

  const handleViewEvents = async (record: API.FlinkJobDeploymentMainViewDTO) => {
    setEventsLoading(true);
    setEventsModalVisible(true);
    try {
      const events = await getEventsByMainId(record.id);
      setCurrentEvents(events);
    } catch (error) {
      message.error('获取部署事件失败');
      setCurrentEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const handleResourceConfig = async (record: API.FlinkJobDeploymentMainViewDTO) => {
    if (checkUserAuthority()) {
      message.warning('当前用户没有权限操作');
      return;
    }
    setCurrentRecord(record);
    setResourceConfigLoading(true);
    setResourceConfigModalVisible(true);

    try {
      const config = await getJobResourceConfig(record.id);
      resourceConfigForm.setFieldsValue({
        jobManagerCpu: config.jobManagerCpu,
        jobManagerMemory: config.jobManagerMemory,
        taskManagerCpu: config.taskManagerCpu,
        taskManagerMemory: config.taskManagerMemory,
        resourceSettingMode: config.resourceSettingMode || 'BASIC',
      });
    } catch (error) {
      message.error('获取资源配置失败');
    } finally {
      setResourceConfigLoading(false);
    }
  };

  const handleResourceConfigSubmit = async (values: any) => {
    if (!currentRecord) return;

    try {
      await updateJobResourceConfig({
        id: currentRecord.id,
        jobManagerCpu: values.jobManagerCpu,
        jobManagerMemory: values.jobManagerMemory,
        taskManagerCpu: values.taskManagerCpu,
        taskManagerMemory: values.taskManagerMemory,
        resourceSettingMode: values.resourceSettingMode || 'BASIC',
      });

      message.success('资源配置更新成功');
      setResourceConfigModalVisible(false);
      setCurrentRecord(null);
      reloadTableData();
    } catch (error) {
      message.error('资源配置更新失败');
    }
  };

  // 显示错误详情
  const showErrorDetails = (record: API.FlinkJobDeploymentMainViewDTO) => {
    setCurrentErrorInfo({
      errorMsg: record.deploymentErrMsg || '',
      recordInfo: record,
    });
    setErrorModalVisible(true);
  };

  // 显示成功详情
  const showSuccessDetails = (record: API.FlinkJobDeploymentMainViewDTO) => {
    setCurrentErrorInfo({
      errorMsg: '',
      recordInfo: record,
    });
    setErrorModalVisible(true);
  };

  const getJobStateTag = (stateDesc: string) => {
    const stateMap: { [key: string]: { color: string; text: string } } = {
      作业运行中: { color: 'green', text: '运行中' },
      作业启动中: { color: 'processing', text: '启动中' },
      作业部署完成: { color: 'green', text: '部署成功' },
      作业部署失败: { color: 'red', text: '部署失败' },
      作业已停止: { color: 'default', text: '已停止' },
      作业启动失败: { color: 'red', text: '启动失败' },
      作业创建失败: { color: 'red', text: '创建失败' },
      作业已创建: { color: 'orange', text: '已创建' },
      作业部署中: { color: 'processing', text: '部署中' },
    };
    const stateInfo = stateMap[stateDesc] || { 
      color: 'default', 
      text: stateDesc
    };

    return (
      <Tag color={stateInfo.color} style={{ fontSize: '12px', fontWeight: 'bold' }}>
        {stateInfo.text}
      </Tag>
    );
  };

  const columns: ProColumns<API.FlinkJobDeploymentMainViewDTO>[] = [
    {
      title: '实例名称',
      dataIndex: 'instanceName',
      width: 150,
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
      width: 140,
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
      search: false,
      title: 'Git工程',
      dataIndex: 'projectName',
      width: 140,
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
      width: 200,
      ellipsis: false, // 完全禁用ellipsis以避免默认tooltip
      render: (text: any, record: API.FlinkJobDeploymentMainViewDTO) => {
        const filepath = record.filepath || '';
        const formatPathTooltip = (path: string) => {
          if (!path) return 'SQL路径：无路径';
          return `SQL路径详情：\n${path}`;
        };

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
      title: '作业名称',
      dataIndex: 'jobName',
      width: 160,
      ellipsis: false, // 完全禁用ellipsis以避免默认tooltip
      render: (text: any, record: API.FlinkJobDeploymentMainViewDTO) => {
        const jobName = record.jobName || '';
        const formatJobNameTooltip = (jobName: string) => {
          if (!jobName) return '作业名称：未设置';
          return `作业名称：\n${jobName}`;
        };

        return (
          <Tooltip 
            title={formatJobNameTooltip(jobName)}
            placement="topLeft"
            overlayStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e0e0e0',
              maxWidth: '350px',
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
                  fontSize: '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title="" // 显式清空原生title属性
              >
                {jobName ? (jobName.length > 25 ? `${jobName.substring(0, 25)}...` : jobName) : '未设置'}
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      search: false,
      title: '作业状态',
      dataIndex: 'jobStateDesc',
      width: 140,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {getJobStateTag(record.jobStateDesc)}
          {pollingTimers.has(record.id) && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px',
                padding: '2px 6px',
                backgroundColor: '#f0f9ff',
                borderRadius: '8px',
                border: '1px solid #bae6fd',
              }}
            >
              <span
                style={{
                  animation: 'pollingDots 1.4s ease-in-out infinite',
                  animationDelay: '0s',
                  color: '#0ea5e9',
                  fontSize: '8px',
                  fontWeight: 'bold',
                }}
              >
                ●
              </span>
              <span
                style={{
                  animation: 'pollingDots 1.4s ease-in-out infinite',
                  animationDelay: '0.2s',
                  color: '#0ea5e9',
                  fontSize: '8px',
                  fontWeight: 'bold',
                }}
              >
                ●
              </span>
              <span
                style={{
                  animation: 'pollingDots 1.4s ease-in-out infinite',
                  animationDelay: '0.4s',
                  color: '#0ea5e9',
                  fontSize: '8px',
                  fontWeight: 'bold',
                }}
              >
                ●
              </span>
              <span
                style={{
                  fontSize: '10px',
                  color: '#0369a1',
                  fontWeight: '500',
                  marginLeft: '2px',
                }}
              >
                处理中
              </span>
            </span>
          )}
        </div>
      ),
    },
    {
      search: false,
      title: '部署详情',
      dataIndex: 'deploymentErrMsg',
      width: 100,
      align: 'center' as const,
      render: (_, record) => {
        const isSuccess = record.jobStateDesc === '作业部署完成';
        
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
        
        if (!record.deploymentErrMsg) {
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
      title: '创建时间',
      dataIndex: 'createTime',
      width: 150,
      render: (text: any) => {
        return text ? moment(text as string).format('YYYY-MM-DD HH:mm:ss') : '-';
      },
    },
    {
      search: false,
      title: '操作',
      width: 280,
      fixed: 'right' as const,
      render: (_, record) => {
        // 判断是否可以状态检查：当前时间-更新时间超过5分钟，并且jobState等于4或者7或者10
        const currentTime = moment();
        const updateTime = moment(record.updateTime);
        const timeDiff = currentTime.diff(updateTime, 'minutes');
        const canRetry = timeDiff > 5 && [4, 7, 10].includes(record.jobState);
        
        // 判断是否显示"更新部署"按钮：只要有草稿ID就显示
        const canUpdateDeploy = record.yunDeploymentDraftId;

        return (
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              justifyContent: 'flex-start', 
              gap: '6px', 
              flexWrap: 'wrap',
              minHeight: '32px',
              minWidth: '220px',
            }}
          >
            <Button
              type="primary"
              size="small"
              onClick={() => handleViewEvents(record)}
              style={{
                height: '28px',
                fontSize: '12px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)',
                border: 'none',
                fontWeight: '500',
                padding: '0 12px',
                boxShadow: '0 2px 4px rgba(22, 119, 255, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(22, 119, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(22, 119, 255, 0.2)';
              }}
            >
              部署事件
            </Button>
            
            {/* {record.jobState >= 6 && (
              <Button
                size="small"
                onClick={() => handleResourceConfig(record)}
                style={{
                  height: '28px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  border: '1px solid #d1d5db',
                  color: '#4b5563',
                  fontWeight: '500',
                  padding: '0 12px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%)';
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.color = '#374151';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)';
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                更新配置
              </Button>
            )} */}
            
            {canUpdateDeploy && (
              <Popconfirm
                title="确认更新部署？"
                onConfirm={() => handleUpdateDeploy(record)}
                okText="确认"
                cancelText="取消"
                placement="topRight"
              >
                <Button
                  size="small"
                  style={{
                    height: '28px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)',
                    border: '1px solid #1677ff',
                    color: '#0958d9',
                    fontWeight: '500',
                    padding: '0 12px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #1677ff 0%, #0958d9 100%)';
                    e.currentTarget.style.borderColor = '#0958d9';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%)';
                    e.currentTarget.style.borderColor = '#1677ff';
                    e.currentTarget.style.color = '#0958d9';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  更新部署
                </Button>
              </Popconfirm>
            )}
            
            {canRetry && (
              <Popconfirm
                title="确认状态检查？"
                onConfirm={() => handleRetry(record)}
                okText="确认"
                cancelText="取消"
                placement="topRight"
              >
                <Button
                  size="small"
                  style={{
                    height: '28px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)',
                    border: '1px solid #f59e0b',
                    color: '#d97706',
                    fontWeight: '500',
                    padding: '0 12px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #fed7aa 0%, #fb923c 100%)';
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.color = '#c2410c';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)';
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.color = '#d97706';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  状态检查
                </Button>
              </Popconfirm>
            )}

            {record.yunDeploymentDraftId && (
              <Popconfirm
                title="确认申请解锁？"
                onConfirm={() => handleApplyUnlock(record)}
                okText="确认"
                cancelText="取消"
                placement="topRight"
              >
                <Button
                  size="small"
                  style={{
                    height: '28px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, #fef3f2 0%, #fecaca 100%)',
                    border: '1px solid #dc2626',
                    color: '#dc2626',
                    fontWeight: '500',
                    padding: '0 12px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)';
                    e.currentTarget.style.borderColor = '#b91c1c';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, #fef3f2 0%, #fecaca 100%)';
                    e.currentTarget.style.borderColor = '#dc2626';
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  申请解锁
                </Button>
              </Popconfirm>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <ProTable<API.FlinkJobDeploymentMainViewDTO, API.PageParams>
        columns={columns}
        size="small"
        pagination={{ pageSize: 10 }}
        rowKey="id"
        actionRef={tableActionRef}
        request={(params) => getJobDeploymentPaging(params)}
        scroll={{ x: 1200 }}
        search={{
          labelWidth: 'auto',
          collapsed: false,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={openDeployModal}
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
            <PlusOutlined /> 🚀 部署
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
        onFinish={handleDeploy}
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
          placeholder="请输入文件路径，如：dataworks/V004__bond_bond_dws_xxx.sql"
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

      <Modal
        title="部署运行事件"
        open={eventsModalVisible}
        onCancel={() => setEventsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setEventsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={900}
        confirmLoading={eventsLoading}
      >
        {eventsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
        ) : (
          (() => {
            // 按日期分组事件
            const groupedEvents = currentEvents.reduce((groups: { [key: string]: API.FlinkJobDeploymentEventDTO[] }, event) => {
              const date = moment(event.eventTime).format('YYYY-MM-DD');
              if (!groups[date]) {
                groups[date] = [];
              }
              groups[date].push(event);
              return groups;
            }, {});

            // 按日期倒序排列（最新的日期在前）
            const sortedDates = Object.keys(groupedEvents).sort((a, b) => b.localeCompare(a));

            if (sortedDates.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                  暂无部署事件
                </div>
              );
            }

            // 创建Tab项
            const tabItems = sortedDates.map((date) => ({
              key: date,
              label: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{moment(date).format('MM-DD')}</span>
                  <span>{moment(date).format('dddd')}</span>
                  <span
                    style={{
                      background: '#f0f9ff',
                      color: '#1677ff',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: '500',
                      marginLeft: '4px',
                    }}
                  >
                    {groupedEvents[date].length}
                  </span>
                </div>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Timeline>
                    {groupedEvents[date]
                      .sort((a, b) => b.eventTime - a.eventTime) // 按时间倒序
                      .map((event) => (
                        <Timeline.Item 
                          key={event.id} 
                          color="blue"
                          style={{ paddingBottom: '16px' }}
                        >
                          <div
                            style={{
                              background: '#fafbfc',
                              borderRadius: '8px',
                              padding: '16px',
                              border: '1px solid #e8f4fd',
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                            }}
                          >
                            <div 
                              style={{ 
                                fontWeight: '600', 
                                marginBottom: '8px',
                                color: '#1f2937',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                              }}
                            >
                              {event.eventName}
                              <span 
                                style={{ 
                                  color: '#9ca3af', 
                                  fontSize: '12px',
                                  fontWeight: '400',
                                  marginLeft: 'auto',
                                }}
                              >
                                {moment(event.eventTime).format('HH:mm:ss')}
                              </span>
                            </div>
                            {event.eventContent && (
                              <div 
                                style={{ 
                                  color: '#6b7280', 
                                  fontSize: '13px', 
                                  lineHeight: '1.6',
                                  background: '#ffffff',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: '1px solid #f0f0f0',
                                  marginTop: '8px',
                                }}
                              >
                                {event.eventContent}
                              </div>
                            )}
                          </div>
                        </Timeline.Item>
                      ))}
                  </Timeline>
                </div>
              ),
            }));

            return (
              <Tabs
                defaultActiveKey={sortedDates[0]}
                items={tabItems}
                style={{ marginTop: '16px' }}
                tabBarStyle={{
                  marginBottom: '0',
                  borderBottom: '2px solid #f0f0f0',
                }}
                size="large"
              />
            );
          })()
        )}
      </Modal>

      <ModalForm
        modalProps={{
          maskClosable: false,
          confirmLoading: resourceConfigLoading,
          className: 'resource-config-modal',
          style: {
            top: '10vh',
          },
          bodyStyle: {
            padding: '32px',
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          },
        }}
        form={resourceConfigForm}
        title={
          <div
            style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ⚙️ 资源配置
            </span>
          </div>
        }
        width={680}
        visible={resourceConfigModalVisible}
        onVisibleChange={setResourceConfigModalVisible}
        onFinish={handleResourceConfigSubmit}
        submitter={{
          searchConfig: {
            submitText: '更新配置',
            resetText: '取消',
          },
          submitButtonProps: {
            style: {
              height: '32px',
              fontSize: '14px',
              borderRadius: '4px',
              background: '#1677ff',
              border: 'none',
              fontWeight: 'normal',
            },
          },
          resetButtonProps: {
            style: {
              height: '32px',
              fontSize: '14px',
              borderRadius: '4px',
              fontWeight: 'normal',
            },
          },
        }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#667eea' }}>🖥️</span>
            JobManager 配置
          </div>

          <ProFormDigit
            name="jobManagerCpu"
            label={<span style={{ fontWeight: '500', color: '#4b5563' }}>CPU核数</span>}
            placeholder="请输入JobManager CPU核数"
            rules={[{ required: true, message: '请输入JobManager CPU核数' }]}
            fieldProps={{
              min: 0.5,
              max: 100,
              step: 0.5,
              precision: 1,
              style: {
                borderRadius: '8px',
                height: '40px',
                fontSize: '14px',
              },
            }}
          />

          <ProFormDigit
            name="jobManagerMemory"
            label={<span style={{ fontWeight: '500', color: '#4b5563' }}>内存大小(GB)</span>}
            placeholder="请输入JobManager内存大小"
            rules={[{ required: true, message: '请输入JobManager内存大小' }]}
            fieldProps={{
              min: 1,
              max: 1000,
              step: 1,
              precision: 0,
              style: {
                borderRadius: '8px',
                height: '40px',
                fontSize: '14px',
              },
            }}
          />
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#667eea' }}>⚡</span>
            TaskManager 配置
          </div>

          <ProFormDigit
            name="taskManagerCpu"
            label={<span style={{ fontWeight: '500', color: '#4b5563' }}>CPU核数</span>}
            placeholder="请输入TaskManager CPU核数"
            rules={[{ required: true, message: '请输入TaskManager CPU核数' }]}
            fieldProps={{
              min: 0.5,
              max: 100,
              step: 0.5,
              precision: 1,
              style: {
                borderRadius: '8px',
                height: '40px',
                fontSize: '14px',
              },
            }}
          />

          <ProFormDigit
            name="taskManagerMemory"
            label={<span style={{ fontWeight: '500', color: '#4b5563' }}>内存大小(GB)</span>}
            placeholder="请输入TaskManager内存大小"
            rules={[{ required: true, message: '请输入TaskManager内存大小' }]}
            fieldProps={{
              min: 1,
              max: 1000,
              step: 1,
              precision: 0,
              style: {
                borderRadius: '8px',
                height: '40px',
                fontSize: '14px',
              },
            }}
          />
        </div>

        <div
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
          }}
        >
          <div
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ color: '#667eea' }}>⚙️</span>
            运行模式
          </div>

          <ProFormSelect
            name="resourceSettingMode"
            label={<span style={{ fontWeight: '500', color: '#4b5563' }}>资源设置模式</span>}
            initialValue="BASIC"
            options={[{ label: '基础模式', value: 'BASIC' }]}
            fieldProps={{
              disabled: true,
              style: {
                borderRadius: '8px',
                height: '40px',
              },
            }}
          />
        </div>
      </ModalForm>

      {/* 部署详情模态框 */}
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
            <span>{currentErrorInfo.errorMsg ? '部署错误详情' : '部署成功详情'}</span>
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
                <span>部署任务基本信息</span>
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>流水号：</span>
                  <span style={{ fontWeight: '500' }}>{currentErrorInfo.recordInfo.id}</span>
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>草稿ID：</span>
                  <span style={{ fontWeight: '500', fontFamily: 'Monaco, Consolas, monospace', fontSize: '12px' }}>
                    {currentErrorInfo.recordInfo.yunDeploymentDraftId || '未生成'}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>部署ID：</span>
                  <span style={{ fontWeight: '500', fontFamily: 'Monaco, Consolas, monospace', fontSize: '12px' }}>
                    {currentErrorInfo.recordInfo.yunDeploymentId || '未生成'}
                  </span>
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
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>工作空间：</span>
                  <span style={{ fontWeight: '500' }}>{currentErrorInfo.recordInfo.workspace || '未设置'}</span>
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
                {currentErrorInfo.recordInfo.jobName && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#6c757d', fontSize: '12px' }}>作业名称：</span>
                    <span style={{ fontWeight: '500' }}>{currentErrorInfo.recordInfo.jobName}</span>
                  </div>
                )}

                <div>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>分支：</span>
                  <span 
                    style={{ 
                      fontWeight: '500',
                      fontFamily: 'Monaco, Consolas, monospace',
                      fontSize: '12px',
                    }}
                  >
                    🌿 {currentErrorInfo.recordInfo.branch || 'master'}
                  </span>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#6c757d', fontSize: '12px' }}>创建时间：</span>
                  <span style={{ fontWeight: '500' }}>
                    {moment(currentErrorInfo.recordInfo.createTime).format('YYYY-MM-DD HH:mm:ss')}
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
                  <span>部署错误详细信息</span>
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
                  <span>部署成功信息</span>
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
                      部署任务已成功完成！
                    </div>
                    <div style={{ fontSize: '12px', color: '#52c41a' }}>
                      Flink作业已成功部署完成！
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default FlinkDeployment;
