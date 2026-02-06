import { Settings as LayoutSettings } from '@ant-design/pro-layout';

const Settings: LayoutSettings & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  // 拂晓蓝
  primaryColor: '#1890ff',
  layout: 'side',
  contentWidth: 'Fixed',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Hermes-Data',
  pwa: false,
  logo: 'https://web.innodealing.com/dashboard/img/favicon/favicon.ico',
  iconfontUrl: '',
  headerHeight: 64,
  splitMenus: false,
  // 增加自定义设置
  footerRender: false, // 不显示底部
  menu: {
    locale: false,
  },
  headerRender: undefined, // 使用默认的头部渲染
};

export default Settings;
