import { request } from 'umi';
import { getEnvProperties } from '@/config';

const envProperties = getEnvProperties();
const baseUrl = `${envProperties.hermesDataInsightUrl}`;

// #region binlog statistics
export async function getBinlogStatPaging(params: API.BinlogStatPagingDTO) {
  const url = `${baseUrl}/management/binlog/stats/paging`;
  
  // 添加调试日志
  console.log('getBinlogStatPaging接收到的参数:', params);
  
  // 从请求参数中提取直接可用的参数，剩下的会统一放到sortParams中
  const { current, pageSize, schemaName, tableName, sorter, ...restParams } = params;
  
  // 默认排序参数
  const sortParams: Record<string, any> = {};
  
  // 如果接收到了排序参数，手动构建排序字段和排序方向
  if (sorter && typeof sorter === 'object') {
    console.log('处理sorter对象:', sorter);
    
    // 情况1: sorter是一个纯对象 {binlogCount: 'descend'}
    const keys = Object.keys(sorter);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const orderValue = sorter[firstKey];
      
      if (orderValue === 'descend' || orderValue === 'ascend') {
        sortParams.sortField = firstKey;
        sortParams.sortOrder = orderValue === 'descend' ? 'desc' : 'asc';
      }
    }
  }
  
  console.log('发送到后端的排序参数:', sortParams);
  
  const response = await request<API.ResposneWrapper<API.PageResponseWrapper<API.BinlogStatResponseDTO>>>(
    url,
    {
      method: 'GET',
      params: {
        pageNum: current || 1,
        pageSize: pageSize || 10,
        schemaName,
        tableName,
        ...sortParams,
        ...restParams,
        sorter: undefined, // 移除原始sorter参数
      },
    },
  );
  return {
    data: response.data?.list || [],
    success: true,
    total: response.data?.total || 0,
  };
}
// 查询更新分布
export async function queryUpdateDistribution(params: { schemaName: string; tableName: string }) {
  const url = `${baseUrl}/management/activity/analysis/data/distribution`;
  const response = await request<API.ResposneWrapper<API.BinlogHourStatResponseDTO[]>>(
    url,
    {
      method: 'GET',
      params,
    },
  );
  return response.data || [];
}

// 获取最近一分钟binlog数据
export async function getBinlogCountLastOneMinute(params: { id: number; binlogLastTime?: number }) {
  const url = `${baseUrl}/management/activity/analysis/minute/count`;
  const response = await request<API.ResposneWrapper<API.BinlogCountLastOneMinuteDTO>>(
    url,
    {
      method: 'POST',
      params,
    },
  );
  return response.data;
}

// #endregion