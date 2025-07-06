import axios from "axios";
import { Message, MessageBox } from "element-ui";
import store from "../store";
import { getToken } from "@/utils/auth";

// 创建axios实例，专门用于新后端API
const service = axios.create({
  baseURL: "https://new.boyangchuanggu.com", // 新后端API的base_url
  timeout: 15000 // 请求超时时间
});

// request拦截器
service.interceptors.request.use(
  config => {
    if (store.getters.token) {
      config.headers["Authorization"] = getToken(); // 让每个请求携带自定义token
    }
    return config;
  },
  error => {
    console.log(error); // for debug
    Promise.reject(error);
  }
);

// response拦截器
service.interceptors.response.use(
  response => {
    const res = response.data;
    console.log("原始响应数据:", res);
    if (!res.success) {
      Message({
        message: res.message || "请求失败",
        type: "error",
        duration: 3 * 1000
      });

      // 401:未登录
      if (res.code === 401) {
        MessageBox.confirm(
          "你已被登出，可以取消继续留在该页面，或者重新登录",
          "确定登出",
          {
            confirmButtonText: "重新登录",
            cancelButtonText: "取消",
            type: "warning"
          }
        ).then(() => {
          store.dispatch("FedLogOut").then(() => {
            location.reload(); // 为了重新实例化vue-router对象 避免bug
          });
        });
      }
      return Promise.reject(res.message || "Error");
    } else {
      return res;
    }
  },
  error => {
    console.log("err" + error); // for debug
    Message({
      message: error.message || "请求失败",
      type: "error",
      duration: 3 * 1000
    });
    return Promise.reject(error);
  }
);

export default service;
