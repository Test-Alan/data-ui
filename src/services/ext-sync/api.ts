import type { RequestData } from '@ant-design/pro-table';
import { request } from 'umi';
import { getEnvProperties } from '@/config';

const envProperties = getEnvProperties();
const baseUrl = `${envProperties.extSyncUrl}`;

export async function listCdcIdNames() {
  const url = `${baseUrl}/management/cdc/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #region jdbc datasource

export async function getJdbcDatasourcePaing(
  params: API.PageParams & { name?: string; description?: string },
) {
  const url = `${baseUrl}/management/jdbc/datasources/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.JdbcDatasourceResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      searchName: params.name,
      searchDescription: params.description,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.JdbcDatasourceResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function addJdbcDatasource(body: API.AddJdbcDatasourceRequestDTO) {
  const url = `${baseUrl}/management/jdbc/datasources`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function updateJdbcDatasource(id: number, body: API.UpdateJdbcDatasourceRequestDTO) {
  const url = `${baseUrl}/management/jdbc/datasources`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: id,
    },
    data: body,
  });
  return response;
}

export async function deleteJdbcDatasource(id: number) {
  const url = `${baseUrl}/management/jdbc/datasources`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function updateDts(instanceId: string) {
  const url = `${baseUrl}/management/cdc/modifyDtsJob`;
  const response = await request<API.ResposneWrapper<string>>(url, {
    method: 'POST',
    params: {
      instanceId: instanceId,
    },
  });
  return response;
}

export async function addCdc(body: API.AddCdcInstanceInfoRequestDTO) {
  const url = `${baseUrl}/management/cdc`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function deleteCdc(id: number) {
  const url = `${baseUrl}/management/cdc`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function listCdcPaing(
  params: API.PageParams & { instanceId?: string; description?: string },
) {
  const url = `${baseUrl}/management/cdc/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.CdcInstanceInfoResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      instanceId: params.instanceId,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.CdcInstanceInfoResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function listJdbcDatasourceIdNames() {
  const url = `${baseUrl}/management/jdbc/datasources/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #endregion

// #region jdbc target datasource

export async function getJdbcTargetDatasourcePaing(
  params: API.PageParams & { name?: string; description?: string },
) {
  const url = `${baseUrl}/management/jdbc/target/datasource/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.JdbcDatasourceResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      searchName: params.name,
      searchDescription: params.description,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.JdbcDatasourceResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function addJdbcTargetDatasource(body: API.AddJdbcDatasourceRequestDTO) {
  const url = `${baseUrl}/management/jdbc/target/datasource`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function updateJdbcTargetDatasource(
  id: number,
  body: API.UpdateJdbcDatasourceRequestDTO,
) {
  const url = `${baseUrl}/management/jdbc/target/datasource`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: id,
    },
    data: body,
  });
  return response;
}

export async function deleteJdbcTargetDatasource(id: number) {
  const url = `${baseUrl}/management/jdbc/target/datasource`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function listJdbcTargetDatasourceIdNames() {
  const url = `${baseUrl}/management/jdbc/target/datasource/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #endregion

// #region sync table

export async function saveSyncTable(body: API.SaveSyncTableRequestDTO) {
  const url = `${baseUrl}/management/sync/tables`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response.data!;
}

export async function updateSyncTable(id: number, body: API.SaveSyncTableRequestDTO) {
  const url = `${baseUrl}/management/sync/tables`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: id,
    },
    data: body,
  });
  return response;
}

export async function enableSyncTable(syncTableId: number) {
  const url = `${baseUrl}/management/sync/tables/enable`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: syncTableId,
    },
  });
  return response;
}

export async function disableSyncTable(syncTableId: number) {
  const url = `${baseUrl}/management/sync/tables/disable`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: syncTableId,
    },
  });
  return response;
}

export async function deleteSyncTable(syncTableId: number) {
  const url = `${baseUrl}/management/sync/tables`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: syncTableId,
    },
  });
  return response;
}

export async function getSyncTablesPaging(
  params: API.PageParams & {
    datasourceName?: string;
    schemaName?: string;
    tableName?: string;
    enableStatus?: boolean;
    memberNames?: string;
  },
) {
  const url = `${baseUrl}/management/sync/tables/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.SyncTableResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      searchDatasourceName: params.datasourceName,
      searchSchemaName: params.schemaName,
      searchTableName: params.tableName,
      searchMemberName: params.memberNames,
      enableStatus: params.enableStatus,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.SyncTableResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function listSyncTableIdNames() {
  const url = `${baseUrl}/management/sync/tables/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #endregion

// #region client info

export async function saveClientInfo(body: API.SaveClientInfoRequestDTO) {
  const url = `${baseUrl}/management/client/infos`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response.data!;
}

export async function updateClientInfo(id: number, body: API.UpdateClientInfoRequestDTO) {
  const url = `${baseUrl}/management/client/infos`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: id,
    },
    data: body,
  });
  return response;
}

