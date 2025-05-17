# 使用 Node.js 14 作为基础镜像
FROM node:14

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 暴露 8090 端口
EXPOSE 8090

# 启动开发服务器
CMD ["npm", "run", "dev"] 