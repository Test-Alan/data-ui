import { request } from 'umi';
import { getEnvProperties } from '@/config';

/**
 * 获取变量分页列表
 */
export async function getVariablePaging(params: {
  searchVariableName?: string;
  instanceName?: string;
  namespace?: string;
  pageNum?: number;
  pageSize?: number;
}) {
  const config = getEnvProperties();
  const response = await request(`${config.flinkManagementUrl}/management/flink/variables/paging`, {
    method: 'GET',
    params: {
      searchVariableName: params.searchVariableName,
      instanceName: params.instanceName,
      namespace: params.namespace,
      pageNum: params.pageNum || 1,
      pageSize: params.pageSize || 10,
    },
  });
  
  // 确保返回正确的数据结构
  return response?.data || response;
}

/**
 * 发布变量
 */
export async function publishVariable(data: API.PublishVariableRequest) {
  const config = getEnvProperties();
  const response = await request(`${config.flinkManagementUrl}/management/flink/variables`, {
    method: 'POST',
    data,
  });
  
  // 返回影响行数
  return response?.data || response;
}

/**
 * 删除变量
 */
export async function deleteVariable(id: number) {
  const config = getEnvProperties();
  const response = await request(`${config.flinkManagementUrl}/management/flink/variables/${id}`, {
    method: 'DELETE',
  });
  
  // 返回影响行数
  return response?.data || response;
} 