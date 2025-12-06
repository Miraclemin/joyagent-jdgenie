import { fetchEventSource, EventSourceMessage } from '@microsoft/fetch-event-source';
import { getToken, hasToken } from './token';

const customHost = SERVICE_BASE_URL || '';
const DEFAULT_SSE_URL = `${customHost}/web/api/v1/gpt/queryAgentStreamIncr`;

const getSSEHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Accept': 'text/event-stream',
  };
  
  // 添加token到请求头
  const token = getToken();
  if (token) {
    headers['X-Auth-Token'] = token;
  }
  
  return headers;
};

interface SSEConfig {
  body: any;
  handleMessage: (data: any) => void;
  handleError: (error: Error) => void;
  handleClose: () => void;
}

/**
 * 创建服务器发送事件（SSE）连接
 * @param config SSE 配置
 * @param url 可选的自定义 URL
 */
export default (config: SSEConfig, url: string = DEFAULT_SSE_URL): void => {
  const { body = null, handleMessage, handleError, handleClose } = config;

  // 检查token，如果没有token则不发起请求
  if (!hasToken()) {
    handleError(new Error('请先配置 Token，点击右上角设置按钮进行配置'));
    return;
  }

  let errorHandled = false;

  fetchEventSource(url, {
    method: 'POST',
    credentials: 'include',
    headers: getSSEHeaders(),
    body: JSON.stringify(body),
    openWhenHidden: true,
    // 配置重试策略：不重试，避免无限循环
    retry: () => {
      return 0; // 返回0表示不重试
    },
    onopen(res) {
      // 检查响应状态码
      if (res.status === 401) {
        if (!errorHandled) {
          errorHandled = true;
          handleError(new Error('Token验证失败，请检查Token配置'));
        }
        return Promise.reject(new Error('Unauthorized'));
      }
      if (res.ok && res.status === 200) {
        return; // 一切正常
      } else if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        // 客户端错误，不重试
        if (!errorHandled) {
          errorHandled = true;
          handleError(new Error(`请求失败，状态码: ${res.status}`));
        }
        return Promise.reject(new Error(`HTTP ${res.status}`));
      }
    },
    onmessage(event: EventSourceMessage) {
      if (event.data) {
        try {
          const parsedData = JSON.parse(event.data);
          handleMessage(parsedData);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          handleError(new Error('Failed to parse SSE message'));
        }
      }
    },
    onerror(error: Error) {
      console.error('SSE error:', error);
      // 如果错误还没有被处理过，则处理它
      if (!errorHandled) {
        errorHandled = true;
        // 如果是401错误，显示友好提示
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          handleError(new Error('Token验证失败，请检查Token配置'));
        } else {
          handleError(error);
        }
      }
      // 抛出错误以停止连接，retry函数已配置为不重试
      throw error;
    },
    onclose() {
      console.log('SSE connection closed');
      handleClose();
    }
  });
};
