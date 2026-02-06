#!/usr/bin/env node

// 设置环境变量以解决 Node.js 24 的 OpenSSL 兼容性问题
process.env.NODE_OPTIONS = '--openssl-legacy-provider';
process.env.GIT_OPTIONAL_LOCKS = '0';

const { spawn } = require('child_process');

// 运行 umi build
const child = spawn('node_modules/.bin/umi', ['build'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
  }
});

child.on('exit', (code) => {
  process.exit(code);
});
