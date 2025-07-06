<template>
  <div class="app-container">
    <!-- 完整邀请树视图 -->
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>完整邀请树</span>
        <el-button style="float: right; padding: 3px 0" type="text" @click="refreshFullTree">刷新树</el-button>
      </div>
      <div class="full-tree-container">
        <el-tree
          v-if="fullTreeData.length > 0"
          :data="fullTreeData"
          :props="defaultProps"
          :expand-on-click-node="false"
          default-expand-all
          node-key="openid">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <div v-if="data.icon" class="user-avatar-small">
              <img :src="data.icon" alt="用户头像">
            </div>
            <div v-else class="user-avatar-small" :style="{ backgroundColor: data.avatarColor }">
              {{ data.phoneLastFour }}
            </div>
            <span v-if="data.nickname">{{ data.nickname }}</span>
            <span v-if="data.phone">({{ data.phone }})</span>
            <span v-if="data.invite_code" class="invite-code">邀请码: {{ data.invite_code }}</span>
          </span>
        </el-tree>
        <div v-else class="loading-tree">
          <i class="el-icon-loading"></i>
          <span>正在加载邀请树...</span>
        </div>
      </div>
    </el-card>

    <el-card class="filter-container" shadow="never">
      <div>
        <i class="el-icon-search"></i>
        <span>筛选搜索</span>
        <el-button
          style="float: right"
          type="primary"
          @click="handleSearchList()"
          size="small">
          查询结果
        </el-button>
        <el-button
          style="float: right;margin-right: 15px"
          @click="handleResetSearch()"
          size="small">
          重置
        </el-button>
      </div>
      <div style="margin-top: 15px">
        <el-form :inline="true" :model="listQuery" size="small" label-width="140px">
          <el-form-item label="用户昵称：">
            <el-input style="width: 203px" v-model="listQuery.nickname" placeholder="用户昵称"></el-input>
          </el-form-item>
          <el-form-item label="手机号：">
            <el-input style="width: 203px" v-model="listQuery.phone" placeholder="手机号"></el-input>
          </el-form-item>
          <el-form-item label="邀请码：">
            <el-input style="width: 203px" v-model="listQuery.inviteCode" placeholder="邀请码"></el-input>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
    <el-card class="operate-container" shadow="never">
      <i class="el-icon-tickets"></i>
      <span>数据列表</span>
    </el-card>
    <div class="table-container">
      <el-table ref="userTable"
                :data="filteredList"
                style="width: 100%"
                v-loading="listLoading"
                border>
        <el-table-column label="OpenID" width="220" align="center">
          <template slot-scope="scope">{{scope.row.openid}}</template>
        </el-table-column>
        <el-table-column label="头像" width="80" align="center">
          <template slot-scope="scope">
            <img v-if="scope.row.icon" :src="scope.row.icon" class="user-avatar" alt="用户头像">
            <div v-else class="user-avatar" :style="{ backgroundColor: getAvatarColor(scope.row.phone) }">
              {{ getPhoneLastFour(scope.row.phone) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="昵称" align="center">
          <template slot-scope="scope">{{scope.row.nickname || ''}}</template>
        </el-table-column>
        <el-table-column label="手机号" width="120" align="center">
          <template slot-scope="scope">{{scope.row.phone}}</template>
        </el-table-column>
        <el-table-column label="邀请码" width="100" align="center">
          <template slot-scope="scope">{{scope.row.invite_code}}</template>
        </el-table-column>
        <el-table-column label="来源邀请码" width="120" align="center">
          <template slot-scope="scope">{{scope.row.invite_from || '-'}}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="160" align="center">
          <template slot-scope="scope">{{formatDate(scope.row.create_time)}}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              @click="handleViewInviteTree(scope.row)">查看邀请树</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-container">
        <el-pagination
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page.sync="listQuery.pageNum"
          :page-sizes="[5, 10, 15]"
          :page-size="listQuery.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total">
        </el-pagination>
      </div>
    </div>
    
    <!-- 邀请树弹窗 -->
    <el-dialog
      title="邀请关系树"
      :visible.sync="inviteTreeDialogVisible"
      width="60%">
      <div v-if="currentUser" class="invite-tree-info">
        <div class="user-info-header">
          <img v-if="currentUser.icon" :src="currentUser.icon" class="user-avatar-large" alt="用户头像">
          <div v-else class="user-avatar-large" :style="{ backgroundColor: getAvatarColor(currentUser.phone) }">
            {{ getPhoneLastFour(currentUser.phone) }}
          </div>
          <div class="user-info-details">
            <p v-if="currentUser.nickname"><strong>当前用户：</strong>{{currentUser.nickname}} ({{currentUser.phone}})</p>
            <p v-else><strong>当前用户：</strong>{{currentUser.phone}}</p>
            <p><strong>邀请码：</strong>{{currentUser.invite_code}}</p>
            <p><strong>注册时间：</strong>{{formatDate(currentUser.create_time)}}</p>
            <p v-if="currentUser.invite_from"><strong>来源邀请码：</strong>{{currentUser.invite_from}}</p>
          </div>
        </div>
      </div>
      <div class="invite-tree-container">
        <el-tree
          :data="inviteTreeData"
          :props="defaultProps"
          :expand-on-click-node="false"
          default-expand-all
          node-key="openid">
          <span class="custom-tree-node" slot-scope="{ node, data }">
            <div v-if="data.icon" class="user-avatar-small">
              <img :src="data.icon" alt="用户头像">
            </div>
            <div v-else class="user-avatar-small" :style="{ backgroundColor: data.avatarColor }">
              {{ data.phoneLastFour }}
            </div>
            <span v-if="data.nickname">{{ data.label }}</span>
            <span v-if="data.phone">({{ data.phone }})</span>
            <span v-if="data.invite_code" class="invite-code">邀请码: {{ data.invite_code }}</span>
          </span>
        </el-tree>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="inviteTreeDialogVisible = false">关闭</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import { getAllUsersInviteInfo } from '@/api/invite';
import { formatDate } from '@/utils/date';

export default {
  name: 'inviteList',
  data() {
    return {
      listQuery: {
        nickname: null,
        phone: null,
        inviteCode: null,
        pageNum: 1,
        pageSize: 10
      },
      list: [],
      filteredList: [],
      total: 0,
      listLoading: false,
      inviteTreeDialogVisible: false,
      currentUser: null,
      inviteTreeData: [],
      fullTreeData: [],
      defaultProps: {
        children: 'children',
        label: 'label'
      },
      colorCache: {} // 缓存用户的颜色
    }
  },
  created() {
    this.getList();
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        // 将字符串日期转换为日期对象
        const date = new Date(dateStr);
        // 检查日期是否有效
        if (isNaN(date.getTime())) {
          return dateStr; // 如果无效，返回原始字符串
        }
        // 格式化日期
        return formatDate(date, 'yyyy-MM-dd hh:mm:ss');
      } catch (e) {
        console.error('日期格式化错误:', e);
        return dateStr;
      }
    },
    handleResetSearch() {
      this.listQuery = {
        nickname: null,
        phone: null,
        inviteCode: null,
        pageNum: 1,
        pageSize: 10
      };
      this.handleSearchList();
    },
    handleSearchList() {
      this.filteredList = this.list.filter(item => {
        const matchNickname = !this.listQuery.nickname || 
          (item.nickname && item.nickname.includes(this.listQuery.nickname));
        const matchPhone = !this.listQuery.phone || 
          (item.phone && item.phone.includes(this.listQuery.phone));
        const matchInviteCode = !this.listQuery.inviteCode || 
          (item.invite_code && item.invite_code.includes(this.listQuery.inviteCode)) || 
          (item.invite_from && item.invite_from.includes(this.listQuery.inviteCode));
        return matchNickname && matchPhone && matchInviteCode;
      });
    },
    getList() {
      this.listLoading = true;
      getAllUsersInviteInfo().then(response => {
        this.listLoading = false;
        console.log('API响应数据:', response);
        console.log('用户列表数据:', response.data.users);
        this.list = response.data.users;
        this.filteredList = this.list;
        this.total = response.data.total;
        
        // 构建完整的邀请树
        this.buildFullTree();
      }).catch((error) => {
        console.error('获取数据失败:', error);
        this.listLoading = false;
      });
    },
    handleViewInviteTree(row) {
      this.currentUser = row;
      this.inviteTreeDialogVisible = true;
      this.buildInviteTree(row);
    },
    buildInviteTree(rootUser) {
      // 构建邀请树数据
      const rootNode = {
        openid: rootUser.openid,
        label: rootUser.nickname || '',
        nickname: rootUser.nickname,
        phone: rootUser.phone,
        phoneLastFour: this.getPhoneLastFour(rootUser.phone),
        avatarColor: this.getAvatarColor(rootUser.phone),
        icon: rootUser.icon,
        invite_code: rootUser.invite_code,
        children: []
      };
      
      // 查找所有使用了该用户邀请码的用户
      if (rootUser.invite_code) {
        const invitedUsers = this.list.filter(user => 
          user.invite_from === rootUser.invite_code && user.openid !== rootUser.openid
        );
        
        // 递归构建树
        for (const user of invitedUsers) {
          const childNode = this.buildInviteTreeRecursive(user);
          rootNode.children.push(childNode);
        }
      }
      
      this.inviteTreeData = [rootNode];
    },
    buildInviteTreeRecursive(user) {
      const node = {
        openid: user.openid,
        label: user.nickname || '',
        nickname: user.nickname,
        phone: user.phone,
        phoneLastFour: this.getPhoneLastFour(user.phone),
        avatarColor: this.getAvatarColor(user.phone),
        icon: user.icon,
        invite_code: user.invite_code,
        children: []
      };
      
      // 查找所有使用了该用户邀请码的用户
      if (user.invite_code) {
        const invitedUsers = this.list.filter(u => 
          u.invite_from === user.invite_code && u.openid !== user.openid
        );
        
        // 递归构建子树
        for (const invitedUser of invitedUsers) {
          const childNode = this.buildInviteTreeRecursive(invitedUser);
          node.children.push(childNode);
        }
      }
      
      return node;
    },
    buildFullTree() {
      // 查找系统邀请码 "AAA" 的直接邀请用户
      const rootUsers = this.list.filter(user => user.invite_from === 'AAA');
      
      if (rootUsers.length === 0) {
        // 如果没有找到直接使用AAA邀请码的用户，创建一个虚拟根节点
        const rootNode = {
          openid: 'system-root',
          label: '系统邀请码',
          nickname: '系统邀请码',
          phone: '',
          phoneLastFour: 'AAA',
          avatarColor: '#409EFF',
          icon: null,
          invite_code: 'AAA',
          children: []
        };
        
        // 查找所有一级邀请用户（没有invite_from或invite_from不在列表中的用户）
        const topLevelUsers = this.list.filter(user => {
          // 如果没有invite_from，或者invite_from不是任何用户的invite_code，则认为是一级用户
          if (!user.invite_from) return true;
          if (user.invite_from === 'AAA') return true;
          
          // 检查是否有其他用户的invite_code与当前用户的invite_from匹配
          const hasParent = this.list.some(potentialParent => 
            potentialParent.invite_code === user.invite_from
          );
          
          return !hasParent;
        });
        
        // 为每个一级用户构建子树
        for (const user of topLevelUsers) {
          const childNode = this.buildInviteTreeRecursive(user);
          rootNode.children.push(childNode);
        }
        
        this.fullTreeData = [rootNode];
      } else {
        // 如果找到了直接使用AAA邀请码的用户，以这些用户为根构建树
        const rootNodes = [];
        
        for (const rootUser of rootUsers) {
          const rootNode = {
            openid: rootUser.openid,
            label: rootUser.nickname || '',
            nickname: rootUser.nickname,
            phone: rootUser.phone,
            phoneLastFour: this.getPhoneLastFour(rootUser.phone),
            avatarColor: this.getAvatarColor(rootUser.phone),
            icon: rootUser.icon,
            invite_code: rootUser.invite_code,
            children: []
          };
          
          // 查找所有使用了该用户邀请码的用户
          const invitedUsers = this.list.filter(user => 
            user.invite_from === rootUser.invite_code && user.openid !== rootUser.openid
          );
          
          // 递归构建树
          for (const user of invitedUsers) {
            const childNode = this.buildInviteTreeRecursive(user);
            rootNode.children.push(childNode);
          }
          
          rootNodes.push(rootNode);
        }
        
        // 创建一个系统根节点，包含所有使用AAA邀请码的用户
        const systemRoot = {
          openid: 'system-root',
          label: '系统邀请码',
          nickname: '系统邀请码',
          phone: '',
          phoneLastFour: 'AAA',
          avatarColor: '#409EFF',
          icon: null,
          invite_code: 'AAA',
          children: rootNodes
        };
        
        this.fullTreeData = [systemRoot];
      }
    },
    refreshFullTree() {
      this.fullTreeData = [];
      this.getList();
    },
    handleSizeChange(newSize) {
      this.listQuery.pageSize = newSize;
      this.handleSearchList();
    },
    handleCurrentChange(newPage) {
      this.listQuery.pageNum = newPage;
      this.handleSearchList();
    },
    // 获取手机号后四位
    getPhoneLastFour(phone) {
      if (!phone) return '';
      return phone.length > 4 ? phone.slice(-4) : phone;
    },
    // 根据手机号生成一个固定的颜色
    getAvatarColor(phone) {
      if (!phone) return '#909399';
      
      // 使用缓存避免重复计算
      if (this.colorCache[phone]) {
        return this.colorCache[phone];
      }
      
      // 预定义一组好看的颜色
      const colors = [
        '#409EFF', // 蓝色
        '#67C23A', // 绿色
        '#E6A23C', // 黄色
        '#F56C6C', // 红色
        '#909399', // 灰色
        '#9B59B6', // 紫色
        '#3498DB', // 浅蓝色
        '#2ECC71', // 浅绿色
        '#F39C12', // 橙色
        '#E74C3C', // 深红色
        '#1ABC9C', // 青绿色
        '#34495E'  // 深灰蓝色
      ];
      
      // 使用手机号的后四位数字作为种子
      const lastFour = this.getPhoneLastFour(phone);
      const seed = parseInt(lastFour, 10) || 0;
      const colorIndex = seed % colors.length;
      
      // 缓存结果
      this.colorCache[phone] = colors[colorIndex];
      
      return colors[colorIndex];
    }
  }
}
</script>

<style scoped>
.full-tree-container {
  margin-top: 20px;
  max-height: 500px;
  overflow-y: auto;
  min-height: 300px;
}

.loading-tree {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.loading-tree i {
  margin-right: 10px;
  font-size: 20px;
}

.invite-tree-container {
  margin-top: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.invite-tree-info {
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 20px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
}

.invite-code {
  margin-left: 10px;
  color: #409EFF;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.user-info-header {
  display: flex;
  align-items: center;
}

.user-avatar-large {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10px;
}

.user-info-details {
  flex: 1;
}

.user-avatar-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
}

.user-avatar-small img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.user-avatar-placeholder-small {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 5px;
  font-size: 10px;
}

.box-card {
  margin-bottom: 20px;
}
</style> 