export async function enableClientInfo(clientId: number) {
  const url = `${baseUrl}/management/client/infos/enable`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: clientId,
    },
  });
  return response;
}

export async function disableClientInfo(clientId: number) {
  const url = `${baseUrl}/management/client/infos/disable`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    params: {
      id: clientId,
    },
  });
  return response;
}

export async function deleteClientInfo(clientId: number) {
  const url = `${baseUrl}/management/client/infos`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: clientId,
    },
  });
  return response;
}

export async function getClientInfoPaging(
  params: API.PageParams & {
    clientName?: string;
    enableStatus?: boolean;
    clientIp?: string;
    clientLable?: string;
  },
) {
  const url = `${baseUrl}/management/client/infos/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.ClientInfoResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      searchClientName: params.clientName,
      enableStatus: params.enableStatus,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
      clientIp: params.clientIp,
      clientLable: params.clientLable,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.ClientInfoResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function listClientInfoIdNames() {
  const url = `${baseUrl}/management/client/infos/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

export async function getClientInfo(id: number) {
  const url = `${baseUrl}/management/client/infos/${id}`;
  const response = await request<API.ResposneWrapper<API.ClientInfoResponseDTO>>(url, {
    method: 'GET',
  });
  return response.data!;
}

export async function enableIncremental(id: number) {
  const url = `${baseUrl}/management/client/infos/enable/incremental`;
  const response = await request<API.ResposneWrapper<string>>(url, {
    method: 'PUT',
    params: {
      id: id,
    },
  });
  return response;
}

// #endregion

// #region client table

export async function saveClientTable(body: API.SaveClientTableRequestDTO) {
  const url = `${baseUrl}/management/client/tables`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response.data!;
}

export async function deleteClientTable(clientTableId: number) {
  const url = `${baseUrl}/management/client/tables`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: clientTableId,
    },
  });
  return response;
}

export async function upgradeBinlog(body: API.UpgradeBinlogRequestDTO) {
  const url = `${baseUrl}/management/client/tables/binlog/upgrade`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    data: body,
  });
  return response.data!;
}

export async function openHashSync(body: API.OpenHashSyncRequestDTO) {
  const url = `${baseUrl}/management/client/tables/hashsync/open`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'PUT',
    data: body,
  });
  return response.data!;
}

