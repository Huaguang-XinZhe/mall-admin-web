<template>
  <div>
    <el-upload :action="useOss ? ossUploadUrl : minioUploadUrl" :data="useOss ? dataObj : null" list-type="picture"
      :multiple="false" :show-file-list="showFileList" :file-list="fileList" :before-upload="beforeUpload"
      :on-remove="handleRemove" :on-success="handleUploadSuccess" :on-preview="handlePreview">
      <el-button size="small" type="primary">点击上传</el-button>
      <div slot="tip" class="el-upload__tip">只能上传jpg/png文件，且不超过10MB</div>
    </el-upload>
    <el-dialog :visible.sync="dialogVisible">
      <img width="100%" :src="fileList[0].url" alt="">
    </el-dialog>
  </div>
</template>
<script>
import { policy } from '@/api/oss'

export default {
  name: 'singleUpload',
  props: {
    value: String
  },
  computed: {
    imageUrl() {
      return this.value;
    },
    imageName() {
      if (this.value != null && this.value !== '') {
        return this.value.substr(this.value.lastIndexOf("/") + 1);
      } else {
        return null;
      }
    },
    fileList() {
      return [{
        name: this.imageName,
        url: this.imageUrl
      }]
    },
    showFileList: {
      get: function () {
        return this.value !== null && this.value !== '' && this.value !== undefined;
      },
      set: function (newValue) {
      }
    }
  },
  data() {
    return {
      dataObj: {
        policy: '',
        signature: '',
        key: '',
        ossaccessKeyId: '',
        dir: '',
        host: '',
        // callback:'',
      },
      dialogVisible: false,
      useOss: true, //使用oss->true;使用MinIO->false
      ossUploadUrl: 'https://boyangchuanggu-mall.oss-cn-guangzhou.aliyuncs.com',
      minioUploadUrl: process.env.BASE_API + '/minio/upload',
    };
  },
  methods: {
    emitInput(val) {
      this.$emit('input', val)
    },
    handleRemove(file, fileList) {
      this.emitInput('');
    },
    handlePreview(file) {
      this.dialogVisible = true;
    },
    beforeUpload(file) {
      let _self = this;
      if (!this.useOss) {
        //不使用oss不需要获取策略
        return true;
      }
      return new Promise((resolve, reject) => {
        policy().then(response => {
          _self.dataObj.policy = response.data.policy;
          _self.dataObj.signature = response.data.signature;
          _self.dataObj.ossaccessKeyId = response.data.accessKeyId;
          _self.dataObj.key = response.data.dir + '/${filename}';
          _self.dataObj.dir = response.data.dir;
          _self.dataObj.host = response.data.host;
          // _self.dataObj.callback = response.data.callback;
          resolve(true)
        }).catch(err => {
          console.log(err)
          reject(false)
        })
      })
    },
    handleUploadSuccess(res, file) {
      this.showFileList = true;
      this.fileList.pop();
      let url = this.dataObj.host + '/' + this.dataObj.dir + '/' + file.name;
      if (!this.useOss) {
        //不使用oss直接获取图片路径
        url = res.data.url;
      }
      this.fileList.push({ name: file.name, url: url });
      this.emitInput(this.fileList[0].url);
    }
  }
}
</script>
<style></style>
