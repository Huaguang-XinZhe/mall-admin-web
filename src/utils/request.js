import axios from 'axios'
import { Message, MessageBox } from 'element-ui'
import store from '../store'
import { getToken } from '@/utils/auth'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.BASE_API, // api的base_url
  timeout: 15000 // 请求超时时间
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    if (store.getters.token) {
      config.headers['Authorization'] = getToken() // 直接使用token，不添加Bearer前缀
    }
    
    // 如果是微信物流相关API，修改baseURL为新后端地址
    if (config.url.startsWith('/wx-delivery/')) {
      config.baseURL = 'https://new.boyangchuanggu.com/api'
    }
    
    return config
  },
  error => {
    // Do something with request error
    console.log(error) // for debug
    Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    /**
     * code为非200是抛错 可结合自己业务进行修改
     */
    const res = response.data
    // 处理新后端API的响应格式
    if (response.config.url.includes('/wx-delivery/')) {
      // 新后端API返回格式: { code: 200, data: {}, message: '' }
      if (res.code !== 200) {
        Message({
          message: res.message || '操作失败',
          type: 'error',
          duration: 3 * 1000
        })
        return Promise.reject(res.message || 'Error')
      } else {
        return res
      }
    }
    // 处理老后端API的响应格式
    if (res.code !== 200) {
      Message({
        message: res.message,
        type: 'error',
        duration: 3 * 1000
      })

      // 401:未登录;
      if (res.code === 401) {
        MessageBox.confirm('你已被登出，可以取消继续留在该页面，或者重新登录', '确定登出', {
          confirmButtonText: '重新登录',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          store.dispatch('FedLogOut').then(() => {
            location.reload()// 为了重新实例化vue-router对象 避免bug
          })
        })
      }
      return Promise.reject('error')
    } else {
      return res
    }
  },
  error => {
    console.log('err' + error)// for debug
    Message({
      message: error.message,
      type: 'error',
      duration: 3 * 1000
    })
    return Promise.reject(error)
  }
)

export default service
