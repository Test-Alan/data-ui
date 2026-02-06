declare namespace API {
  // Flink作业部署相关类型
  type FlinkJobDeploymentMainViewDTO = {
    id: number;
    instanceName: string;
    namespace: string;
    yunFolderName: string;
    projectName: string;
    filepath: string;
    branch?: string;
    deploymentErrMsg?: string;
    jobState: number;
    jobName?: string;
    createTime: number;
    updateTime: number;
    jobStateDesc: string;
    yunDeploymentDraftId?: string;
    yunDeploymentId?: string;
    workspace?: string;
  };

  type FlinkJobDeploymentMainDO = {
    id: number;
    instanceName: string;
    namespace: string;
    yunFolderName: string;
    projectName: string;
    filepath: string;
    deploymentErrMsg?: string;
    jobState: string;
    yunJobId?: string;
    createTime: number;
    updateTime: number;
  };

  type DeployFlinkJobRequest = {
    instanceName: string;
    namespace: string;
    gitlabProjectId: number;
    filepath: string;
    branch: string;
  };

  type StartFlinkJobRequest = {
    id: number;
    startType: number; // 1-不使用状态(NONE)；2-使用最新状态(LATEST_STATE)
  };

  type StopFlinkJobRequest = {
    id: number;
    stopType: number; // 1-直接停止(CANCEL)；2-生成作业快照后停止(STOP_WITH_SAVEPOINT)
  };

  // Flink工作空间相关类型
  type WorkspaceNamespaceMapDTO = {
    [instanceName: string]: string[]; // 实例名称 -> 命名空间列表
  };

  // GitLab项目相关类型
  type GitlabProjectDTO = {
    id: number;
    projectId: number;
    projectName: string;
    description?: string;
    apiUrl: string;
    accessToken: string;
  };

  // Flink作业部署事件相关类型
  type FlinkJobDeploymentEventDTO = {
    id: number;
    mainId: number;
    yunRequestId?: string;
    eventName: string;
    eventContent?: string;
    eventTime: number;
    createTime: number;
  };

  // Flink工作空间管理相关类型
  type FlinkWorkspaceResponseDTO = {
    id: number;
    instanceId: string;
    instanceName: string;
    workspace: string;
    namespace: string;
    createTime: number;
    updateTime: number;
  };

  type CreateFlinkWorkspaceRequest = {
    instanceId: string;
    instanceName: string;
    workspace: string;
    namespace: string;
  };

  // Flink变量管理相关类型
  type FlinkVariablePublishViewDTO = {
    id: number;
    workspaceId: number;
    variableName: string;
    variableValue: string;
    publishState: number; // 1发布中 2发布失败 3发布成功
    type: number; // 1加密 2不加密
    createTime: number;
    updateTime: number;
    instanceId: string;
    instanceName: string;
    workspace: string;
    namespace: string;
  };

  type PublishVariableRequest = {
    type: number; // 1加密 2不加密
    name: string;
    value: string;
    namespace: string;
    instanceName: string;
  };

  /**
   * 作业资源配置DTO
   */
  interface JobResourceConfigDTO {
    id: number;
    yunDeploymentId: string;
    jobManagerCpu: number;
    jobManagerMemory: number;
    taskManagerCpu: number;
    taskManagerMemory: number;
    resourceSettingMode: string;
  }

  // Flinkcatalog发布相关类型
  type FlinkDataPublishViewDTO = {
    id: number;
    instanceName: string;
    namespace: string;
    projectName: string;
    filepath: string;
    branch?: string;
    publishState: number;
    publishErrMsg?: string;
    createTime: number;
    updateTime: number;
  };

  type ExecuteFlinkDataRequest = {
    instanceName: string;
    namespace: string;
    gitlabProjectId: number;
    filepath: string;
    branch: string;
  };

  // 操作日志相关类型
  type OperationLogResponseDTO = {
    id: number;
    operatorName: string;
    requestUrl: string;
    requestParam: string;
    createTime: number;
    updateTime: number;
  };
}
