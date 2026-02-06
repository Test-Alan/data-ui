// 本地开发配置 - 禁用所有导致问题的功能
import { defineConfig } from 'umi';

export default defineConfig({
  // 禁用 MFSU 模块联邦加速
  mfsu: false,
  
  // 禁用所有预构建
  prebuild: {
    enable: false,
  },
  
  // 禁用 webpack 缓存
  cache: {
    build: false,
    depBuild: false,
  },

  // 简化 webpack 配置
  webpack5: {},
  
  // 禁用动态导入优化
  dynamicImportChunkSize: undefined,
  
  // 禁用其他优化
  chainWebpack(config: any) {
    // 移除 fork-ts-checker
    config.plugins.delete('fork-ts-checker');
  },
});
