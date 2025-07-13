import request from '@/utils/request'

// 根据订单编号获取微信支付交易信息
export function getWxTransaction(orderSn) {
  return request({
    url: '/wx-delivery/transaction/order/' + orderSn,
    method: 'get'
  })
}

// 根据用户openid获取订单和交易信息
export function getWxTransactionByOpenid(openid) {
  return request({
    url: '/wx-delivery/transaction/user/' + openid,
    method: 'get'
  })
}

// 提交微信物流信息
export function submitWxDelivery(data) {
  return request({
    url: '/wx-delivery/submit',
    method: 'post',
    data
  })
}

// 获取物流轨迹信息
export function getLogisticsTrack(params) {
  return request({
    url: '/wx-delivery/logistics/track',
    method: 'get',
    params
  })
}

// 获取物流公司列表
export const expressCompanies = [
  { code: 'SF', name: '顺丰速运' },
  { code: 'ZTO', name: '中通快递' },
  { code: 'YTO', name: '圆通速递' },
  { code: 'STO', name: '申通快递' },
  { code: 'YD', name: '韵达速递' },
  { code: 'EMS', name: '中国邮政EMS' },
  { code: 'HTKY', name: '百世快递' },
  { code: 'JD', name: '京东物流' },
  { code: 'YZPY', name: '邮政快递包裹' },
  { code: 'HHTT', name: '天天快递' }
] 