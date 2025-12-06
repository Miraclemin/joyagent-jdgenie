/**
 * Token存储工具
 * 使用localStorage存储token
 */

const TOKEN_KEY = 'genie_auth_token';

/**
 * 获取token
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * 设置token
 */
export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * 清除token
 */
export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * 检查是否有token
 */
export const hasToken = (): boolean => {
  return getToken() !== null;
};

