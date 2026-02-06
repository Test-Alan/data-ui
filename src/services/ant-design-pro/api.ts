// @ts-ignore
/* eslint-disable */
import { getEnvProperties } from '@/config';
import { request } from 'umi';

const envProperties = getEnvProperties();
const baseUrl = `${envProperties.extSyncUrl}`;

/** 获取当前的用户 GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  const url = `${baseUrl}/api/auth/user/info`;
  const response = await request<API.ResposneWrapper<API.CurrentUser>>(url, {
    method: 'GET',
    ...(options || {}),
  });
  return response;
}

/** 退出登录接口 POST /api/login/outLogin */
// 注释掉：后端没有提供退出登录接口，前端只做本地清理
/*
export async function outLogin(options?: { [key: string]: any }) {
  const url = `${baseUrl}/api/login/outLogin`;
  return request<Record<string, any>>(url, {
    method: 'POST',
    ...(options || {}),
  });
}
*/

/** 登录接口 POST /api/login/account */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  const url = `${baseUrl}/api/auth/login`;
  console.log(111);
  const response = await request<API.ResposneWrapper<API.LoginResult>>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
  return response.data;
}

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 新建规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'PUT',
    ...(options || {}),
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'DELETE',
    ...(options || {}),
  });
}
