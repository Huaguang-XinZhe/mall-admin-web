import request from "@/utils/newRequest";

// 获取单个用户的邀请信息
export function getUserInviteInfo(openid) {
  return request({
    url: `/api/user/invite/${openid}`,
    method: "get"
  });
}

// 获取所有用户的邀请信息
export function getAllUsersInviteInfo() {
  return request({
    url: "/api/user/invite/list/all",
    method: "get"
  });
}
