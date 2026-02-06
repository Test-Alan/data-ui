interface EnvProperties {
  extSyncUrl: string;
  flinkManagementUrl: string;
  hermesDataCheckUrl: string;
  hermesDataInsightUrl: string;
  hermesDataExtensionUrl: string;
}

// 动态获取环境配置
function getActiveEnvironment(): string {
  // 1. 优先使用环境变量
  if (process.env.NODE_ENV === 'development') {
    return 'local';
  }
  
  // 2. 根据域名自动判断环境
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('qa-innodealing.com')) {
      return 'qa';
    } else if (hostname.includes('uat-innodealing.com')) {
      return 'uat';
    } else if (hostname.includes('innodealing.com') && !hostname.includes('qa')) {
      return 'prd';
    } else if (hostname.includes('cscidmi.com') && !hostname.includes('qa')) {
      return 'intl';
    } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'local';
    }
  }
  
  // 3. 构建时替换的占位符处理
  const buildTimeActive = '/*env_active*/';
  if (buildTimeActive !== '/*env_active*/' && config[buildTimeActive]) {
    return buildTimeActive;
  }
  
  // 4. 默认回退到qa环境（避免本地连接失败）
  console.warn('无法确定环境，使用qa环境作为默认配置');
  return 'qa';
}

const active = getActiveEnvironment();

// "dev", "alpha", "qa", "gamma", "uat", "prod"
const config: Record<string, EnvProperties> = {
  local: {
    extSyncUrl: 'http://localhost:8180/ta-hermes-data-core-svc',
    flinkManagementUrl: 'http://localhost:8181/ta-flink-job-mgmt',
    hermesDataCheckUrl: 'http://localhost:8182/ta-hermes-data-check-svc',
    hermesDataInsightUrl: 'http://localhost:8183/ta-hermes-data-insight-svc',
    hermesDataExtensionUrl: 'http://localhost:8080/ta-hermes-data-extension-svc',
  },
  qa: {
    extSyncUrl: 'https://hermes-data.qa-innodealing.com/ta-hermes-data-core-svc',
    flinkManagementUrl: 'https://hermes-data.qa-innodealing.com/ta-flink-job-mgmt',
    hermesDataCheckUrl: 'https://hermes-data.qa-innodealing.com/ta-hermes-data-check-svc',
    hermesDataInsightUrl: 'https://hermes-data.qa-innodealing.com/ta-hermes-data-insight-svc',
    hermesDataExtensionUrl: 'https://hermes-data.qa-innodealing.com/ta-hermes-data-extension-svc',
  },
  uat: {
    extSyncUrl: 'https://hermes-data.uat-innodealing.com/ta-hermes-data-core-svc',
    flinkManagementUrl: 'https://hermes-data.uat-innodealing.com/ta-flink-job-mgmt',
    hermesDataCheckUrl: 'https://hermes-data.uat-innodealing.com/ta-hermes-data-check-svc',
    hermesDataInsightUrl: 'https://hermes-data.uat-innodealing.com/ta-hermes-data-insight-svc',
    hermesDataExtensionUrl: 'https://hermes-data.uat-innodealing.com/ta-hermes-data-extension-svc',
  },
  prd: {
    extSyncUrl: 'https://hermes-data.innodealing.com/ta-hermes-data-core-svc',
    flinkManagementUrl: 'https://hermes-data.innodealing.com/ta-flink-job-mgmt',
    hermesDataCheckUrl: 'https://hermes-data.innodealing.com/ta-hermes-data-check-svc',
    hermesDataInsightUrl: 'https://hermes-data.innodealing.com/ta-hermes-data-insight-svc',
    hermesDataExtensionUrl: 'https://hermes-data.innodealing.com/ta-hermes-data-extension-svc',
  },
  intl: {
    extSyncUrl: 'https://hermes-data.cscidmi.com/ta-hermes-data-core-svc',
    flinkManagementUrl: 'https://hermes-data.cscidmi.com/ta-flink-job-mgmt',
    hermesDataCheckUrl: 'https://hermes-data.cscidmi.com/ta-hermes-data-check-svc',
    hermesDataInsightUrl: 'https://hermes-data.cscidmi.com/ta-hermes-data-insight-svc',
    hermesDataExtensionUrl: 'https://hermes-data.cscidmi.com/ta-hermes-data-extension-svc',
  },
};

export function getEnvProperties(): EnvProperties {
  const envProperties = config[active];
  
  // 添加调试信息
  console.log(`当前环境: ${active}`);
  console.log(`API基础URL: ${envProperties?.flinkManagementUrl || 'undefined'}`);
  
  if (envProperties) {
    return envProperties;
  } else {
    console.warn(`未找到环境配置: ${active}，回退到本地环境`);
    return config.local;
  }
}
