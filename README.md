# Fuel

> 另一个更好的油耗统计

一个用于管理车辆能源消耗（加油和充电）的移动端应用。

## 功能特性

- 🚗 支持多车辆管理
- ⛽ 记录加油数据
- 🔋 记录充电数据
- 📊 数据统计和可视化
- 📱 移动端友好的界面
- 🌙 支持深色模式
- 🔄 数据同步到 Gist
- 📡 支持离线使用(PWA)

## 应用截图

<div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center; align-items: center;">
  <img src="./docs/assets/home.png" alt="首页" width="200" />
  <img src="./docs/assets/chart.png" alt="图表" width="200" />
  <img src="./docs/assets/settings.png" alt="设置" width="200" />
</div>

## 快速开始

### 在线体验

[在线演示地址](https://life1st.github.io/fuel/)

### 本地安装

```bash
# 克隆项目
git clone [项目地址]

# 进入项目目录
cd fuel

# 安装依赖
pnpm i

# 启动开发服务器
pnpm dev
```

## 使用指南

### 基础功能

1. **车辆管理**
   - 添加新车辆
   - 切换当前车辆
   - 编辑车辆信息

2. **能源记录**
   - 记录加油数据
   - 记录充电数据
   - 查看历史记录

3. **数据统计**
   - 查看能源消耗趋势
   - 分析成本变化
   - 导出统计数据

### 高级功能

1. **数据同步**
   - 配置 Gist 同步
   - 自动备份数据
   - 多设备同步

2. **个性化设置**
   - 深色模式自动切换

## Gist 同步配置

### 配置步骤

1. **创建个人访问令牌（Personal Access Token）**
   - 访问 [GitHub pat 设置页面](https://github.com/settings/personal-access-tokens)
   - 点击 "Generate new token"
   - 选择权限范围：Permissions - `Gists`
   - 生成并保存令牌（注意：令牌只显示一次）

2. **创建 Gist**
   - 访问 [Gist 创建页面](https://gist.github.com)
   - 内容可以为空
   - 直接点击 "Create secret gist"
   - 保存并复制 Gist ID（URL 中的最后一段）

3. **在应用中配置**
   - 打开应用设置页面
   - 点击 "Gist同步" 选项
   - 输入 GitHub 个人访问令牌
   - 输入 Gist ID
   - 点击 "保存配置"

## 开发文档

详细的开发文档请查看 [开发文档](./docs/development.md)

## 许可证

[MIT License](LICENSE)
