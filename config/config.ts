// https://umijs.org/config/
import { defineConfig } from 'umi';

import defaultSettings from './defaultSettings';
import proxy from './proxy';
import routes from './routes';

const { REACT_APP_ENV } = process.env;

export default defineConfig({
  hash: true,
  antd: {
    // 开启暗色主题
    dark: false,
    // 开启紧凑主题
    compact: true,
  },
  dva: {
    hmr: true,
  },
  // 配置 history 类型和选项
  history: {
    type: 'browser',
  },
  layout: {
    // https://umijs.org/zh-CN/plugins/plugin-layout
    locale: false,
    siderWidth: 200,
    ...defaultSettings,
  },
  // https://umijs.org/zh-CN/plugins/plugin-locale
  locale: {
    // default zh-CN
    default: 'zh-CN',
    antd: true,
    // default true, when it is true, will use `navigator.language` overwrite default
    // baseNavigator: true,
  },
  dynamicImport: {
    loading: '@ant-design/pro-layout/es/PageLoading',
  },
  targets: {
    ie: 11,
  },
  // umi routes: https://umijs.org/docs/routing
  routes,
  // Theme for antd: https://ant.design/docs/react/customize-theme-cn
  theme: {
    'primary-color': '#1890ff',
    'success-color': '#52c41a',
    'error-color': '#ff4d4f',
    'heading-color': 'rgba(0, 0, 0, 0.85)',
    'text-color': 'rgba(0, 0, 0, 0.65)',
    'text-color-secondary': 'rgba(0, 0, 0, 0.45)',
    'border-radius-base': '4px',
    'border-color-base': '#d9d9d9',
    'box-shadow-base': '0 2px 8px rgba(0, 0, 0, 0.15)',
    'font-size-base': '14px',
    'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
  },
  // esbuild is father build tools
  // https://umijs.org/plugins/plugin-esbuild
  esbuild: {},
  title: false,
  ignoreMomentLocale: true,
  proxy: REACT_APP_ENV && proxy[REACT_APP_ENV as keyof typeof proxy],
  publicPath: '/',
  base: '/',
  manifest: {
    basePath: '/',
  },
  // Fast Refresh 热更新
  fastRefresh: {},
  nodeModulesTransform: { type: 'none' },
  mfsu: false,
  webpack5: {},
  exportStatic: {},
  // 禁用需要 git 的功能
  alias: {},
  define: {
    'process.env.GIT_OPTIONAL_LOCKS': '0',
  },
});
