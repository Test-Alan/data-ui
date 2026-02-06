#!/usr/bin/env node

// 设置 Node.js OpenSSL 选项以兼容 v24
process.env.NODE_OPTIONS = '--openssl-legacy-provider';

// 禁用 git 相关操作
process.env.GIT_OPTIONAL_LOCKS = '0';
process.env.SKIP_GIT_CHECKS = '1';

const { execSync } = require('child_process');

try {
  const args = process.argv.slice(2);
  const cmd = `umi dev ${args.join(' ')}`;
  console.log(`[Dev] Running: ${cmd}`);
  
  execSync(cmd, {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env,
  });
  
  process.exit(0);
} catch (error) {
  console.error('[Dev] Error:', error.message);
  process.exit(1);
}
