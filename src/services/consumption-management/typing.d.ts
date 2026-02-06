declare namespace API {
  // Kafka偏移量配置保存请求DTO
  type KafkaOffsetConfigSaveRequestDTO = {
    /** Kafka实例配置主键ID */
    kicId: number;
    /** 消费组 */
    groupName: string;
    /** 分区号 */
    partitionId: number;
    /** 偏移量 */
    offset: number;
    /** 主题 */
    topic: string;
    /** 是否使用HermesKafka框架（1是，0否） */
    useHermesKafka?: number;
  };

  // Kafka偏移量配置更新请求DTO
  type KafkaOffsetConfigUpdateRequestDTO = {
    /** 主键ID */
    id: number;
    /** 偏移量 */
    offset: number;
  };

  // Kafka偏移量配置响应DTO
  type KafkaOffsetConfigResponseDTO = {
    /** 主键ID */
    id: number;
    /** Kafka实例名称 */
    instanceName?: string;
    /** 消费组 */
    groupName: string;
    /** 分区号 */
    partitionId: number;
    /** 偏移量 */
    offset: number;
    /** 主题 */
    topic: string;
    /** 创建时间 */
    createTime: string;
    /** 更新时间 */
    updateTime: string;
    /** 应用名称 */
    appName?: string;
    /** 是否使用HermesKafka框架（1是，0否） */
    useHermesKafka?: number;
  };
}
