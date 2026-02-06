declare namespace API {
  type SaveSyncTableRequestDTO = {
    datasourceId: number;
    schemaName: string;
    tableName: string;
    batchSize: number;
    relayFlag: number;
    mqIds: number[];
    memberIds: number[];
  };

  type SyncTableResponseDTO = {
    id: number;
    datasourceId: number;
    datasourceName: string;
    schemaName: string;
    tableName: string;
    batchSize: number;
    enableStatus: number;
    hasMqTopic: boolean;
    createTime: number;
    updateTime: number;
    mqConsumeTps: number;
    mqDiffTotal: number;
    relayFlag: number;
    memberNames: string;
    mqNames: string;
  };

  type SaveClientInfoRequestDTO = {
    clientName: string;
    clientIp: string;
    clientDescription: string;
    clientLabel: string;
    targetDatasourceId: number;
    type: number;
    targetDatasourceIds: string;
  };

  type UpdateClientInfoRequestDTO = {
    clientName: string;
    clientIp: string;
    clientDescription: string;
    clientLabel: string;
    targetDatasourceId: number;
    type: number;
    targetDatasourceIds: string;
  };

  type ClientInfoResponseDTO = {
    id: number;
    clientName: string;
    clientIp: string;
    enableStatus: number;
    clientDescription: string;
    onlineNumber: number;
    clientLabel: string;
    targetDatasourceId: number;
    type: number;
    targetDatasourceIds: string;
  };

  type SaveClientTableRequestDTO = {
    clientId: number;
    syncTableIds: number[];
    targetDatasourceId: number;
    targetSchemaName: string;
    targetTableName: string;
  };

  type ClientTableResponseDTO = {
    id: number;
    clientId: number;
    syncTableId: number;
    clientName: string;
    clientInfoEnableStatus: number;
    schemaName: string;
    tableName: string;
    syncTableEnableStatus: number;
    binlogVersion: number;
    binlogPosition: number;
    targetDatasourceId: number;
    targetSchemaName: string;
    targetTableName: string;
    hashFieldName: string;
    syncModeName: string;
    enableIncremental: number;
  };

  type UpgradeBinlogRequestDTO = {
    clientTableId: number;
    binlogPosition: number;
  };

  type OpenHashSyncRequestDTO = {
    clientTableId: number;
    hashFieldName: string;
  };

  type DataCheckConfigResponseDTO = {
    id: number;
    clientTableId: number;
    clientName: string;
    sourceDatasourceName: string;
    sourceSchemaName: string;
    sourceTableName: string;
    targetDatasourceName: string;
    targetSchemaName: string;
    targetTableName: string;
    enableStatus: number;
    createTime: number;
    updateTime: number;
  };

  type DataCheckResultResponseDTO = {
    id: number;
    clientTableId: number;
    clientName: string;
    sourceDatasourceName: string;
    sourceSchemaName: string;
    sourceTableName: string;
    sourceCount: number;
    targetDatasourceName: string;
    targetSchemaName: string;
    targetTableName: string;
    targetCount: number;
    difference: number;
    batchId: number;
    createTime: number;
    updateTime: number;
  };

  type PageResponseWrapper<T> = {
    list: T[];
    total: number;
  };

  type BinlogStatResponseDTO = {
    id: number;
    schemaName: string;
    tableName: string;
    binlogCount: number;
    binlogLastTime: string;
    createTime: string;
    updateTime: string;
  };

  type TableBinlogResponseDTO = {
    id: number;
    msgId: string;
    topic: string;
    schemaName: string;
    tableName: string;
    ddlStatus: number;
    binlogContent: string;
    binlogType: string;
    binlogTs: number;
  };

  type BinlogStatPagingDTO = {
    pageSize?: number;
    current?: number;
    schemaName?: string;
    tableName?: string;
    sorter?: any;
  };
}
