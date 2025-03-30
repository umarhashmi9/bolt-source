/**
 * 跨平台通用签名工具
 * 用于处理Windows、macOS和Linux平台的应用签名
 * 在electron-builder构建过程中被调用
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 获取当前操作系统类型
 * @returns {string} 操作系统类型: 'win32', 'darwin', 'linux'
 */
function getPlatform() {
  return process.platform;
}

/**
 * Windows平台签名实现
 * @param {string} filePath 需要签名的文件路径
 * @param {object} options 签名选项
 */
async function signWindows(filePath, options = {}) {
  console.log(`[签名工具] 正在为Windows平台签名文件: ${filePath}`);
  
  // 获取签名证书和密码
  const certPath = options.certPath || process.env.WIN_CERTIFICATE_PATH;
  const certPassword = options.certPassword || process.env.WIN_CERTIFICATE_PASSWORD;
  
  if (!certPath) {
    console.warn('[签名工具] 警告: 未提供Windows证书路径，跳过签名');
    return;
  }
  
  try {
    // 使用signtool.exe进行签名
    // 通常signtool.exe位于Windows SDK中
    const signtoolPath = options.signtoolPath || findSigntool();
    
    if (!signtoolPath) {
      console.error('[签名工具] 错误: 未找到signtool.exe，无法完成签名');
      return;
    }
    
    const timestampServer = options.timestampServer || 'http://timestamp.digicert.com';
    
    let command = `"${signtoolPath}" sign /fd SHA256 /tr "${timestampServer}" /td SHA256 /f "${certPath}"`;
    
    if (certPassword) {
      command += ` /p "${certPassword}"`;
    }
    
    command += ` "${filePath}"`;
    
    execSync(command, { stdio: 'inherit' });
    console.log(`[签名工具] Windows签名成功: ${filePath}`);
  } catch (error) {
    console.error(`[签名工具] Windows签名失败: ${error.message}`);
    // 不抛出错误，允许构建继续进行
  }
}

/**
 * 查找Windows系统中的signtool.exe
 * @returns {string|null} signtool.exe的路径或null
 */
function findSigntool() {
  // 常见的signtool.exe位置
  const commonPaths = [
    // Windows SDK 10路径
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.19041.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.18362.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.17763.0\\x64\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x64\\signtool.exe',
    // 32位版本
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.19041.0\\x86\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.18362.0\\x86\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.17763.0\\x86\\signtool.exe',
    'C:\\Program Files (x86)\\Windows Kits\\10\\bin\\x86\\signtool.exe',
  ];
  
  for (const p of commonPaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  // 尝试从环境变量中查找
  try {
    const result = execSync('where signtool', { encoding: 'utf8' }).trim();
    if (result && fs.existsSync(result.split('\n')[0])) {
      return result.split('\n')[0];
    }
  } catch (error) {
    // 忽略错误，继续尝试其他方法
  }
  
  return null;
}

/**
 * macOS平台签名实现
 * @param {string} filePath 需要签名的文件路径
 * @param {object} options 签名选项
 */
async function signMacOS(filePath, options = {}) {
  console.log(`[签名工具] 正在为macOS平台签名文件: ${filePath}`);
  
  // 获取签名身份和证书
  const identity = options.identity || process.env.APPLE_IDENTITY;
  
  if (!identity) {
    console.warn('[签名工具] 警告: 未提供macOS签名身份，跳过签名');
    return;
  }
  
  try {
    // 使用codesign进行签名
    const entitlements = options.entitlements || path.join(process.cwd(), 'assets/entitlements.mac.plist');
    
    let command = `codesign --force --options runtime --deep --sign "${identity}"`;
    
    if (fs.existsSync(entitlements)) {
      command += ` --entitlements "${entitlements}"`;
    }
    
    command += ` "${filePath}"`;
    
    execSync(command, { stdio: 'inherit' });
    console.log(`[签名工具] macOS签名成功: ${filePath}`);
  } catch (error) {
    console.error(`[签名工具] macOS签名失败: ${error.message}`);
    // 不抛出错误，允许构建继续进行
  }
}

/**
 * Linux平台签名实现
 * @param {string} filePath 需要签名的文件路径
 * @param {object} options 签名选项
 */
async function signLinux(filePath, options = {}) {
  console.log(`[签名工具] 正在为Linux平台签名文件: ${filePath}`);
  
  // 获取GPG密钥ID
  const keyId = options.keyId || process.env.LINUX_GPG_KEY_ID;
  
  if (!keyId) {
    console.warn('[签名工具] 警告: 未提供Linux GPG密钥ID，跳过签名');
    return;
  }
  
  try {
    // 检查文件类型
    const fileExt = path.extname(filePath).toLowerCase();
    
    if (fileExt === '.deb') {
      // 为DEB包签名
      const command = `dpkg-sig --sign builder -k ${keyId} "${filePath}"`;
      execSync(command, { stdio: 'inherit' });
    } else if (fileExt === '.rpm') {
      // 为RPM包签名
      const command = `rpm --addsign --define "_gpg_name ${keyId}" "${filePath}"`;
      execSync(command, { stdio: 'inherit' });
    } else if (fileExt === '.appimage') {
      // 为AppImage签名
      const command = `gpg --default-key ${keyId} --detach-sign "${filePath}"`;
      execSync(command, { stdio: 'inherit' });
    } else {
      console.warn(`[签名工具] 警告: 不支持的Linux文件类型: ${fileExt}`);
      return;
    }
    
    console.log(`[签名工具] Linux签名成功: ${filePath}`);
  } catch (error) {
    console.error(`[签名工具] Linux签名失败: ${error.message}`);
    // 不抛出错误，允许构建继续进行
  }
}

/**
 * 主签名函数，根据平台调用相应的签名方法
 * @param {string} filePath 需要签名的文件路径
 * @param {object} options 签名选项
 */
async function sign(filePath, options = {}) {
  const platform = options.platform || getPlatform();
  
  console.log(`[签名工具] 检测到平台: ${platform}`);
  console.log(`[签名工具] 开始签名文件: ${filePath}`);
  
  switch (platform) {
    case 'win32':
      await signWindows(filePath, options);
      break;
    case 'darwin':
      await signMacOS(filePath, options);
      break;
    case 'linux':
      await signLinux(filePath, options);
      break;
    default:
      console.warn(`[签名工具] 警告: 不支持的平台: ${platform}`);
  }
}

// 如果直接运行脚本，处理命令行参数
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('[签名工具] 错误: 请提供要签名的文件路径');
    process.exit(1);
  }
  
  const filePath = args[0];
  
  // 解析其他选项
  const options = {};
  for (let i = 1; i < args.length; i += 2) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      const key = args[i].slice(2);
      options[key] = args[i + 1];
    }
  }
  
  sign(filePath, options).catch(error => {
    console.error(`[签名工具] 错误: ${error.message}`);
    process.exit(1);
  });
} else {
  // 作为模块导出
  module.exports = sign;
}