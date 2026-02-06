import type { RequestData } from '@ant-design/pro-table';
import { request } from 'umi';
import { getEnvProperties } from '@/config';

const envProperties = getEnvProperties();
const baseUrl = `${envProperties.flinkManagementUrl}`;

// #region Flink作业作业部署

/**
 * 获取作业部署分页列表
 */
export async function getJobDeploymentPaging(
  params: API.PageParams & {
    instanceName?: string;
    namespace?: string;
    jobName?: string;
  },
) {
  const url = `${baseUrl}/management/flink/job/deployment/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.FlinkJobDeploymentMainViewDTO>>
  >(url, {
    method: 'GET',
    params: {
      instanceName: params.instanceName,
      namespace: params.namespace,
      searchJobName: params.jobName,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.FlinkJobDeploymentMainViewDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

/**
 * 部署Flink作业
 */
export async function deployFlinkJob(body: API.DeployFlinkJobRequest) {
  const url = `${baseUrl}/management/flink/job/deployment`;
  const response = await request<API.ResposneWrapper<API.FlinkJobDeploymentMainDO>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

/**
 * 更新部署Flink作业
 */
export async function deployUpdateFlinkJob(id: number) {
  const url = `${baseUrl}/management/flink/job/deployment/${id}`;
  const response = await request<API.ResposneWrapper<API.FlinkJobDeploymentMainDO>>(url, {
    method: 'PUT',
  });
  return response;
}

/**
 * 启动Flink作业
 */
export async function startFlinkJob(body: API.StartFlinkJobRequest) {
  const url = `${baseUrl}/management/flink/job/deployment/start`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

/**
 * 停止Flink作业
 */
export async function stopFlinkJob(body: API.StopFlinkJobRequest) {
  const url = `${baseUrl}/management/flink/job/deployment/stop`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

/**
 * 重试Flink作业
 */
export async function checkFlinkJobStatus(id: number) {
  const url = `${baseUrl}/management/flink/job/deployment/status-check`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: { id },
  });
  return response;
}

// #endregion

// #region Flink工作空间管理

/**
 * 获取工作空间命名空间映射
 */
export async function getWorkspaceNamespaceMap() {
  const url = `${baseUrl}/management/flink/workspace/namespace-map`;
  const response = await request<API.ResposneWrapper<API.WorkspaceNamespaceMapDTO>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #endregion

// #region GitLab项目管理

/**
 * 获取可用的GitLab项目列表
 */
export async function listAvailableProjects() {
  const url = `${baseUrl}/management/gitlab/projects/available`;
  const response = await request<API.ResposneWrapper<API.GitlabProjectDTO[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #endregion

// #region Flink作业部署事件管理

/**
 * 根据主表ID获取部署事件列表
 */
export async function getEventsByMainId(mainId: number): Promise<API.FlinkJobDeploymentEventDTO[]> {
  const url = `${baseUrl}/management/flink/job/deployment/events/${mainId}`;
  const response = await request<API.ResposneWrapper<API.FlinkJobDeploymentEventDTO[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

/**
 * 获取作业资源配置
 */
export async function getJobResourceConfig(id: number): Promise<API.JobResourceConfigDTO> {
  const url = `${baseUrl}/management/flink/job/deployment/resource-config`;
  const response = await request<API.ResposneWrapper<API.JobResourceConfigDTO>>(url, {
    method: 'GET',
    params: { id },
  });
  return response.data!;
}

/**
 * 更新作业资源配置
 */
export async function updateJobResourceConfig(params: {
  id: number;
  jobManagerCpu: number;
  jobManagerMemory: number;
  taskManagerCpu: number;
  taskManagerMemory: number;
  resourceSettingMode?: string;
}): Promise<number> {
  const url = `${baseUrl}/management/flink/job/deployment/resource-config`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: params,
  });
  return response.data!;
}

/**
 * 申请解锁
 */
export async function getLock(id: number) {
  const url = `${baseUrl}/management/flink/job/deployment/getLock`;
  const response = await request<API.ResposneWrapper<any>>(url, {
    method: 'POST',
    params: { id },
  });
  return response;
}

// #endregion

// #region Flinkcatalog发布

/**
 * 获取发布分页列表
 */
export async function getDataPublishPaging(
  params: API.PageParams & {
    instanceName?: string;
    namespace?: string;
    projectName?: string;
  },
) {
  const url = `${baseUrl}/management/flink/data/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.FlinkDataPublishViewDTO>>
  >(url, {
    method: 'GET',
    params: {
      instanceName: params.instanceName,
      namespace: params.namespace,
      projectName: params.projectName,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.FlinkDataPublishViewDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

/**
 * 执行Flink发布
 */
export async function executeFlinkData(body: API.ExecuteFlinkDataRequest) {
  const url = `${baseUrl}/management/flink/data/execute`;
  const response = await request<API.ResposneWrapper<any>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

// #endregion

// #region 操作日志管理

/**
 * 获取操作日志分页列表
 */
export async function getOperationLogPaging(
  params: API.PageParams & {
    operatorName?: string;
  },
) {
  const url = `${baseUrl}/management/operation-log/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.OperationLogResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      operatorName: params.operatorName,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.OperationLogResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

// #endregion
