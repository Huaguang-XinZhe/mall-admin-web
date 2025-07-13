<template>
  <el-card class="box-card">
    <div slot="header" class="clearfix">
      <span>微信物流发货</span>
    </div>
    <el-form :model="deliveryForm" :rules="rules" ref="deliveryForm" label-width="120px" size="small">
      <!-- <el-form-item label="订单编号" prop="orderSn">
        <el-input v-model="deliveryForm.orderSn" disabled></el-input>
      </el-form-item>
      <el-form-item label="用户账号" prop="encodedOpenid">
        <el-input v-model="deliveryForm.encodedOpenid" disabled></el-input>
      </el-form-item> -->
      <el-form-item label="微信交易号" prop="transactionId">
        <el-input v-model="deliveryForm.transactionId" disabled></el-input>
      </el-form-item>
      <el-form-item label="用户OpenID" prop="openid">
        <el-input v-model="deliveryForm.openid" disabled></el-input>
      </el-form-item>
      <el-form-item label="物流公司" prop="expressCompany">
        <el-select v-model="deliveryForm.expressCompany" placeholder="请选择物流公司">
          <el-option
            v-for="item in expressCompanies"
            :key="item.code"
            :label="item.name"
            :value="item.code">
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="物流单号" prop="trackingNo">
        <el-input v-model="deliveryForm.trackingNo" placeholder="请输入物流单号"></el-input>
      </el-form-item>
      <el-form-item label="商品描述" prop="itemDesc">
        <el-input v-model="deliveryForm.itemDesc" placeholder="商品描述信息"></el-input>
      </el-form-item>
      <!-- 删除发件人电话表单项 -->
      <el-form-item>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">提交物流信息</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script>
import { getWxTransaction, getWxTransactionByOpenid, submitWxDelivery, expressCompanies } from '@/api/wxDelivery'
import { getOrderDetail } from '@/api/order'

export default {
  name: 'wxDeliveryForm',
  props: {
    orderId: {
      type: [Number, String],
      default: null
    },
    orderSn: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      expressCompanies,
      deliveryForm: {
        orderSn: this.orderSn,
        encodedOpenid: '',
        transactionId: '',
        openid: '',
        expressCompany: '',
        trackingNo: '',
        itemDesc: '',
        consignorContact: '138****0000' // 保留默认值，但不在界面显示
      },
      rules: {
        expressCompany: [
          { required: true, message: '请选择物流公司', trigger: 'change' }
        ],
        trackingNo: [
          { required: true, message: '请输入物流单号', trigger: 'blur' }
        ]
      },
      loading: false,
      submitLoading: false
    }
  },
  created() {
    if (this.orderSn) {
      this.deliveryForm.orderSn = this.orderSn
      this.getOrderInfo()
    }
  },
  methods: {
    getOrderInfo() {
      if (this.orderId) {
        getOrderDetail(this.orderId).then(response => {
          const orderDetail = response.data
          // 从用户名中提取base64编码的openid
          if (orderDetail.memberUsername) {
            this.deliveryForm.encodedOpenid = orderDetail.memberUsername
            // 自动解码用户账号获取openid
            try {
              this.deliveryForm.openid = atob(orderDetail.memberUsername)
              // 自动获取交易信息
              this.getTransactionInfo()
            } catch (error) {
              this.$message({
                message: '用户账号解码失败',
                type: 'error'
              })
            }
          }
        })
      }
    },
    getTransactionInfo() {
      if (!this.deliveryForm.orderSn) {
        this.$message({
          message: '订单编号不能为空',
          type: 'warning'
        })
        return
      }
      
      this.loading = true
      
      // 优先使用订单号查询交易信息
      getWxTransaction(this.deliveryForm.orderSn)
        .then(response => {
          if (response.code === 200 && response.data) {
            // 修正字段名：使用transactionId而不是transaction_id
            const { transactionId, openid } = response.data
            this.deliveryForm.transactionId = transactionId
            
            // 如果返回了openid，则更新表单中的openid
            if (openid && !this.deliveryForm.openid) {
              this.deliveryForm.openid = openid
            }
            
            this.$message({
              message: '获取交易信息成功',
              type: 'success'
            })
          } else {
            // 如果订单号查询失败，尝试使用openid查询
            this.getTransactionByOpenid()
          }
        })
        .catch(() => {
          // 如果订单号查询失败，尝试使用openid查询
          this.getTransactionByOpenid()
        })
        .finally(() => {
          this.loading = false
        })
    },
    getTransactionByOpenid() {
      if (!this.deliveryForm.openid) {
        this.$message({
          message: '无法获取用户OpenID',
          type: 'warning'
        })
        return
      }
      
      this.loading = true
      getWxTransactionByOpenid(this.deliveryForm.openid)
        .then(response => {
          if (response.code === 200 && response.data) {
            // 修正字段名：使用orderSn和transactionId
            const { orderSn, transactionId } = response.data
            
            // 如果返回了订单号，更新表单
            if (orderSn && !this.deliveryForm.orderSn) {
              this.deliveryForm.orderSn = orderSn
            }
            
            this.deliveryForm.transactionId = transactionId
            
            this.$message({
              message: '获取交易信息成功',
              type: 'success'
            })
          } else {
            this.$message({
              message: response.message || '获取交易信息失败',
              type: 'error'
            })
          }
        })
        .catch(error => {
          this.$message({
            message: error.message || '获取交易信息失败',
            type: 'error'
          })
        })
        .finally(() => {
          this.loading = false
        })
    },
    submitForm() {
      this.$refs.deliveryForm.validate(valid => {
        if (valid) {
          if (!this.deliveryForm.transactionId) {
            this.$message({
              message: '请先获取交易信息',
              type: 'warning'
            })
            return
          }
          this.submitLoading = true
          submitWxDelivery({
            orderSn: this.deliveryForm.orderSn,
            transactionId: this.deliveryForm.transactionId,
            openid: this.deliveryForm.openid,
            expressCompany: this.deliveryForm.expressCompany,
            trackingNo: this.deliveryForm.trackingNo,
            itemDesc: this.deliveryForm.itemDesc,
            consignorContact: this.deliveryForm.consignorContact
          })
            .then(response => {
              if (response.code === 200) {
                this.$message({
                  message: '物流信息提交成功',
                  type: 'success'
                })
                this.$emit('submit-success')
              } else {
                this.$message({
                  message: response.message || '物流信息提交失败',
                  type: 'error'
                })
              }
            })
            .catch(error => {
              this.$message({
                message: error.message || '物流信息提交失败',
                type: 'error'
              })
            })
            .finally(() => {
              this.submitLoading = false
            })
        }
      })
    },
    resetForm() {
      this.$refs.deliveryForm.resetFields()
      this.deliveryForm.transactionId = ''
      this.deliveryForm.openid = ''
    }
  }
}
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}
</style> 