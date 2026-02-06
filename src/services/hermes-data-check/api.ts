import { request } from 'umi';
import { getEnvProperties } from '@/config';
import type { RequestData } from '@ant-design/pro-table';

const envProperties = getEnvProperties();
const baseUrl = `${envProperties.hermesDataCheckUrl}`;

/**
 * 检查目标表唯一索引并通知
 * @param clientId 客户端ID
 * @returns 提交任务数量
 */
export async function checkUniqueIndexAndNotify(clientId: number) {
  const url = `${baseUrl}/management/unique-index-check`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    params: {
      clientId: clientId,
    },
  });
  return response;
}

/**
 * 检查目标表是否存在并通知
 * @param clientId 客户端ID
 * @returns 提交任务数量
 */
export async function checkTableExistAndNotify(clientId: number) {
  const url = `${baseUrl}/management/table-exist-check`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    params: {
      clientId: clientId,
    },
  });
  return response;
}

/**
 * 执行客户端检查
 * @param id 客户端ID
 * @returns 响应结果
 */
export async function executeByClient(id: number) {
  const url = `${baseUrl}/management/data-check/executeByClient`;
  const response = await request<API.ResposneWrapper<string>>(url, {
    method: 'POST',
    params: {
      clientId: id,
    },
  });
  return response;
}

/**
 * 执行全部检查
 * @returns 响应结果
 */
export async function executeAll() {
  const url = `${baseUrl}/management/data-check/executeAll`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
  });
  return response;
}

export async function listDataCheckConfigPage(
  params: API.PageParams & {
    clientName?: string;
    sourceSchemaName?: string;
    sourceTableName?: string;
    targetSchemaName?: string;
    targetTableName?: string;
    enableStatus?: boolean;
  },
) {
  const url = `${baseUrl}/management/data-check-config/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.DataCheckConfigResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      clientName: params.clientName,
      sourceSchemaName: params.sourceSchemaName,
      sourceTableName: params.sourceTableName,
      targetSchemaName: params.targetSchemaName,
      targetTableName: params.targetTableName,
      enableStatus: params.enableStatus,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.DataCheckConfigResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function enableDataCheckConfig(id: number) {
  const url = `${baseUrl}/management/data-check-config/enable`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: id,
    },
  });
  return response;
}

export async function disableDataCheckConfig(id: number) {
  const url = `${baseUrl}/management/data-check-config/disable`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: id,
    },
  });
  return response;
}

export async function updateCheckConfig() {
  const url = `${baseUrl}/management/data-check-config/update`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
  });
  return response;
}

export async function listDataCheckResultPage(
  params: API.PageParams & {
    clientName?: string;
    sourceSchemaName?: string;
    sourceTableName?: string;
    targetSchemaName?: string;
    targetTableName?: string;
    batchId?: number;
    difference?: number;
  },
) {
  const url = `${baseUrl}/management/data-check-result/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.DataCheckResultResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      clientName: params.clientName,
      sourceSchemaName: params.sourceSchemaName,
      sourceTableName: params.sourceTableName,
      targetSchemaName: params.targetSchemaName,
      targetTableName: params.targetTableName,
      batchId: params.batchId,
      difference: params.difference,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.DataCheckResultResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}