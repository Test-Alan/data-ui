declare namespace API {
  type ResposneWrapper<T> = {
    code: number;
    data?: T;
    errorMessage?: string;
    success?: boolean;
  };

  type NormPagingResult<T> = {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    list: T[];
    pageNum: number;
    pageSize: number;
    pages: number;
    total: number;
  };

  type KeyValueDTO<K, V> = {
    key: K;
    value: V;
  };

  type JdbcDatasourceResponseDTO = {
    id: number;
    name: string;
    jdbcUrl: string;
    jdbcUsername: string;
    jdbcPassword: string;
    description?: string;
    createTime: number;
    updateTime: number;
    instanceName: string;
    instanceId: string;
  };

  type AddJdbcDatasourceRequestDTO = {
    cdcId: number;
    name: string;
    jdbcUsername: string;
    jdbcPassword: string;
    jdbcUrl: string;
    description?: string;
  };

  type UpdateJdbcDatasourceRequestDTO = {
    jdbcUsername: string;
    jdbcPassword: string;
    jdbcUrl: string;
    description?: string;
  };

  type AddCdcInstanceInfoRequestDTO = {
    instanceId: string;
    name: string;
    regionId: string;
    ddlTopic: string;
    description?: string;
    type: number;
  };

  type CdcInstanceInfoResponseDTO = {
    id: number;
    instanceId: string;
    name: string;
    type: number;
    regionId: string;
    ddlTopic: string;
    description?: string;
  };

  type AddUserRequestDTO = {
    name: string;
    password: string;
    roleType: number;
  };

  type UserResponseDTO = {
    id: number;
    name: string;
    password: string;
    roleType: number;
    enableStatus: number;
  };

  type MemberResponseDTO = {
    id: number;
    name: string;
    groupName: string;
  };

  type AddShardingConfigRequestDTO = {
    datasourceId: number;
    sourceSchemaName: string;
    logicalTablePrefix: string;
    clientId: number;
    targetDatasourceId: number;
    targetSchemaName: string;
    shardingRule: number;
  };

  type ShardingConfigResponseDTO = {
    id: number;
    sourceDatasourceName: string;
    sourceSchemaName: string;
    logicalTablePrefix: string;
    clientName: string;
    targetDatasourceName: string;
    targetSchemaName: string;
    shardingRule: number;
  };

  type AddReaderDynamicConfigRequestDTO = {
    name: string;
    sourceDatasourceId: number;
    sourceSchemaName: string;
    logicalTablePrefix: string;
    shardingRule: number;
  };

  type ReaderDynamicConfigResponseDTO = {
    id: number;
    name?: string;
    sourceDatasourceName: string;
    sourceSchemaName: string;
    logicalTablePrefix: string;
    shardingRuleName: string;
    createTime?: string | number;
    updateTime?: string | number;
  };

  type AddWriterDynamicConfigRequestDTO = {
    clientId: number;
    readerDynamicConfigId: number;
    targetDatasourceId: string;
    targetSchemaName: string;
    targetLogicalTablePrefix?: string;
  };

  type WriterDynamicConfigResponseDTO = {
    id: number;
    clientName: string;
    sourceDatasourceName: string;
    sourceSchemaName: string;
    logicalTablePrefix: string;
    shardingRuleName: string;
    targetSchemaName: string;
    targetDatasourceName: string;
    targetLogicalTablePrefix: string;
    createTime?: string | number;
    updateTime?: string | number;
  };

  type BinlogHourStatResponseDTO = {
    schemaName: string;
    tableName: string;
    binlogCount: number;
    hourPoint: number;
    updateDate: string;
  };

  type BinlogCountLastOneMinuteDTO = {
    schemaName: string;
    tableName: string;
    binlogCount: number;
    startTime: number;
    endTime: number;
  };
}
