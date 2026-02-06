import React from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Card, Typography, Row, Col, Space, Divider, Button, Upload, message } from 'antd';
import { useIntl } from 'umi';
import { UploadOutlined } from '@ant-design/icons';
import styles from './Welcome.less';

const Welcome: React.FC = () => {
  const intl = useIntl();

  return (
    <PageContainer title="欢迎使用数据同步平台" subTitle="快速、便捷的数据传输与管理工具">
      <Card className={styles.welcomeCard}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} sm={24} md={14} lg={16} xl={16}>
            <div className={styles.welcomeContent}>
              <Typography.Title level={2}>Hermes Data</Typography.Title>
              <Typography.Paragraph className={styles.description}>
                数据同步平台是一个高效、安全、易用的数据传输与管理工具，帮助您轻松实现不同系统间的数据同步。
                平台支持多种数据源连接、实时数据抽取、数据加工转换等核心功能，为企业提供全方位的数据同步解决方案。
              </Typography.Paragraph>

              <Divider />

              <Space direction="vertical" size="large" className={styles.featureList}>
                <div className={styles.feature}>
                  <Typography.Title level={4}>高效数据传输</Typography.Title>
                  <Typography.Text>
                    基于Flink技术构建，支持大规模数据高效传输，保证数据一致性和准确性
                  </Typography.Text>
                </div>

                <div className={styles.feature}>
                  <Typography.Title level={4}>多种数据源支持</Typography.Title>
                  <Typography.Text>
                    支持关系型数据库、NoSQL数据库、消息队列等多种数据源的连接和同步
                  </Typography.Text>
                </div>

                <div className={styles.feature}>
                  <Typography.Title level={4}>简单易用的界面</Typography.Title>
                  <Typography.Text>
                    提供直观、易用的用户界面，无需复杂操作即可完成数据同步配置
                  </Typography.Text>
                </div>
              </Space>
            </div>
          </Col>

          <Col xs={24} sm={24} md={10} lg={8} xl={8} className={styles.qrcodeCol}>
            <div className={styles.qrcodeWrapper}>
              <Typography.Title level={3} className={styles.qrcodeTitle}>
                扫码加入交流群
              </Typography.Title>
              <div className={styles.qrcode}>
                <img 
                  src="/images/qrcode.png" 
                  alt="二维码" 
                  className={styles.qrcodeImage} 
                />
              </div>
              <Typography.Text type="secondary" className={styles.qrcodeHint}>
                扫描上方二维码，加入内部交流群
              </Typography.Text>
            </div>
          </Col>
        </Row>
      </Card>
    </PageContainer>
  );
};

export default Welcome;
