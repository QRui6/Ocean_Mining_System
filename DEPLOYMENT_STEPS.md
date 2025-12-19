# 船舶监控系统 - 完整部署步骤

## 📋 准备工作

确保你在项目根目录：`~/Downloads/demo`

---

## 第一步：卸载MySQL客户端

```bash
# 卸载MySQL客户端
sudo apt purge -y mysql-client-core-8.0

# 清理依赖
sudo apt autoremove -y

# 清理缓存
sudo apt autoclean

echo "✅ MySQL客户端已卸载"
```

---

## 第二步：安装PostgreSQL和PostGIS

```bash
# 更新软件包列表
sudo apt update

# 安装PostgreSQL和PostGIS
sudo apt install -y postgresql postgresql-contrib postgis

# 启动并设置开机自启
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 验证安装
psql --version
sudo systemctl status postgresql

echo "✅ PostgreSQL安装完成"
```

---

## 第三步：初始化数据库

```bash
# 进入后端目录
cd ~/Downloads/demo/backend

# 执行数据库初始化脚本
sudo -u postgres psql -f database_postgres.sql

# 验证数据库
sudo -u postgres psql -d ship_monitoring -c "\dt"

# 验证PostGIS扩展
sudo -u postgres psql -d ship_monitoring -c "SELECT PostGIS_Version();"

echo "✅ 数据库初始化完成"
```

**如果遇到权限问题，可以这样做：**
```bash
# 切换到postgres用户
sudo -i -u postgres

# 执行SQL
psql -f /home/k8s/Downloads/demo/backend/database_postgres.sql

# 退出postgres用户
exit
```

---

## 第四步：配置后端环境

```bash
# 进入后端目录
cd ~/Downloads/demo/backend

# 安装Node.js依赖
npm install

# 创建环境变量文件
cat > .env << 'EOF'
# 服务器配置
PORT=3000
WS_PORT=8080
PUBLIC_URL=http://localhost:3000

# PostgreSQL数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=
DB_NAME=ship_monitoring

# 船讯网API配置
SHIPXY_API_KEY=12687430e166478dba18ab327fd066a2
SHIPXY_BASE_URL=https://api.shipxy.com

# 更新间隔（秒）
UPDATE_INTERVAL=600

# 默认阈值
DEFAULT_WIND_THRESHOLD=15
DEFAULT_WAVE_THRESHOLD=3
EOF

echo "✅ 后端环境配置完成"
```

---

## 第五步：启动后端服务

**打开第一个终端窗口：**

```bash
cd ~/Downloads/demo/backend
npm start
```

你应该看到：
```
🚀 服务器启动成功: http://localhost:3000
📡 WebSocket服务: ws://localhost:8080
✅ PostgreSQL连接成功
```

**保持这个终端运行，不要关闭！**

---

## 第六步：启动前端服务

**打开第二个终端窗口：**

```bash
cd ~/Downloads/demo
npm run dev
```

你应该看到：
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**保持这个终端运行，不要关闭！**

---

## 第七步：访问系统

打开浏览器，访问：
```
http://localhost:5173
```

---

## 🎯 验证系统功能

### 1. 测试WebSocket连接

打开浏览器控制台（F12），应该看到：
```
✅ WebSocket连接成功
```

### 2. 测试区域创建

1. 点击右侧"区域监控"面板的"➕ 新建"按钮
2. 在地图上点击绘制多边形（至少3个点）
3. 右键或双击完成绘制
4. 输入区域名称，如"测试区域A"
5. 查看是否成功创建

### 3. 测试船舶搜索

1. 点击左侧"船舶追踪"
2. 切换到"单船搜索"
3. 输入MMSI：`413961925`
4. 点击搜索
5. 查看是否显示船舶信息

---

## 🔧 常见问题排查

### 问题1：PostgreSQL连接失败

```bash
# 检查PostgreSQL状态
sudo systemctl status postgresql

# 如果未启动，启动它
sudo systemctl start postgresql

# 测试连接
sudo -u postgres psql -d ship_monitoring -c "SELECT 1;"
```

### 问题2：后端启动失败

```bash
# 检查端口是否被占用
netstat -tulpn | grep 3000
netstat -tulpn | grep 8080

# 如果被占用，杀掉进程
sudo kill -9 <PID>

# 重新启动
cd ~/Downloads/demo/backend
npm start
```

### 问题3：前端无法连接后端

检查 `src/utils/shipxyApi.js` 中的配置：
```javascript
const BACKEND_API_BASE = import.meta.env.DEV 
    ? 'http://localhost:3000'  // 确保端口正确
    : '';
```

### 问题4：数据库初始化失败

```bash
# 删除数据库重新创建
sudo -u postgres psql -c "DROP DATABASE IF EXISTS ship_monitoring;"
sudo -u postgres psql -f ~/Downloads/demo/backend/database_postgres.sql
```

---

## 📊 查看数据库数据

```bash
# 登录数据库
sudo -u postgres psql -d ship_monitoring

# 查看所有表
\dt

# 查看区域列表
SELECT id, name, is_active FROM monitoring_areas;

# 查看区域内船舶
SELECT mmsi, ship_name, status FROM area_ships;

# 查看预警
SELECT * FROM warnings WHERE is_resolved = FALSE;

# 退出
\q
```

---

## 🛑 停止服务

### 停止后端
在后端终端按 `Ctrl + C`

### 停止前端
在前端终端按 `Ctrl + C`

### 停止PostgreSQL（如需要）
```bash
sudo systemctl stop postgresql
```

---

## 🚀 生产环境部署

如果要部署到生产环境，请参考：
- `backend/DEPLOYMENT.md` - 完整部署指南
- `backend/POSTGRES_SETUP.md` - PostgreSQL详细配置

---

## 📞 需要帮助？

如果遇到问题：
1. 检查终端的错误信息
2. 查看浏览器控制台（F12）
3. 检查PostgreSQL日志：`sudo tail -f /var/log/postgresql/postgresql-*.log`
4. 检查后端日志（终端输出）

---

## ✅ 部署完成检查清单

- [ ] PostgreSQL已安装并运行
- [ ] 数据库已初始化（有5个表）
- [ ] 后端服务已启动（端口3000和8080）
- [ ] 前端服务已启动（端口5173）
- [ ] 浏览器可以访问系统
- [ ] WebSocket连接成功
- [ ] 可以创建监控区域
- [ ] 可以搜索船舶

全部完成后，系统就可以正常使用了！🎉
