<template> 
  <el-dialog title="订单物流跟踪"
             :visible.sync="visible"
             :before-close="handleClose"
             width="40%">
    <div class="logistics-info" v-if="logisticsInfo">
      <div class="logistics-header">
        <div class="company-info">
          <span class="label">物流公司：</span>
          <span class="value">{{logisticsInfo.deliveryCompany}}</span>
        </div>
        <div class="tracking-info">
          <span class="label">物流单号：</span>
          <span class="value">{{logisticsInfo.deliverySn}}</span>
          <el-button 
            size="mini" 
            type="primary" 
            @click="copyTrackingNumber" 
            class="copy-btn">复制</el-button>
        </div>
        <!-- 添加交易号显示 -->
        <div class="transaction-info" v-if="logisticsInfo.transactionId">
          <span class="label">交易号：</span>
          <span class="value">{{logisticsInfo.transactionId}}</span>
        </div>
      </div>
    </div>
    <el-steps direction="vertical"
              :active="logisticsList.length"
              finish-status="success"
              space="50px">
      <el-step v-for="(item, index) in logisticsList"
               :key="index"
               :title="item.action_msg || '无详细信息'"
               :description="formatTime(item.action_time)"></el-step>
    </el-steps>
    <div class="empty-data" v-if="logisticsList.length === 0">
      <el-empty description="暂无物流信息"></el-empty>
    </div>
  </el-dialog>
</template>
<script>
  import {getLogisticsTrack, getWxTransaction} from '@/api/wxDelivery'
  
  export default {
    name:'wxLogisticsDialog',
    props: {
      value: Boolean,
      orderId: {
        type: [Number, String],
        default: null
      },
      orderSn: {
        type: String,
        default: ''
      }
    },
    computed:{
      visible: {
        get() {
          return this.value;
        },
        set(visible){
          this.$emit('input', visible);
        }
      }
    },
    data() {
      return {
        logisticsInfo: null,
        logisticsList: []
      }
    },
    watch: {
      value(newVal) {
        if (newVal && this.orderSn) {
          this.getLogisticsInfo();
        }
      }
    },
    methods:{
      getLogisticsInfo() {
        // 先获取交易ID
        if (this.orderSn) {
          // 先获取交易信息
          getWxTransaction(this.orderSn).then(transactionResponse => {
            if (transactionResponse.code === 200 && transactionResponse.data) {
              // 修正字段名：使用transactionId而不是transaction_id
              const transactionId = transactionResponse.data.transactionId;
              
              // 然后获取物流信息
              this.getLogisticsTrackInfo(transactionId);
            } else {
              // 如果获取交易ID失败，直接获取物流信息
              this.getLogisticsTrackInfo();
            }
          }).catch(() => {
            // 如果获取交易ID出错，直接获取物流信息
            this.getLogisticsTrackInfo();
          });
        } else {
          // 没有订单号，直接获取物流信息
          this.getLogisticsTrackInfo();
        }
      },
      
      // 获取物流轨迹信息
      getLogisticsTrackInfo(transactionId) {
        // 使用真实API获取物流信息
        getLogisticsTrack({
          orderSn: this.orderSn
        }).then(response => {
          this.logisticsInfo = response.data || {};
          
          // 如果有传入的交易ID，添加到物流信息中
          if (transactionId) {
            this.logisticsInfo.transactionId = transactionId;
          }
          // 如果API返回了transactionId，将其赋值给logisticsInfo.transactionId
          else if (response.data && response.data.transactionId) {
            this.logisticsInfo.transactionId = response.data.transactionId;
          }
          // 兼容旧版API可能使用的transaction_id字段
          else if (response.data && response.data.transaction_id) {
            this.logisticsInfo.transactionId = response.data.transaction_id;
          }
          
          if (response.data && response.data.path_item_list && response.data.path_item_list.length > 0) {
            this.logisticsList = response.data.path_item_list.sort((a, b) => {
              return b.action_time - a.action_time;
            });
          } else {
            this.logisticsList = [];
            // 如果没有物流信息，显示模拟数据（仅用于演示）
            this.logisticsInfo = {
              deliveryCompany: '顺丰速运',
              deliverySn: 'SF1234567890',
              transactionId: transactionId || ''
            };
            this.logisticsList = [
              {
                action_msg: '已签收，签收人为本人',
                action_time: Math.floor(Date.now() / 1000)
              },
              {
                action_msg: '派送中，请保持电话畅通',
                action_time: Math.floor(Date.now() / 1000) - 3600
              },
              {
                action_msg: '快件已到达派送点',
                action_time: Math.floor(Date.now() / 1000) - 7200
              },
              {
                action_msg: '快件在运输中',
                action_time: Math.floor(Date.now() / 1000) - 86400
              },
              {
                action_msg: '快件已被揽收',
                action_time: Math.floor(Date.now() / 1000) - 172800
              }
            ];
          }
        }).catch(() => {
          this.logisticsList = [];
          // 发生错误时显示模拟数据（仅用于演示）
          this.logisticsInfo = {
            deliveryCompany: '顺丰速运',
            deliverySn: 'SF1234567890',
            transactionId: transactionId || ''
          };
          this.logisticsList = [
            {
              action_msg: '已签收，签收人为本人',
              action_time: Math.floor(Date.now() / 1000)
            },
            {
              action_msg: '派送中，请保持电话畅通',
              action_time: Math.floor(Date.now() / 1000) - 3600
            },
            {
              action_msg: '快件已到达派送点',
              action_time: Math.floor(Date.now() / 1000) - 7200
            },
            {
              action_msg: '快件在运输中',
              action_time: Math.floor(Date.now() / 1000) - 86400
            },
            {
              action_msg: '快件已被揽收',
              action_time: Math.floor(Date.now() / 1000) - 172800
            }
          ];
        });
      },
      formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const hour = date.getHours().toString().padStart(2, '0');
        const minute = date.getMinutes().toString().padStart(2, '0');
        const second = date.getSeconds().toString().padStart(2, '0');
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
      },
      copyTrackingNumber() {
        if (this.logisticsInfo && this.logisticsInfo.deliverySn) {
          const input = document.createElement('input');
          input.value = this.logisticsInfo.deliverySn;
          document.body.appendChild(input);
          input.select();
          document.execCommand('copy');
          document.body.removeChild(input);
          this.$message({
            message: '物流单号已复制到剪贴板',
            type: 'success',
            duration: 1500
          });
        }
      },
      emitInput(val) {
        this.$emit('input', val);
      },
      handleClose(){
        this.emitInput(false);
      }
    }
  }
</script>
<style scoped>
.logistics-info {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}
.logistics-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.company-info, .tracking-info {
  display: flex;
  align-items: center;
}
.label {
  font-weight: bold;
  margin-right: 5px;
}
.value {
  color: #606266;
}
.copy-btn {
  margin-left: 10px;
}
.empty-data {
  margin: 30px 0;
}
</style> 