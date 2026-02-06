import type { RequestData } from '@ant-design/pro-table';
import { request } from 'umi';
import { getEnvProperties } from '@/config';

const envProperties = getEnvProperties();
const baseUrl = `${envProperties.hermesDataExtensionUrl}`;

// #region Kafka实例配置

export async function listKafkaInstanceConfigIdNames() {
  const url = `${baseUrl}/management/kafka-instance-config/id_names`;
  const response = await request<API.KeyValueDTO<number, string>[]>(url, {
    method: 'GET',
  });
  return response;
}

// #endregion

// #region Kafka偏移量配置管理

export async function saveKafkaOffsetConfig(body: API.KafkaOffsetConfigSaveRequestDTO) {
  const url = `${baseUrl}/management/kafka-offset-config/save`;
  const response = await request<API.KafkaOffsetConfigResponseDTO>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function updateKafkaOffsetById(body: API.KafkaOffsetConfigUpdateRequestDTO) {
  const url = `${baseUrl}/management/kafka-offset-config/update-offset`;
  const response = await request<API.KafkaOffsetConfigResponseDTO>(url, {
    method: 'POST',
    data: body,
  });
  return response;
}

export async function deleteKafkaOffsetConfigById(id: number) {
  const url = `${baseUrl}/management/kafka-offset-config`;
  const response = await request(url, {
    method: 'DELETE',
    params: {
      id: id,
    },
  });
  return response;
}

export async function getKafkaOffsetConfigPaging(
  params: API.PageParams & {
    intanceName?: string;
    groupName?: string;
    topic?: string;
    partitionId?: number;
    appName?: string;
    useHermesKafka?: number;
  },
) {
  const url = `${baseUrl}/management/kafka-offset-config/paging`;
  const response = await request<API.NormPagingResult<API.KafkaOffsetConfigResponseDTO>>(url, {
    method: 'GET',
    params: {
      intanceName: params.intanceName,
      groupName: params.groupName,
      topic: params.topic,
      partitionId: params.partitionId,
      appName: params.appName,
      useHermesKafka: params.useHermesKafka,
      pageNum: params.current || 1,
      pageSize: params.pageSize || 10,
    },
  });
  const result: Partial<RequestData<API.KafkaOffsetConfigResponseDTO>> = {
    data: response.list,
    total: response.total,
  };
  return result;
}

// #endregion