export async function listHashFieldNames(id: number) {
  const url = `${baseUrl}/management/client/tables/hashsync/fields?clientTableId=${id}`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<string, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

export async function getClientTablePaging(
  params: API.PageParams & {
    clientName?: string;
    schemaName?: string;
    tableName?: string;
    clientInfoEnableStatus?: boolean;
    syncTableEnableStatus?: boolean;
    syncTableId?: number;
    enableIncremental?: number;
  },
) {
  const url = `${baseUrl}/management/client/tables/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.ClientTableResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      searchClientName: params.clientName,
      searchSchemaName: params.schemaName,
      searchTableName: params.tableName,
      clientInfoEnableStatus: params.clientInfoEnableStatus,
      syncTableEnableStatus: params.syncTableEnableStatus,
      syncTableId: params.syncTableId,
      enableIncremental: params.enableIncremental,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.ClientTableResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

// #region table binlog

export async function getTableBinlogPositionByTime(
  schemaName: string,
  tableName: string,
  datetime: string,
) {
  const url = `${baseUrl}/management/table/binlogs/time/position`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'GET',
    params: {
      schemaName: schemaName,
      tableName: tableName,
      time: datetime,
    },
  });
  return response.data!;
}

export async function listTableBinlog(params: {
  schemaName: string;
  tableName: string;
  queryFieldName: string;
  queryFieldValue: string;
  binlogType?: string;
  startTime?: string;
  endTime?: string;
}) {
  const { schemaName, tableName, ...restParams } = params;
  const url = `${baseUrl}/management/table/binlogs/${schemaName}/${tableName}`;
  const response = await request<API.ResposneWrapper<API.TableBinlogResponseDTO[]>>(url, {
    method: 'GET',
    params: restParams,
  });
  return response.data!;
}

// #endregion

export async function downloadApp(clientId: number, databaseType: number) {
  const url = `${baseUrl}/management/client/infos/app/download?clientId=${clientId}&databaseType=${databaseType}`;
  await downloadFileFromFileUrl(url, 'ext-sync-client.zip');
}

async function downloadFileFromFileUrl(url: string, fileName: string) {
  return new Promise<void>((r) => {
    console.log('url:' + url + '  fileName: ' + fileName);
    const elink = document.createElement('a');
    elink.style.display = 'none';
    elink.href = url;
    elink.download = fileName;
    document.body.appendChild(elink);
    elink.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(elink);
    r();
  });
}

export async function listMqIdNames() {
  const url = `${baseUrl}/management/mq/config/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

export async function addUser(body: API.AddUserRequestDTO) {
  const url = `${baseUrl}/management/user`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function deleteUser(id: number) {
  const url = `${baseUrl}/management/user`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function listUserPaing(params: API.PageParams & { name?: string }) {
  const url = `${baseUrl}/management/user/paging`;
  const response = await request<API.ResposneWrapper<API.NormPagingResult<API.UserResponseDTO>>>(
    url,
    {
      method: 'GET',
      params: {
        name: params.name,
        pageNum: params.current || 1,
        pageSize: params.pageSize || 10,
      },
    },
  );
  const responseData = response.data!;
  const result: Partial<RequestData<API.UserResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function addMember(body: API.AddUserRequestDTO) {
  const url = `${baseUrl}/management/member`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function deleteMember(id: number) {
  const url = `${baseUrl}/management/member`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function listMemberPaing(params: API.PageParams & { name?: string }) {
  const url = `${baseUrl}/management/member/paging`;
  const response = await request<API.ResposneWrapper<API.NormPagingResult<API.MemberResponseDTO>>>(
    url,
    {
      method: 'GET',
      params: {
        searchName: params.name,
        pageNum: params.current || 1,
        pageSize: params.pageSize || 10,
      },
    },
  );
  const responseData = response.data!;
  const result: Partial<RequestData<API.MemberResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function listMemberIdNames() {
  const url = `${baseUrl}/management/member/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

export async function addShardingConfig(body: API.AddShardingConfigRequestDTO) {
  const url = `${baseUrl}/management/sharding/config`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function deleteShardingConfig(id: number) {
  const url = `${baseUrl}/management/sharding/config`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function listShardingConfigPaing(
  params: API.PageParams & { logicalTablePrefix?: string },
) {
  const url = `${baseUrl}/management/sharding/config/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.ShardingConfigResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      logicTablePrefix: params.logicalTablePrefix,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.ShardingConfigResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function listShardingRules() {
  const url = `${baseUrl}/management/sharding/config/listShardingRules`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #region reader dynamic config

export async function addReaderDynamicConfig(body: API.AddReaderDynamicConfigRequestDTO) {
  const url = `${baseUrl}/management/reader/dynamic/config`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function deleteReaderDynamicConfig(id: number) {
  const url = `${baseUrl}/management/reader/dynamic/config`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function listReaderDynamicConfigPaging(
  params: API.PageParams & { logicalTablePrefix?: string },
) {
  const url = `${baseUrl}/management/reader/dynamic/config/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.ReaderDynamicConfigResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      logicTablePrefix: params.logicalTablePrefix,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.ReaderDynamicConfigResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function listReaderDynamicConfigShardingRules() {
  const url = `${baseUrl}/management/reader/dynamic/config/listShardingRules`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #endregion

// #region writer dynamic config

export async function addWriterDynamicConfig(body: API.AddWriterDynamicConfigRequestDTO) {
  const url = `${baseUrl}/management/writer/dynamic/config`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function deleteWriterDynamicConfig(id: number) {
  const url = `${baseUrl}/management/writer/dynamic/config`;
  const response = await request<API.ResposneWrapper<number>>(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function listWriterDynamicConfigPaging(
  params: API.PageParams & { logicalTablePrefix?: string },
) {
  const url = `${baseUrl}/management/writer/dynamic/config/paging`;
  const response = await request<
    API.ResposneWrapper<API.NormPagingResult<API.WriterDynamicConfigResponseDTO>>
  >(url, {
    method: 'GET',
    params: {
      logicTablePrefix: params.logicalTablePrefix,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const responseData = response.data!;
  const result: Partial<RequestData<API.WriterDynamicConfigResponseDTO>> = {
    data: responseData.list,
    total: responseData.total,
  };
  return result;
}

export async function listWriterDynamicConfigIdNames() {
  const url = `${baseUrl}/management/writer/dynamic/config/id_names`;
  const response = await request<API.ResposneWrapper<API.KeyValueDTO<number, string>[]>>(url, {
    method: 'GET',
  });
  return response.data!;
}

// #endregion

// #region batch import

export async function batchImportCreateSyncTask(file: File): Promise<API.ResposneWrapper<number>> {
  const url = `${baseUrl}/management/batch/import/createSyncTask`;
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    
    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('解析响应失败'));
        }
      } else {
        reject(new Error(`请求失败: ${xhr.status}`));
      }
    };
    
    xhr.onerror = function () {
      reject(new Error('网络错误'));
    };
    
    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}

// #endregion