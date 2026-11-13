# 船舶区域监控系统 - Java后端

## 📋 项目简介

这是船舶区域监控系统的Java版本后端，使用Spring Boot 3.2 + PostgreSQL + PostGIS实现。

## 🛠️ 技术栈

- **Spring Boot 3.2.1** - 核心框架
- **Spring Data JPA** - 数据持久化
- **Spring WebSocket** - 实时通信
- **PostgreSQL 15+** - 关系型数据库
- **PostGIS** - 地理空间扩展
- **Hibernate Spatial** - 地理空间ORM
- **Lombok** - 简化代码
- **Hutool** - 工具库

## 📁 项目结构

```
src/
├── main/
│   ├── java/com/oceanmining/monitoring/
│   │   ├── ShipMonitoringApplication.java    # 主应用类
│   │   ├── config/                            # 配置类
│   │   ├── controller/                        # 控制器
│   │   ├── service/                           # 服务层
│   │   ├── repository/                        # 数据访问层
│   │   ├── entity/                            # 实体类
│   │   ├── dto/                               # 数据传输对象
│   │   ├── client/                            # 第三方API客户端
│   │   ├── websocket/                         # WebSocket处理
│   │   ├── scheduler/                         # 定时任务
│   │   ├── enums/                             # 枚举
│   │   ├── exception/                         # 异常处理
│   │   └── util/                              # 工具类
│   └── resources/
│       ├── application.yml                    # 主配置文件
│       ├── application-dev.yml                # 开发环境配置
│       └── application-prod.yml               # 生产环境配置
└── test/                                      # 测试代码
```

## 🚀 快速开始

### 前置要求

- JDK 17+
- Maven 3.8+
- PostgreSQL 15+（已安装PostGIS扩展）

### 1. 配置数据库

```bash
# 执行数据库初始化脚本
psql -U postgres -f ../database_postgres.sql

# 执行气象数据表初始化脚本
psql -U postgres -d ship_monitoring -f ../database_weather_data.sql
```

### 2. 配置环境变量

创建 `.env` 文件或设置环境变量：

```bash
SHIPXY_API_KEY=your_shipxy_api_key
DB_PASSWORD=your_db_password
PUBLIC_URL=http://your-domain.com
```

### 3. 编译项目

```bash
mvn clean install
```

### 4. 运行项目

```bash
# 开发环境
mvn spring-boot:run -Dspring-boot.run.profiles=dev

# 或直接运行
java -jar target/ship-monitoring-backend-1.0.0.jar
```

### 5. 迁移气象数据（首次运行）

```bash
# 使用REST API触发迁移
curl -X POST http://localhost:8081/api/migration/all

# 或者修改application.yml设置auto-run: true自动迁移
```

详细步骤: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### 6. 访问API

- API地址: http://localhost:8081
- WebSocket: ws://localhost:8081/ws
- Swagger文档: http://localhost:8081/swagger-ui.html (待添加)

### 7. 测试API

```bash
# Windows
test-api.bat

# Linux/Mac
./test-api.sh
```

## 📡 API端点

### 气象数据API (新增)
- `GET /api/weather/metadata/{type}` - 获取气象数据元数据
- `GET /api/weather/data/{type}/{timeIndex}` - 获取气象数据
- `GET /api/weather/available/{type}` - 获取可用时间索引
- `POST /api/migration/all` - 迁移所有气象数据
- `POST /api/migration/{type}` - 迁移指定类型数据

支持的数据类型: `wind` (风场), `ocean_current` (洋流), `wave` (波浪)

详细文档: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 区域管理
- `POST /api/areas` - 创建监控区域
- `GET /api/areas` - 获取区域列表
- `GET /api/areas/{id}/ships` - 获取区域内船舶
- `GET /api/areas/{id}/events` - 获取区域事件日志
- `DELETE /api/areas/{id}` - 删除监控区域

### Webhook
- `POST /webhook/area` - 接收船讯网推送

### 测试接口
- `POST /api/test/ship-enter` - 模拟船舶进入
- `POST /api/test/ship-leave` - 模拟船舶离开
- `POST /api/test/warning` - 模拟预警
- `GET /api/test/status` - 查看系统状态

## 🔧 开发指南

### 添加新功能

1. 在 `entity/` 创建实体类
2. 在 `repository/` 创建Repository接口
3. 在 `service/` 实现业务逻辑
4. 在 `controller/` 添加API端点
5. 编写单元测试

### 代码规范

- 使用Lombok简化代码
- 遵循RESTful API设计规范
- 统一异常处理
- 统一响应格式

## 📝 功能状态

### 已完成 ✅
- [x] 气象数据API（风场、洋流、波浪）
- [x] 数据库Schema和实体类
- [x] Repository层
- [x] Service层（含缓存）
- [x] Controller层
- [x] 数据迁移服务
- [x] 全局异常处理
- [x] GZIP压缩
- [x] API文档

### 进行中 🚧
- [ ] 前端API集成
- [ ] Swagger UI配置
- [ ] 单元测试和集成测试

### 待实现 📋
- [ ] 区域管理功能
- [ ] WebSocket实时通信
- [ ] 船讯网API集成
- [ ] 定时任务
- [ ] 性能监控

详细任务: [.kiro/specs/weather-data-api/tasks.md](../../.kiro/specs/weather-data-api/tasks.md)

## 📚 相关文档

- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - 气象数据API详细文档
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - 数据迁移指南
- [NEXT_STEPS.md](./NEXT_STEPS.md) - 下一步操作清单
- [COMPILATION_FIXES.md](./COMPILATION_FIXES.md) - 编译问题修复记录

## 🐛 常见问题

### Q: 数据库连接失败？
A: 检查PostgreSQL是否启动，PostGIS扩展是否安装。

### Q: 编译失败？
A: 确保JDK版本为17+，Maven版本为3.8+。参考 [COMPILATION_FIXES.md](./COMPILATION_FIXES.md)

### Q: 端口被占用？
A: 修改 `application.yml` 中的 `server.port`。

### Q: 数据迁移失败？
A: 检查文件路径是否正确，参考 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)

### Q: API返回404？
A: 确保已执行数据迁移，检查数据库是否有数据。

## 📄 许可证

MIT License

## 👥 贡献者

Ocean Mining Team
