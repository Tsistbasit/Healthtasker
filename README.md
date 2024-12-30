工具与环境准备

1. 操作系统：Windows 11
2. 开发工具：Visual Studio Code (已安装)
3. Node.js：用于搭建后端服务器
4. Git（可选）：用于版本控制
5. 浏览器：现代浏览器（如 Chrome、Edge）

步骤概述

1. 安装必要的软件
2. 创建后端服务器
3. 创建前端网页
4. 实现小车控制通讯模块
（多端协同、低成本、蓝牙定位：适于医疗送货）
---

1.0 安装必要的软件

安装 Node.js

后端服务器将使用 Node.js 搭建，因此需要先安装 Node.js。

1. 访问 [Node.js 官方网站](https://nodejs.org/)。
2. 下载最新的 LTS 版本（推荐）。
3. 运行安装程序并按照提示完成安装。
4. 安装完成后，打开命令提示符（CMD）或 PowerShell，输入以下命令验证安装：

   ```bash
   node -v
   npm -v
   ```

   这将显示 Node.js 和 npm 的版本号，表示安装成功。

安装 Git
Git 用于版本控制和代码管理。

1. 访问 [Git 官方网站](https://git-scm.com/)。
2. 下载适用于 Windows 的安装程序。
3. 运行安装程序并按照提示完成安装。

---

2.0 创建后端服务器

后端服务器将负责处理病人信息管理、任务分配以及与小车的通讯。我们将使用 Node.js 和 Express 框架搭建服务器，并使用 Socket.io 实现 WebSocket 通讯。

2.1 创建项目目录

1. 打开 VS Code。
2. 选择一个合适的位置（如 `C:\projects\medical_system`）。
3. 打开终端（在 VS Code 中，按 `Ctrl + \``）。

   ```bash
   mkdir medical_system
   cd medical_system
   ```

2.2 初始化 Node.js 项目

在终端中运行以下命令初始化一个新的 Node.js 项目：

```bash
npm init -y
```

这将在 `medical_system` 目录下创建一个 `package.json` 文件。

2.3 安装依赖

安装 Express 和 Socket.io：

```bash
npm install express socket.io
```

为了方便处理跨域请求（CORS），还需要安装 `cors`：

```bash
npm install cors
```

2.4 创建服务器文件

在 medical_system 目录下创建一个 server.js 文件，并添加代码。

2.5 安装额外的依赖

上面的代码使用了 `uuid` 来生成唯一的 ID，需要安装该包：

```bash
npm install uuid
```

2.6 启动后端服务器

在终端中运行以下命令启动服务器：

```bash
node server.js
```

您应该会看到如下输出：

```
Server is running on port 3000
```

服务器现在已启动并监听端口 `3000`。

---

3.0 创建前端网页

前端网页将用于病人信息管理和任务下发。我们将使用 HTML、CSS 和 JavaScript 构建前端，并通过 AJAX（使用 Fetch API）与后端服务器通信，同时使用 Socket.io 客户端监听任务状态的实时更新。

3.1 创建前端目录

在 `medical_system` 目录下，创建一个名为 `public` 的文件夹，用于存放前端文件。

```bash
mkdir public
cd public
```

3.2 安装 Socket.io 客户端

为了在前端使用 Socket.io 客户端，我们需要安装 `socket.io-client`。在项目根目录下运行：

```bash
npm install socket.io-client
```

3.3 创建前端文件

在 `public` 文件夹内，创建以下文件并添加代码：

1. `index.html`
2. `styles.css`
3. `app.js`

   3.4 启用前端服务

重新启动服务器：

1. 在终端中按 `Ctrl + C` 停止当前服务器。
2. 重新运行：

   ```bash
   node server.js
   ```

   3.5 访问前端网页

打开浏览器，访问 [http://localhost:3000](http://localhost:3000)。将在本地看到病人信息管理系统的网页。

4.0 测试通讯

1. 确保后端服务器正在运行。
2. 上传并运行 ESP32 代码。
3. 打开后端服务器的终端，看到 ESP32 连接的信息。
4. 在前端网页中添加一个病人信息并发送任务，查看 ESP32 是否接收到任务指令，并在服务器端看到任务状态更新。

---

项目完成
以下是项目的简要总结：

- 前端网页：使用 HTML、CSS 和 JavaScript 构建，提供病人信息管理和任务下发功能。
- 后端服务器：使用 Node.js 和 Express 搭建，提供 REST API 和 WebSocket 通讯，管理病人信息和任务。
- 小车控制模块：使用 ESP32 通过 WebSocket 与后端服务器通讯，接收任务指令并反馈任务状态。
