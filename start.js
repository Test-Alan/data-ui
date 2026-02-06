#!/usr/bin/env node

// 设置环境变量以解决 Node.js 24 的 OpenSSL 兼容性问题
process.env.NODE_OPTIONS = '--openssl-legacy-provider';
process.env.GIT_OPTIONAL_LOCKS = '0';

// 从命令行参数中获取要运行的命令
const args = process.argv.slice(2);
const { spawn } = require('child_process');

// 构建完整的命令
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// 运行 umi dev
const child = spawn('node_modules/.bin/umi', ['dev'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    REACT_APP_ENV: process.env.REACT_APP_ENV || 'dev',
    MOCK: process.env.MOCK || 'none',
    UMI_ENV: 'dev'
  }
});

child.on('exit', (code) => {
  process.exit(code);
});
