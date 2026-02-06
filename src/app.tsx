import type { Settings as LayoutSettings } from '@ant-design/pro-layout';
import { SettingDrawer } from '@ant-design/pro-layout';
import { PageLoading } from '@ant-design/pro-layout';
import type { RunTimeLayoutConfig } from 'umi';
import { setLocale } from 'umi';
import { history } from 'umi';
import { Link } from 'umi';
import RightContent from '@/components/RightContent';
import { currentUser as queryCurrentUser } from './services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';

const isDev = process.env.NODE_ENV === 'development';
console.log(`env:  ${isDev}`)

setLocale('zh-CN', true);
const loginPath = '/login/';

// 全局变量存储当前用户信息
let globalCurrentUser: API.CurrentUser | undefined = undefined;

// URL 规范化处理函数 - 确保所有页面URL都以"/"结尾
const normalizeUrl = (pathname: string): string => {
  // 如果路径不是根路径且不以"/"结尾，则添加"/"
  if (pathname !== '/' && !pathname.endsWith('/')) {
    // 排除文件扩展名（如.js, .css等静态资源）
    const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(pathname);
    if (!hasFileExtension) {
      return pathname + '/';
    }
  }
  return pathname;
};

// 页面路径规范化处理
const handleUrlNormalization = () => {
  const currentPath = window.location.pathname;
  const normalizedPath = normalizeUrl(currentPath);
  
  if (currentPath !== normalizedPath) {
    // 使用replace确保不会产生历史记录
    history.replace({
      pathname: normalizedPath,
      search: window.location.search,
      hash: window.location.hash,
    });
  }
};

// 在页面加载时执行URL规范化
if (typeof window !== 'undefined') {
  // 监听路由变化
  history.listen((location) => {
    const normalizedPath = normalizeUrl(location.pathname);
    if (location.pathname !== normalizedPath) {
      history.replace({
        pathname: normalizedPath,
        search: location.search,
        hash: location.hash,
      });
    }
  });
  
  // 初始化时处理当前URL
  handleUrlNormalization();
}

/**
 * 请求拦截器配置
 * 在每个请求的Header中添加用户信息
 */
export const request = {
  requestInterceptors: [
    (url: string, options: any) => {
      // 在请求头中添加当前登录用户的用户名
      const headers = {
        ...options.headers,
      };
      
      // 如果有当前用户信息，添加到Header中
      if (globalCurrentUser && globalCurrentUser.name) {
        // 对用户名进行URL编码，避免中文字符导致的HTTP Header错误
        headers['X-User-Name'] = encodeURIComponent(globalCurrentUser.name);
      } else {
        // 尝试从localStorage获取用户信息（备用方案）
        const userId = localStorage.getItem('userId');
        if (userId) {
          headers['X-User-Id'] = userId;
        }
      }
      
      return {
        url,
        options: {
          ...options,
          headers,
        },
      };
    },
  ],
};

/** 获取用户信息比较慢的时候会展示一个 loading */
export const initialStateConfig = {
  loading: <PageLoading />,
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {
  const fetchUserInfo = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        history.push(loginPath);
        return undefined;
      }
      const msg = await queryCurrentUser({params: {userId}});
      // 更新全局用户信息
      globalCurrentUser = msg.data;
      return msg.data;
    } catch (error) {
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  if (history.location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  return {
    rightContentRender: () => <RightContent />,
    disableContentMargin: false,
    waterMarkProps: {
      // content: initialState?.currentUser?.name,
    },
    onPageChange: () => {
      const { location } = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children, props) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {!props.location?.pathname?.includes('/') && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    // 自定义菜单项渲染，支持在路由配置中通过 `tag` 字段增加右侧徽标
    menuItemRender: (menuItemProps: any, defaultDom: React.ReactNode) => {
      // 外链或无路径的菜单保持默认
      if (menuItemProps.isUrl || !menuItemProps.path) {
        return defaultDom;
      }

      // 如果没有配置 tag，则直接返回默认渲染
      if (!menuItemProps.tag) {
        return (
          <Link to={menuItemProps.path}>{defaultDom}</Link>
        );
      }

      // 含有 tag 的菜单项，追加徽标样式
      return (
        <Link to={menuItemProps.path} className={"menu-item-with-tag"}>
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>
            {defaultDom}
            <span className="menu-item-tag">{menuItemProps.tag}</span>
          </span>
        </Link>
      );
    },
    ...initialState?.settings,
  };
};
