import React, { useState } from 'react';
import { Card, List, Modal, Typography, Button, message } from 'antd';
import { CodeOutlined, PlayCircleOutlined, CopyOutlined } from '@ant-design/icons';
import './index.less';

const { Title, Text } = Typography;

interface JobTemplate {
  id: string;
  name: string;
  description: string;
  sql: string;
  createTime?: string;
  updateTime?: string;
}

const FlinkJobTemplate: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 初始模板数据
  const jobTemplates: JobTemplate[] = [
    {
      id: '1',
      name: 'MySQL-To-MySQL',
      description: '用于实现将MySQL的数据传输到MySQL',
      sql: `SET 'table.optimizer.source-merge.enabled' = 'true';
-- SET 'table.exec.mini-batch.enabled' = 'true';-- 开启 MiniBatch 模式
-- SET 'table.exec.mini-batch.allow-latency' = '2s';-- 设置 MiniBatch 等待时间
-- SET 'table.exec.mini-batch.size' = '2000';-- 设置 MiniBatch 最大记录数（可选，默认=2000）


BEGIN STATEMENT SET;

INSERT INTO \`polar-general\`.\`{env}_bond_liquidity\`.\`dws_com_price_stat\`
SELECT
    id,
    issue_date,
    com_uni_code,
    stat_period,
    turnover_rate,
    interbank_trade_amount,
    exchange_trade_amount,
    trading_bond_num,
    trading_days,
    trading_num,
    bid_num,
    ofr_num,
    bid_day_num,
    ofr_day_num,
    create_time,
    update_time
FROM
    \`polar-price\`.\`{env}_bond_price_apollo\`.\`dws_com_price_stat\`/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='{server-id}') */
;

INSERT INTO \`polar-general\`.\`{env}_bond_liquidity\`.\`liquidity_score_index_stat\`
SELECT
    id,
    bond_uni_code,
    com_uni_code,
    issue_date,
    liquidity_score_stat_period,
    trading_num,
    turnover_rate,
    broker_trading_days,
    bank_trading_days,
    exchange_trading_days,
    trading_days,
    trade_yield_sub_cb_median,
    trade_yield_sub_cs_median,
    bid_quote_days,
    ofr_quote_days,
    two_side_quote_days,
    bid_num,
    ofr_num,
    bid_yield_sub_ofr_median,
    bid_yield_sub_cb_max,
    cb_yield_sub_ofr_max,
    bid_yield_sub_cb_median,
    cb_yield_sub_ofr_median,
    bid_yield_sub_cs_max,
    cs_yield_sub_ofr_max,
    bid_yield_sub_cs_median,
    cs_yield_sub_ofr_median,
    update_time,
    create_time,
    interbank_trade_amount,
    exchange_trade_amount,
    trade_amount,
    tkn_pct,
    gvn_pct,
    trd_pct,
    bid_ofr_num_ratio
FROM
    \`polar-price\`.\`{env}_bond_price_apollo\`.\`liquidity_score_index_stat\`/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='{server-id}') */
;
END;`,
      createTime: '2024-01-15 11:00:00',
      updateTime: '2024-01-15 11:00:00',
    },
    {
      id: '2',
      name: 'MySQL-To-ES',
      description: '用于实现将MySQL的数据同步到Elasticsearch',
      sql: `--********************************************************************--
-- Author:         wushaoqing
-- Created Time:   2025-07-28 17:26:35
-- Description:    Write your description here
-- Hints:          You can use SET statements to modify the configuration
--********************************************************************--

SET
'table.optimizer.source-merge.enabled' = 'true'
;

-- SET 'table.exec.mini-batch.enabled' = 'true';-- 开启 MiniBatch 模式
-- SET 'table.exec.mini-batch.allow-latency' = '3s';-- 设置 MiniBatch 等待时间
-- SET 'table.exec.mini-batch.size' = '1000';-- 设置 MiniBatch 最大记录数（可选，默认=2000）

CREATE TEMPORARY TABLE sink_bond_issue_agency (
    comUniCode  BIGINT,
    issueAgencyTypeCode BIGINT,
    comFullName STRING,
    PRIMARY KEY (comUniCode,issueAgencyTypeCode)  NOT ENFORCED
)
WITH (
    'connector' = 'elasticsearch-7',
    'hosts' = 'http://\${secret_values.es_general_host}:\${secret_values.es_general_port}',
    'username' = '\${secret_values.es_general_user}',
    'password' = '\${secret_values.es_general_passwd}',
    'index' = '{env}_onshore_bond_issue_agency',
    'format' = 'json'
);

CREATE TEMPORARY VIEW view_bond_issue_agency
As select  a.com_uni_code
        ,a.issue_agency_type
        ,b.party_full_name as com_full_name
   from (SELECT DISTINCT
             a.com_uni_code,a.issue_agency_type
         FROM
             \`mysql-sell\`.\`dm_data_product\`.\`bond_issue_agency\` /*+ OPTIONS ('scan.startup.mode'='initial','server-id'='{server-id}') */ a
         where a.valid_status = 1
        ) a JOIN \`mysql-sell\`.\`dm_data_product\`.\`main_party\` /*+ OPTIONS ('scan.startup.mode'='initial','server-id'='{server-id}') */ b on a.com_uni_code = b.party_uni_code where b.valid_status = 1;


INSERT INTO sink_bond_issue_agency
SELECT * FROM view_bond_issue_agency;`,
      createTime: '2025-07-28 17:26:35',
      updateTime: '2025-07-28 17:26:35',
    },
    {
      id: '3',
      name: 'MySQL多表join-To-kafka',
      description: '到价提醒债券组和规则的映射打平，通过多表join将数据传输到Kafka',
      sql: `--********************************************************************--
-- Author:         zhouhailiang
-- Created Time:   2025-07-17 18:24:16
-- Description:    到价提醒债券组和规则的映射打平
-- Hints:          You can use SET statements to modify the configuration
--********************************************************************--

SET 'table.optimizer.source-merge.enabled' = 'true';
SET 'table.exec.mini-batch.enabled' = 'true';
SET 'table.exec.mini-batch.allow-latency' = '3S';
SET 'table.exec.mini-batch.size' = '1000';

CREATE
TEMPORARY TABLE sink_kafka
(
    configId DECIMAL(20, 0)
    ,userId DECIMAL(20, 0)
    ,alertCategory TINYINT
    ,objType INT
    ,objId DECIMAL(20, 0)
    ,remark STRING
    ,dataSource STRING
    ,popupAlert TINYINT
    ,voiceAlert TINYINT
    ,appAlert TINYINT
    ,conditionType INT
    ,alertOpportunity INT
    ,conditionJson STRING
    ,filterIntentionQuote BOOLEAN
    ,bondUniCode DECIMAL(20, 0)
)
WITH (
    'connector' = 'kafka'
    ,'topic' = 'price_alert_bond_rule'
    ,'properties.bootstrap.servers' = '\${secret_values.kafka_bondbiz_servers}'
    ,'properties.compression.type' = 'gzip'
    ,'format' = 'canal-json'
);

BEGIN STATEMENT SET;
-- 债券
INSERT INTO sink_kafka
SELECT config.id                    AS configId
     , config.user_id               AS userId
     , config.alert_category        AS alertCategory
     , config.obj_type              AS objType
     , config.obj_id                AS objId
     , config.remark                AS remark
     , config.data_source           AS dataSource
     , config.popup_alert           AS popupAlert
     , config.voice_alert           AS voiceAlert
     , config.app_alert             AS appAlert
     , condi.condition_type         AS conditionType
     , condi.alert_opportunity      AS alertOpportunity
     , condi.condition_json         AS conditionJson
     , condi.filter_intention_quote AS filterIntentionQuote
     , config.obj_id                AS bondUniCode
FROM \`polar-price\`.\{env}_price_alert.alert_config/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ config
         INNER JOIN \`polar-price\`.\{env}_price_alert.alert_condition/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ condi
                    ON config.id = condi.alert_config_id
WHERE config.obj_type = 1 AND config.deleted = 0 AND condi.deleted = 0 AND config.valid_status = 1 AND condi.valid_status = 1;


-- 主体
INSERT INTO sink_kafka
SELECT config.id                    AS configId
     , config.user_id               AS userId
     , config.alert_category        AS alertCategory
     , config.obj_type              AS objType
     , config.obj_id                AS objId
     , config.remark                AS remark
     , config.data_source           AS dataSource
     , config.popup_alert           AS popupAlert
     , config.voice_alert           AS voiceAlert
     , config.app_alert             AS appAlert
     , condi.condition_type         AS conditionType
     , condi.alert_opportunity      AS alertOpportunity
     , condi.condition_json         AS conditionJson
     , condi.filter_intention_quote AS filterIntentionQuote
     , bond.bond_uni_code           AS bondUniCode
FROM \`polar-price\`.\{env}_price_alert.alert_config/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ config
         INNER JOIN \`polar-price\`.\{env}_price_alert.alert_condition/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ condi
                    ON config.id = condi.alert_config_id
         INNER JOIN \`mysql-innodealing\`.dmdc.t_bond_basic_info/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ bond
                    ON config.obj_id = bond.com_uni_code
WHERE config.obj_type = 2 AND config.deleted = 0 AND condi.deleted = 0 AND config.valid_status = 1 AND condi.valid_status = 1;

-- 债券组
INSERT INTO sink_kafka
SELECT config.id                    AS configId
     , config.user_id               AS userId
     , config.alert_category        AS alertCategory
     , config.obj_type              AS objType
     , config.obj_id                AS objId
     , config.remark                AS remark
     , config.data_source           AS dataSource
     , config.popup_alert           AS popupAlert
     , config.voice_alert           AS voiceAlert
     , config.app_alert             AS appAlert
     , condi.condition_type         AS conditionType
     , condi.alert_opportunity      AS alertOpportunity
     , condi.condition_json         AS conditionJson
     , condi.filter_intention_quote AS filterIntentionQuote
     , groupBond.bond_uni_code      AS bondUniCode
FROM \`polar-price\`.\{env}_price_alert.alert_config/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ config
         INNER JOIN \`polar-price\`.\{env}_price_alert.alert_condition/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ condi
                    ON config.id = condi.alert_config_id
         INNER JOIN \`polar-price\`.\{env}_broker_quotation_apollo.radar_bond_favorite/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ groupBond
                    ON config.obj_id = groupBond.group_id
WHERE config.obj_type = 3 and config.deleted = 0 and condi.deleted = 0 and config.valid_status = 1 and condi.valid_status = 1;


-- 主体组
INSERT INTO sink_kafka
SELECT config.id                    AS configId
     , config.user_id               AS userId
     , config.alert_category        AS alertCategory
     , config.obj_type              AS objType
     , config.obj_id                AS objId
     , config.remark                AS remark
     , config.data_source           AS dataSource
     , config.popup_alert           AS popupAlert
     , config.voice_alert           AS voiceAlert
     , config.app_alert             AS appAlert
     , condi.condition_type         AS conditionType
     , condi.alert_opportunity      AS alertOpportunity
     , condi.condition_json         AS conditionJson
     , condi.filter_intention_quote AS filterIntentionQuote
     , bond.bond_uni_code      AS bondUniCode
FROM \`polar-price\`.\{env}_price_alert.alert_config/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ config
         INNER JOIN \`polar-price\`.\{env}_price_alert.alert_condition/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ condi
                    ON config.id = condi.alert_config_id
         INNER JOIN \`polar-price\`.\{env}_broker_quotation_apollo.radar_com_favorite /*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ groupCome
                    ON config.obj_id = groupCome.group_id
         INNER JOIN \`mysql-innodealing\`.dmdc.t_bond_basic_info/*+ OPTIONS ('scan.startup.mode'='initial','server-id'='\{server-id}') */ bond
                    ON groupCome.com_uni_code = bond.com_uni_code
WHERE config.obj_type = 4 and config.deleted = 0 and condi.deleted = 0 and config.valid_status = 1 and condi.valid_status = 1;

END;`,
      createTime: '2025-07-17 18:24:16',
      updateTime: '2025-07-17 18:24:16',
    },
  ];

  const handleTemplateClick = (template: JobTemplate) => {
    setSelectedTemplate(template);
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setSelectedTemplate(null);
  };

  const handleCopySQL = async (sql: string) => {
    try {
      await navigator.clipboard.writeText(sql);
      message.success('SQL内容已复制到剪贴板');
    } catch (error) {
      // 如果现代API失败，尝试使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = sql;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        message.success('SQL内容已复制到剪贴板');
      } catch (fallbackError) {
        message.error('复制失败，请手动复制SQL内容');
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="job-template-container">
      <div className="template-header">
        <Title level={4}>作业模板</Title>
        <Text type="secondary">
          管理和查看Flink作业模板，可以基于模板快速创建新的作业
        </Text>
      </div>

      <div className="template-list">
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 2,
            md: 3,
            lg: 3,
            xl: 4,
            xxl: 4,
          }}
          dataSource={jobTemplates}
          renderItem={(template) => (
            <List.Item>
              <Card
                hoverable
                className="template-card"
                onClick={() => handleTemplateClick(template)}
                actions={[
                  <div key="view" className="card-action">
                    <CodeOutlined />
                    <span>查看SQL</span>
                  </div>,
                  <div key="use" className="card-action">
                    <PlayCircleOutlined />
                    <span>使用模板</span>
                  </div>,
                ]}
              >
                <div className="template-card-content">
                  <div className="template-icon">
                    <CodeOutlined />
                  </div>
                  <div className="template-info">
                    <Title level={5} className="template-name">
                      {template.name}
                    </Title>
                    <Text type="secondary" className="template-description">
                      {template.description}
                    </Text>
                  </div>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </div>

      <Modal
        title={`作业模板: ${selectedTemplate?.name}`}
        open={modalVisible}
        onCancel={handleModalClose}
        width={1000}
        footer={null}
        className="template-modal"
      >
        {selectedTemplate && (
          <div className="template-modal-content">
            <div className="template-meta">
              <Text type="secondary">
                描述: {selectedTemplate.description}
              </Text>
              <br />
            </div>
            <div className="template-usage">
              <Title level={5}>使用说明:</Title>
              <div className="usage-instructions">
                <Text>
                  <strong>性能优化建议：</strong>
                </Text>
                <ul>
                  <li>
                    如果允许秒级的延迟，可以开启MiniBatch 攒批处理提升性能。即将SQL注释中的这三个参数配置放开：
                    <Text code>table.exec.mini-batch.enabled</Text>、
                    <Text code>table.exec.mini-batch.allow-latency</Text>、
                    <Text code>table.exec.mini-batch.size</Text>
                  </li>
                </ul>
                <Text>
                  <strong>模板变量说明：</strong>
                </Text>
                <ul>
                  <li>
                    <Text code>{'{env}_'}</Text>: 环境标识符，如果数据库名在开发环境是用dev_、qa_、uat_区分的，请使用{'{env}_'}作为前缀
                  </li>
                  <li>
                    <Text code>{'{server-id}'}</Text>: 是固定写法，系统会自动替换为实际的服务器ID值
                  </li>
                </ul>
              </div>
            </div>
            <div className="template-sql">
              <div className="sql-header">
                <Title level={5}>SQL内容:</Title>
                <Button
                  type="primary"
                  icon={<CopyOutlined />}
                  size="small"
                  onClick={() => handleCopySQL(selectedTemplate.sql)}
                  className="copy-button"
                >
                  复制SQL
                </Button>
              </div>
              <pre className="sql-content">
                <code>{selectedTemplate.sql}</code>
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FlinkJobTemplate;