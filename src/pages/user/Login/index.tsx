import { LockOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { Alert, message, Button, Input, Form, Card } from 'antd';
import React, { useState, useEffect } from 'react';
import { useIntl, history, FormattedMessage, useModel } from 'umi';
import Footer from '@/components/Footer';
import { login } from '@/services/ant-design-pro/api';

import styles from './index.less';

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => (
  <Alert
    style={{
      marginBottom: 24,
    }}
    message={content}
    type="error"
    showIcon
  />
);

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const [loading, setLoading] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const [form] = Form.useForm();

  const intl = useIntl();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      await setInitialState((s) => ({
        ...s,
        currentUser: userInfo,
      }));
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      setLoading(true);
      // 登录
      const msg = await login({ ...values, type: 'account' });
      if (msg.status === 'ok') {
        const defaultLoginSuccessMessage = intl.formatMessage({
          id: 'pages.login.success',
          defaultMessage: '登录成功！',
        });
        localStorage.setItem('userId', msg.userId);
        localStorage.setItem('currentAuthority', msg.currentAuthority);
        message.success(defaultLoginSuccessMessage);
        await fetchUserInfo();
        /** 此方法会跳转到 redirect 参数所在的位置 */
        if (!history) return;
        const { query } = history.location;
        const { redirect } = query as { redirect: string };
        history.push(redirect || '/welcome/');
        return;
      }
      console.log(msg);
      // 如果失败去设置用户错误信息
      setUserLoginState(msg);
    } catch (error) {
      const defaultLoginFailureMessage = intl.formatMessage({
        id: 'pages.login.failure',
        defaultMessage: '登录失败，请重试！',
      });
      message.error(defaultLoginFailureMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const { status } = userLoginState;

  // 添加页面动画效果
  useEffect(() => {
    const loginCard = document.querySelector(`.${styles.loginCard}`);
    if (loginCard) {
      loginCard.classList.add(styles.fadeInUp);
    }
  }, []);

  return (
    <div className={styles.container}>
      {/* 动态背景粒子效果 */}
      <div className={styles.particlesBackground}>
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className={styles.particle}
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* 主要内容区域 */}
      <div className={styles.content}>
        <div className={styles.loginWrapper}>
          {/* 左侧欢迎区域 */}
          <div className={styles.welcomeSection}>
            <div className={styles.welcomeContent}>
              <h1 className={styles.welcomeTitle}>
                欢迎回来
                <span className={styles.titleGradient}>数据同步平台</span>
              </h1>
              <p className={styles.welcomeSubtitle}>
                高效、安全、智能的企业级数据同步解决方案
              </p>
              <div className={styles.featureList}>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>🚀</div>
                  <span>实时数据同步</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>🛡️</div>
                  <span>安全可靠</span>
                </div>
                <div className={styles.featureItem}>
                  <div className={styles.featureIcon}>📊</div>
                  <span>智能监控</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧登录表单 */}
          <div className={styles.loginSection}>
            <Card className={styles.loginCard} bordered={false}>
              <div className={styles.loginHeader}>
                <div className={styles.logoWrapper}>
                  <img 
                    alt="logo" 
                    src="https://web.innodealing.com/dashboard/img/favicon/favicon.ico" 
                    className={styles.logo}
                  />
                  <h2 className={styles.loginTitle}>Hermes Data</h2>
                </div>
                <p className={styles.loginSubtitle}>请使用您的账号登录系统</p>
              </div>

              {status === 'error' && (
                <LoginMessage
                  content={intl.formatMessage({
                    id: 'pages.login.accountLogin.errorMessage',
                    defaultMessage: '账户或密码错误',
                  })}
                />
              )}

              <Form
                form={form}
                name="loginForm"
                onFinish={handleSubmit}
                size="large"
                className={styles.loginForm}
              >
                <Form.Item
                  name="username"
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.username.required"
                          defaultMessage="请输入账号!"
                        />
                      ),
                    },
                  ]}
                >
                  <Input
                    prefix={<UserOutlined className={styles.prefixIcon} />}
                    placeholder="请输入账号"
                    className={styles.inputField}
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  rules={[
                    {
                      required: true,
                      message: (
                        <FormattedMessage
                          id="pages.login.password.required"
                          defaultMessage="请输入密码！"
                        />
                      ),
                    },
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined className={styles.prefixIcon} />}
                    placeholder="请输入密码"
                    className={styles.inputField}
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className={styles.loginButton}
                    block
                  >
                    {loading ? '登录中...' : '立即登录'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
