import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { useLocation } from 'umi';
import './index.less';
import FlinkWorkspace from './workspace';
import FlinkDeployment from './deployment';
import FlinkVariable from './variable';
import FlinkDataManagement from './data';
import FlinkOperationLog from './operation-log';
import FlinkJobTemplate from './job-template';
// 导入各个API
import { getWorkspacePaging } from '@/services/flink-management/workspace-api';
import { getJobDeploymentPaging, getOperationLogPaging } from '@/services/flink-management/api';
import { getVariablePaging } from '@/services/flink-management/variable-api';
import { getDataPublishPaging } from '@/services/flink-management/api';

const FlinkManagement: React.FC = () => {
  const location = useLocation();
  
  // 从URL参数中获取tab参数，如果没有则默认为deployment
  const getInitialTab = () => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    return tabParam || 'deployment';
  };
  
  const [activeTab, setActiveTab] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    console.log('Initial state - search:', location.search, 'tabParam:', tabParam);
    return tabParam || 'deployment';
  });
  // 添加状态来存储各个Tab的数量
  const [tabCounts, setTabCounts] = useState({
    workspace: 0,
    deployment: 0,
    variables: 0,
    data: 0,
    operationLogs: 0,
    jobTemplates: 3, // 初始有一个简单作业模板
  });

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 监听URL变化，更新activeTab
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') || 'deployment';
    console.log('URL search:', location.search, 'tabParam:', tabParam, 'currentActiveTab:', activeTab);
    setActiveTab(tabParam);
  }, [location.search, location.pathname]);

  // 组件挂载时立即检查URL参数
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') || 'deployment';
    console.log('Component mounted, setting initial tab to:', tabParam);
    setActiveTab(tabParam);
  }, []);

  // 获取各个Tab的数量
  const fetchTabCounts = async () => {
    try {
      // 并行获取所有数据的总数
      const promises = [
        // 工作空间数量 - 需要从嵌套结构中获取
        getWorkspacePaging({ pageNum: 1, pageSize: 1 }).then(response => {
          const result = response?.data || response;
          return result?.total || result?.totalCount || 0;
        }).catch((error) => {
          console.error('获取工作空间数量失败:', error);
          return 0;
        }),
        
        // 作业部署数量 - API已处理过数据结构，直接取total
        getJobDeploymentPaging({ current: 1, pageSize: 1 }).then(response => {
          console.log('作业部署API响应:', response);
          return response?.total || 0;
        }).catch((error) => {
          console.error('获取作业部署数量失败:', error);
          return 0;
        }),
        
        // 变量配置数量 - 需要从嵌套结构中获取
        getVariablePaging({ pageNum: 1, pageSize: 1 }).then(response => {
          const result = response?.data || response;
          return result?.total || result?.totalCount || 0;
        }).catch((error) => {
          console.error('获取变量配置数量失败:', error);
          return 0;
        }),
        
        // catalog发布数量 - API已处理过数据结构，直接取total
        getDataPublishPaging({ current: 1, pageSize: 1 }).then(response => {
          console.log('catalog发布API响应:', response);
          return response?.total || 0;
        }).catch((error) => {
          console.error('获取catalog发布数量失败:', error);
          return 0;
        }),
        
        // 操作日志数量 - API已处理过数据结构，直接取total
        getOperationLogPaging({ current: 1, pageSize: 1 }).then(response => {
          console.log('操作日志API响应:', response);
          return response?.total || 0;
        }).catch((error) => {
          console.error('获取操作日志数量失败:', error);
          return 0;
        }),
      ];

      const [workspaceCount, deploymentCount, variableCount, dataCount, operationLogCount] = await Promise.all(promises);
      
      setTabCounts({
        workspace: workspaceCount,
        deployment: deploymentCount,
        variables: variableCount,
        data: dataCount,
        operationLogs: operationLogCount,
        jobTemplates: 3, // 保持作业模板数量为1
      });
      
      console.log('Tab数量更新:', {
        workspace: workspaceCount,
        deployment: deploymentCount,
        variables: variableCount,
        data: dataCount,
        operationLogs: operationLogCount,
        jobTemplates: 3,
      });
    } catch (error) {
      console.error('获取Tab数量失败:', error);
    }
  };

  // 页面加载时获取数量
  useEffect(() => {
    fetchTabCounts();
  }, []);

  return (
    <div className="flink-management-page flink-responsive-fix">
      <PageContainer
        header={{
          title: 'Flink发布',
          subTitle: '统一管理Flink实例的工作空间、部署和配置',
          breadcrumb: {
            routes: [
              {
                path: '/realtime-compute/',
                breadcrumbName: '实时计算',
              },
              {
                path: '/realtime-compute/flink-management/',
                breadcrumbName: 'Flink发布',
              },
            ],
          },
        }}
        tabList={[
           {
            tab: (
              <span className="tab-label">
                作业部署 <span className="tab-badge">{tabCounts.deployment}</span>
              </span>
            ),
            key: 'deployment',
          },
          {
            tab: (
              <span className="tab-label">
                变量配置 <span className="tab-badge">{tabCounts.variables}</span>
              </span>
            ),
            key: 'variables',
          },
          {
            tab: (
              <span className="tab-label">
                catalog发布 <span className="tab-badge">{tabCounts.data}</span>
              </span>
            ),
            key: 'data',
          },
          {
            tab: (
              <span className="tab-label">
                工作空间 <span className="tab-badge">{tabCounts.workspace}</span>
              </span>
            ),
            key: 'workspace',
          },
          {
            tab: (
              <span className="tab-label">
                作业模板 <span className="tab-badge">{tabCounts.jobTemplates}</span>
              </span>
            ),
            key: 'job-templates',
          },
          {
            tab: (
              <span className="tab-label">
                操作日志 <span className="tab-badge">{tabCounts.operationLogs}</span>
              </span>
            ),
            key: 'operation-logs',
          },
        ]}
        tabActiveKey={activeTab}
        onTabChange={handleTabChange}
        tabProps={{
          type: 'line',
          size: 'large',
          tabBarStyle: {
            background: 'transparent',
            marginBottom: 0,
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        }}
      >
        <div className="flink-content-wrapper">
          {activeTab === 'workspace' && <FlinkWorkspace />}
          {activeTab === 'deployment' && <FlinkDeployment />}
          {activeTab === 'variables' && <FlinkVariable />}
          {activeTab === 'data' && <FlinkDataManagement />}
          {activeTab === 'operation-logs' && <FlinkOperationLog />}
          {activeTab === 'job-templates' && <FlinkJobTemplate />}
        </div>
      </PageContainer>
    </div>
  );
};

export default FlinkManagement; 