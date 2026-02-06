import { request } from 'umi';
import { getEnvProperties } from '@/config';

/**
 * 获取工作空间分页列表
 */
export async function getWorkspacePaging(params: {
  searchInstanceName?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const config = getEnvProperties();
  const response = await request(`${config.flinkManagementUrl}/management/flink/workspace/paging`, {
    method: 'GET',
    params: {
      searchInstanceName: params.searchInstanceName,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
    },
  });
  
  // 确保返回正确的数据结构
  return response?.data || response;
}

/**
 * 创建工作空间
 */
export async function createWorkspace(data: API.CreateFlinkWorkspaceRequest) {
  const config = getEnvProperties();
  const response = await request(`${config.flinkManagementUrl}/management/flink/workspace`, {
    method: 'POST',
    data,
  });
  
  // 返回影响行数
  return response?.data || response;
} 