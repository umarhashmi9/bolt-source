import { Link, type MetaFunction } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Header } from '~/components/header/Header';

export const meta: MetaFunction = () => {
  return [{ title: 'Bolt - 关于我们' }, { name: 'description', content: '关于Bolt应用及其功能介绍' }];
};

export default function About() {
  const [appInfo, setAppInfo] = useState<{
    version: string;
    electronVersion: string;
    nodeVersion: string;
    platform: string;
  }>({
    version: '未知',
    electronVersion: '未知',
    nodeVersion: '未知',
    platform: '未知',
  });

  useEffect(() => {
    // 获取应用信息
    window.ipc
      ?.invoke('get-app-info')
      .then((info) => {
        if (info && typeof info === 'object') {
          setAppInfo(info as any);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-bolt-elements-background-depth-1">
      <Header />
      <div className="flex flex-col items-center justify-center flex-1 p-8">
        <div className="max-w-2xl w-full bg-bolt-elements-background-depth-2 rounded-xl p-8 shadow-lg">
          <div className="flex items-center justify-center mb-6">
            <img src="/logo-light-styled.png" alt="Bolt Logo" className="w-[120px] dark:hidden" />
            <img src="/logo-dark-styled.png" alt="Bolt Logo" className="w-[120px] hidden dark:block" />
          </div>

          <h1 className="text-3xl font-bold text-center text-bolt-elements-textPrimary mb-4">关于 Bolt</h1>

          <div className="text-bolt-elements-textSecondary mb-6 text-center">
            <p className="mb-2">Bolt 是一个基于 Electron 和 React 构建的现代应用程序。</p>
            <p>我们的目标是为用户提供高效、直观的体验。</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
              <h3 className="text-bolt-elements-textPrimary font-medium mb-2">应用版本</h3>
              <p className="text-bolt-elements-textTertiary">{appInfo.version}</p>
            </div>
            <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
              <h3 className="text-bolt-elements-textPrimary font-medium mb-2">Electron 版本</h3>
              <p className="text-bolt-elements-textTertiary">{appInfo.electronVersion}</p>
            </div>
            <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
              <h3 className="text-bolt-elements-textPrimary font-medium mb-2">Node.js 版本</h3>
              <p className="text-bolt-elements-textTertiary">{appInfo.nodeVersion}</p>
            </div>
            <div className="bg-bolt-elements-background-depth-1 p-4 rounded-lg">
              <h3 className="text-bolt-elements-textPrimary font-medium mb-2">平台</h3>
              <p className="text-bolt-elements-textTertiary">{appInfo.platform}</p>
            </div>
          </div>

          <div className="flex justify-center">
            <Link
              to="/"
              className="px-6 py-2 bg-bolt-elements-primary text-white rounded-md hover:bg-bolt-elements-primary/90 transition-colors"
            >
              返回主页
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
