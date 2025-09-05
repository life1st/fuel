# 开发文档

## 技术栈

- React 18
- TypeScript
- Vite
- Ant Design Mobile
- Zustand (状态管理)
- React Router
- Vitest (测试框架)
- Testing Library

## 开发环境要求

- Node.js >= 18
- pnpm >= 8

## 项目结构

```
src/
├── assets/        # 静态资源
├── components/    # 可复用组件
├── pages/         # 页面组件
├── store/         # 状态管理
├── styles/        # 全局样式
├── test/          # 测试工具
├── utils/         # 工具函数
├── main.tsx       # 应用入口
└── router.tsx     # 路由配置
```

## 开发命令

```bash
# 启动开发服务器
pnpm dev

# 运行测试
pnpm test
pnpm test:coverage  # 生成测试覆盖率报告
pnpm test:ui       # 使用 UI 模式运行测试

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

## 测试

项目使用 Vitest 和 Testing Library 进行测试。测试文件位于各个组件的 `__tests__` 目录下。

### 测试命令

- `pnpm test`: 运行所有测试
- `pnpm test:coverage`: 运行测试并生成覆盖率报告
- `pnpm test:ui`: 使用 UI 模式运行测试

### 测试规范

- 使用中文描述测试用例
- 测试用户交互而不是实现细节
- 避免使用 `data-testid` 属性
- 优先使用 `getByRole` 和 `getByText` 等语义化查询

## 状态管理

项目使用 Zustand 进行状态管理，主要状态包括：

- 车辆信息
- 能源记录
- 用户设置

## 路由配置

使用 React Router 进行路由管理，主要路由包括：

- `/`: 历史
- `/chart`: 统计
- `/settings`: 设置
- `/record/:id`: 记录

## 组件开发规范

1. **文件组织**
   - 每个组件一个目录
   - 包含 index.tsx 和 style.scss
   - 测试文件放在 __tests__ 目录

2. **命名规范**
   - 组件使用 PascalCase
   - 文件使用 kebab-case
   - 样式类使用 kebab-case

3. **类型定义**
   - 使用 TypeScript 接口定义 props
   - 导出类型定义供其他组件使用
   - 避免使用 any 类型

## 样式开发规范

1. **SCSS 使用**
   - 使用嵌套语法
   - 使用变量定义主题
   - 使用 mixin 复用样式

2. **响应式设计**
   - 移动优先设计

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 发布流程

1. 更新版本号
2. 更新 CHANGELOG.md
3. 创建发布分支
4. 运行测试
5. 构建生产版本
6. 创建 GitHub Release
7. 部署到生产环境 