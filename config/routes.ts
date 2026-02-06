export default [
  {
    name: 'login',
    path: '/login/',
    layout: false,
    component: './user/Login',
    hideInMenu: true,
  },
  {
    path: '/welcome/',
    name: '首页',
    icon: 'HomeOutlined',
    component: './Welcome',
  },
  {
    name: '监听管理',
    path: '/listener/',
    icon: 'EyeOutlined',
    routes: [
       {
        path: 'stream-capture/',
        name: '数据流捕获',
        component: './external/cdc',
      },
      {
        path: 'datasource/',
        name: '数据源管理',
        component: './external/datasource',
      },
      {
        path: 'table-reader/',
        name: '数据读取器',
        tag: 'Hot',
        component: './external/table',
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '同步管理',
    path: '/sync/',
    icon: 'SyncOutlined',
    routes: [
      {
        path: 'target-source/',
        name: '目标数据源',
        component: './external/destsource',
      },
      {
        path: 'sync-client/',
        name: '同步客户端',
        component: './external/client',
      },
      {
        path: 'table-writer/',
        name: '数据写入器',
        tag: 'Hot',
        component: './external/clienttable',
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '智能管理',
    path: '/smart/',
    icon: 'SyncOutlined',
    routes: [
      {
        path: 'sharding-reader/',
        name: '智能读取器',
        component: './external/reader-sharding',
      },
      {
        path: 'sharding-writer/',
        name: '智能写入器',
        component: './external/writer-sharding',
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '同步检查',
    path: '/validation/',
    icon: 'EyeOutlined',
    routes: [
      {
        path: '/validation/config/',
        name: '检查配置',
        component: './check/config',
      },
      {
        path: '/validation/execute/',
        name: '执行检查',
        component: './check/execute',
      },
      {
        path: '/validation/result/',
        name: '检查结果',
        tag: 'Hot',
        component: './check/result',
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '数据洞察',
    path: '/monitoring/',
    icon: 'BarChartOutlined',
    routes: [
      {
        path: '/monitoring/binlog-insights/',
        name: 'Binlog统计',
        component: './observation/binlog',
      },
      {
        path: '/monitoring/binlog-query/',
        name: 'Binlog查询',
        component: './observation/binlog-query',
      },
      {
        path: '/monitoring/activity-analysis/',
        name: '活跃度分析',
        tag: 'Hot',
        component: './observation/activity-analysis',
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '实时计算',
    path: '/realtime-compute/',
    icon: 'ThunderboltOutlined',
    routes: [
      {
        path: '/realtime-compute/',
        redirect: '/realtime-compute/flink-management/',
      },
      {
        name: 'Flink发布',
        path: '/realtime-compute/flink-management/',
        component: './flink',
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '消费管理',
    path: '/consumption-management/',
    icon: 'ConsoleSqlOutlined',
    routes: [
      {
        path: '/consumption-management/hot-skip-offset/',
        name: '热跳点位',
        tag: 'Hot',
        component: './consumption/hot-skip-offset',
      },
      {
        component: './404',
      },
    ],
  },
  {
    name: '用户管理',
    path: '/user-management/',
    icon: 'UserOutlined',
    routes: [
      {
        path: '/user-management/accounts/',
        name: '系统账号',
        component: './usermanage/account',
      },
      {
        path: '/user-management/members/',
        name: '团队成员',
        component: './usermanage/member',
      },
    ],
  },
  {
    path: '/',
    redirect: '/welcome/',
  },
  {
    component: './404',
  },
];
