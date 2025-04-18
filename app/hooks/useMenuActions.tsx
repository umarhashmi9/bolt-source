import { useEffect, useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from '@remix-run/react';
import { useStore } from '@nanostores/react';
import { chatStore } from '~/lib/stores/chat';
import { db } from '~/lib/persistence/useChatHistory';
import { useSettingsStore } from '~/lib/stores/settings';

// 在window对象上定义ipc接口
declare global {
  interface Window {
    ipc: {
      on: (channel: string, func: (event: unknown, ...args: unknown[]) => void) => () => void;
      invoke: (...args: unknown[]) => Promise<unknown>;
    };
  }
}

export function useMenuActions() {
  const navigate = useNavigate();
  const chat = useStore(chatStore);
  const [currentMessages, setCurrentMessages] = useState<any[]>([]);

  // 导出对话的辅助函数
  const saveExport = useCallback(
    (format: 'json' | 'html') => {
      if (!chat.started) {
        return;
      }

      const fileExtension = format === 'json' ? 'json' : 'html';
      const fileType = format === 'json' ? 'JSON文件' : 'HTML文件';

      // 准备导出内容
      let exportContent: string;

      if (format === 'json') {
        const exportData = {
          title: '对话记录',
          messages: currentMessages,
          timestamp: new Date().toISOString(),
          metadata: {
            exportType: 'json',
            appVersion: '1.0.0',
          },
        };
        exportContent = JSON.stringify(exportData, null, 2);
      } else {
        // HTML模板
        exportContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>对话记录</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin-bottom: 20px; padding: 10px; border-radius: 5px; }
    .user { background-color: #f0f0f0; }
    .assistant { background-color: #e6f7ff; }
    .meta { color: #777; font-size: 0.8em; margin-bottom: 5px; }
  </style>
</head>
<body>
  <h1>对话记录</h1>
  <div class="export-time">导出时间: ${new Date().toLocaleString()}</div>
  <div class="messages">
    ${currentMessages
      .map(
        (msg) => `
    <div class="message ${msg.role === 'user' ? 'user' : 'assistant'}">
      <div class="meta">${msg.role === 'user' ? '用户' : '助手'}</div>
      <div class="content">${msg.content.replace(/\n/g, '<br>')}</div>
    </div>
    `,
      )
      .join('')}
  </div>
</body>
</html>`;
      }

      // 保存文件
      window.ipc
        ?.invoke('save-dialog', {
          title: `导出为${format.toUpperCase()}`,
          defaultPath: `对话记录_${new Date().toLocaleDateString().replace(/\//g, '-')}.${fileExtension}`,
          filters: [{ name: fileType, extensions: [fileExtension] }],
        })
        .then((filePath: unknown) => {
          if (typeof filePath === 'string') {
            window.ipc
              ?.invoke('save-file', {
                filePath,
                content: exportContent,
              })
              .then((result: any) => {
                if (result?.success) {
                  toast.success(`已导出为${format.toUpperCase()}`);
                } else {
                  toast.error(`导出失败: ${result?.error || '未知错误'}`);
                }
              });
          }
        })
        .catch(console.error);
    },
    [chat, currentMessages],
  );

  const handleMenuAction = useCallback(
    (event: unknown, action: unknown) => {
      if (typeof action !== 'string') {
        return;
      }

      console.log('收到菜单动作:', action);

      switch (action) {
        case 'new-file':
          toast.success('新建对话');

         // 创建新对话 - 导航到首页而不是打开新标签
          navigate('/');

        case 'open-file':
          toast.success('打开文件');

          // 打开文件选择器
          window.ipc
            ?.invoke('open-dialog', {
              title: '打开文件',
              properties: ['openFile'],
              filters: [
                { name: 'JSON文件', extensions: ['json'] },
                { name: '所有文件', extensions: ['*'] },
              ],
            })
            .then((result: unknown) => {
              if (result && Array.isArray(result) && result.length > 0) {
                const filePath = result[0];
                console.log('选择的文件:', filePath);

                // 读取选择的文件
                window.ipc
                  ?.invoke('read-file', filePath)
                  .then((response: any) => {
                    if (response?.success && response.content) {
                      try {
                        const data = JSON.parse(response.content);

                        if (data.messages && Array.isArray(data.messages)) {
                          // 导入对话
                          toast.success('对话已导入');

                          // 这里应该调用导入对话的逻辑
                          if (window.confirm('确定要导入此对话？')) {
                            navigate(`/`, { replace: true });
                            window.ipc
                              ?.invoke('import-chat', {
                                description: data.description || '导入的对话',
                                messages: data.messages,
                              })
                              .then(() => {
                                toast.success('对话已成功导入');
                              })
                              .catch((error) => {
                                toast.error('导入对话失败: ' + error);
                              });
                          }
                        } else {
                          toast.error('无效的对话文件格式');
                        }
                      } catch (error) {
                        toast.error('无法解析文件');
                        console.error('解析JSON失败:', error);
                      }
                    } else {
                      toast.error('读取文件失败');
                    }
                  })
                  .catch((error) => {
                    toast.error('读取文件失败');
                    console.error('读取文件失败:', error);
                  });
              }
            })
            .catch(console.error);
          break;

        case 'save-file':
        case 'save-as-file':
          toast.success('保存对话');

          // 保存当前对话
          if (chat.started) {
            const exportData = {
              title: '对话记录',
              messages: currentMessages,
              timestamp: new Date().toISOString(),
            };

            // 通过Electron保存对话到文件
            window.ipc
              ?.invoke('save-dialog', {
                title: '保存对话',
                defaultPath: `对话记录_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`,
                filters: [{ name: 'JSON文件', extensions: ['json'] }],
              })
              .then((filePath: unknown) => {
                if (typeof filePath === 'string') {
                  window.ipc
                    ?.invoke('save-file', {
                      filePath,
                      content: JSON.stringify(exportData, null, 2),
                    })
                    .then((result: any) => {
                      if (result?.success) {
                        toast.success('对话已保存');
                      } else {
                        toast.error('保存失败: ' + (result?.error || '未知错误'));
                      }
                    });
                }
              })
              .catch(console.error);
          } else {
            toast.error('没有可保存的对话');
          }

          break;

        case 'export-json':
          if (chat.started) {
            saveExport('json');
          } else {
            toast.error('没有可导出的对话');
          }

          break;

        case 'export-html':
          if (chat.started) {
            saveExport('html');
          } else {
            toast.error('没有可导出的对话');
          }

          break;

        case 'export-pdf':
          if (chat.started) {
            toast.success('准备导出为PDF...');
            window.ipc?.invoke('export-pdf').then((result: any) => {
              if (result?.success) {
                toast.success('PDF导出成功');
              } else {
                toast.error('PDF导出失败');
              }
            });
          } else {
            toast.error('没有可导出的对话');
          }

          break;

        case 'find':
          toast.success('查找');

          // 实现查找功能
          break;

        case 'replace':
          toast.success('替换');

          // 实现替换功能
          break;

        case 'go-home':
          navigate('/');
          break;

        case 'open-settings':
          toast.success('打开设置');

          // 使用Settings Store打开设置面板，而不是导航到不存在的路由
          useSettingsStore.getState().openSettings();

        case 'clear-history':
          toast.success('正在清除历史记录...');

          /*
           * 清除历史记录
           * 这里应该实现清除对话历史的逻辑
           */
          if (!db) {
            toast.error('数据库未初始化');
            break;
          }

          if (window.confirm('确定要清除所有对话历史记录吗？此操作不可撤销。')) {
            try {
              const transaction = db.transaction('chats', 'readwrite');
              const store = transaction.objectStore('chats');
              const clearRequest = store.clear();

              clearRequest.onsuccess = () => {
                toast.success('历史记录已清除');

                // 刷新页面或导航到首页
                navigate('/', { replace: true });
              };

              clearRequest.onerror = () => {
                toast.error('清除历史记录失败: ' + clearRequest.error);
              };
            } catch (error) {
              toast.error('清除历史记录失败: ' + (error instanceof Error ? error.message : String(error)));
            }
          } else {
            toast.success('已取消清除历史记录');
          }

          break;

        case 'cache-cleared':
          toast.success('缓存已清除');
          break;

        case 'open-docs':
          window.ipc?.invoke('open-external', 'https://github.com/yourusername/bolt/wiki');
          break;

        case 'check-updates':
          toast.success('正在检查更新...');

          // 检查更新
          window.ipc
            ?.invoke('check-for-updates')
            .then((updateInfo: any) => {
              if (updateInfo?.hasUpdate) {
                toast.success('发现新版本: ' + updateInfo.version);
              } else {
                toast.success('当前已是最新版本');
              }
            })
            .catch(() => {
              toast.error('检查更新失败');
            });
          break;

        case 'show-about':
          toast.success('关于应用');

          // 显示关于对话框
          navigate('/about');
          break;

        default:
          console.log('未处理的菜单动作:', action);
      }
    },
    [navigate, chat, currentMessages, saveExport],
  );

  // 获取当前消息
  useEffect(() => {
    if (chat.started) {
      // 从API或数据库获取当前对话消息
      if (db) {
        window.ipc
          ?.invoke('get-current-messages')
          .then((messages: unknown) => {
            if (Array.isArray(messages)) {
              setCurrentMessages(messages);
            }
          })
          .catch(console.error);
      }
    } else {
      setCurrentMessages([]);
    }
  }, [chat.started]);

  useEffect(() => {
    // 注册监听器
    const unsubscribe = window.ipc?.on('menu-action', handleMenuAction);

    // 清理函数
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [handleMenuAction]);

  // 监听消息更新
  useEffect(() => {
    const messageListener = window.ipc?.on('messages-updated', (event, messages) => {
      if (Array.isArray(messages)) {
        setCurrentMessages(messages);
      }
    });

    return () => {
      if (messageListener) {
        messageListener();
      }
    };
  }, []);

  return {
    // 可以在这里添加一些公共方法，以便在组件中使用
    showAbout: () => handleMenuAction(null, 'show-about'),
    newFile: () => handleMenuAction(null, 'new-file'),
    openFile: () => handleMenuAction(null, 'open-file'),
    saveFile: () => handleMenuAction(null, 'save-file'),
    saveAsFile: () => handleMenuAction(null, 'save-as-file'),
    exportJson: () => handleMenuAction(null, 'export-json'),
    exportHtml: () => handleMenuAction(null, 'export-html'),
    exportPdf: () => handleMenuAction(null, 'export-pdf'),
    openSettings: () => handleMenuAction(null, 'open-settings'),
    clearHistory: () => handleMenuAction(null, 'clear-history'),
  };
}
