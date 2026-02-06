import React, { useCallback } from 'react';
import { LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Menu, Spin, Button } from 'antd';
import { history, useModel } from 'umi';
import { stringify } from 'querystring';
import HeaderDropdown from '../HeaderDropdown';
import styles from './index.less';
// import { outLogin } from '@/services/ant-design-pro/api'; // 移除不再使用的导入
import type { MenuInfo } from 'rc-menu/lib/interface';

export type GlobalHeaderRightProps = {
  menu?: boolean;
};

/**
 * 退出登录，并且将当前的 url 保存
 */
const loginOut = async () => {
  try {
    // 清除本地存储的用户相关信息
    localStorage.removeItem('userId');
    localStorage.removeItem('currentAuthority');
    
    // 清除可能存在的其他用户相关数据
    localStorage.removeItem('userInfo');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    
    // 清除sessionStorage中的数据
    sessionStorage.clear();
    
    // 由于后端没有提供退出登录接口，这里只做前端清理工作
    // await outLogin(); // 注释掉后端接口调用
    
    console.log('退出登录：清理完成，准备跳转到登录页面');
    
    // 使用强制跳转，确保页面完全重新加载
    window.location.href = '/login/';
  } catch (error) {
    console.error('退出登录过程中出现错误:', error);
    // 即使出错也要跳转到登录页面
    window.location.href = '/login/';
  }
};

const AvatarDropdown: React.FC<GlobalHeaderRightProps> = ({ menu }) => {
  const { initialState, setInitialState } = useModel('@@initialState');

  const onMenuClick = useCallback(
    (event: MenuInfo) => {
      const { key } = event;
      if (key === 'logout') {
        // 先清理全局状态
        setInitialState((s) => ({ ...s, currentUser: undefined }));
        // 立即执行退出登录逻辑
        loginOut();
        return;
      }
      history.push(`/account/${key}`);
    },
    [setInitialState],
  );

  // 处理直接点击退出登录按钮
  const handleLogout = useCallback(() => {
    // 先清理全局状态
    setInitialState((s) => ({ ...s, currentUser: undefined }));
    // 立即执行退出登录逻辑
    loginOut();
  }, [setInitialState]);

  const loading = (
    <span className={`${styles.action} ${styles.account}`}>
      <Spin
        size="small"
        style={{
          marginLeft: 8,
          marginRight: 8,
        }}
      />
    </span>
  );

  if (!initialState) {
    return loading;
  }

  const { currentUser } = initialState;

  if (!currentUser || !currentUser.name) {
    return loading;
  }

  const menuHeaderDropdown = (
    <Menu className={styles.menu} selectedKeys={[]} onClick={onMenuClick}>
      {menu && (
        <Menu.Item key="center">
          <UserOutlined />
          个人中心
        </Menu.Item>
      )}
      {menu && (
        <Menu.Item key="settings">
          <SettingOutlined />
          个人设置
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <div className={styles.userInfo}>
      {/* 用户头像和姓名区域 */}
      <HeaderDropdown overlay={menuHeaderDropdown}>
        <span className={`${styles.action} ${styles.account}`}>
          <Avatar size="default" className={styles.avatar} src={currentUser.avatar} alt="avatar" />
          <span className={`${styles.name} anticon`}>
            <span className={styles.welcome}>欢迎，</span>
            <span className={styles.username}>{currentUser.name}</span>
          </span>
        </span>
      </HeaderDropdown>
      
      {/* 独立的退出登录按钮 */}
      <Button 
        type="text" 
        icon={<LogoutOutlined />} 
        onClick={handleLogout}
        className={styles.logoutButton}
      >
        退出登录
      </Button>
    </div>
  );
};

export default AvatarDropdown;
