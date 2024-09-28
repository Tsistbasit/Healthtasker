// server.js

// 导入所需模块
const express = require("express");
const http = require("http");
const WebSocket = require("ws"); // 引入 ws 库
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

// 初始化Express应用
const app = express();
// 使用CORS中间件以允许跨域请求
app.use(cors());
// 使用JSON解析器处理请求体
app.use(express.json());

// 创建HTTP服务器
const server = http.createServer(app);

// 初始化WebSocket服务器
const wss = new WebSocket.Server({ server });
// 定义中间件
app.use((req, res, next) => {
  console.log(`请求方法: ${req.method}, 请求路径: ${req.url}`);
  next(); // 将控制权传递给下一个中间件
});
// 内存数据库存储病人信息和任务
let patients = [];
let tasks = {};

// REST API接口

/**
 * 添加新病人
 * @param {Object} req - 请求对象，包含病人信息
 * @param {Object} res - 响应对象，返回新增的病人信息
 */
app.post("/patients", (req, res) => {
  const { name, room, medicine } = req.body;
  const id = uuidv4();
  const newPatient = { id, name, room, medicine };
  patients.push(newPatient);
  res.status(201).json(newPatient);
});

/**
 * 获取所有病人信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象，返回所有病人的数组
 */
app.get("/patients", (req, res) => {
  res.json(patients);
});

/**
 * 更新病人信息
 * @param {Object} req - 请求对象，包含更新后的病人信息
 * @param {Object} res - 响应对象，返回更新后的病人信息或错误信息
 */
app.put("/patients/:id", (req, res) => {
  const { id } = req.params;
  const { name, room, medicine } = req.body;
  const patient = patients.find((p) => p.id === id);
  if (patient) {
    patient.name = name;
    patient.room = room;
    patient.medicine = medicine;
    res.json(patient);
  } else {
    res.status(404).json({ message: "病人未找到" });
  }
});

/**
 * 删除病人信息
 * @param {Object} req - 请求对象，包含病人ID
 * @param {Object} res - 响应对象，返回删除成功消息或错误信息
 */
app.delete("/patients/:id", (req, res) => {
  const { id } = req.params;
  const index = patients.findIndex((p) => p.id === id);
  if (index !== -1) {
    patients.splice(index, 1);
    res.json({ message: "病人已删除" });
  } else {
    res.status(404).json({ message: "病人未找到" });
  }
});

/**
 * 创建新任务
 * @param {Object} req - 请求对象，包含病人ID
 * @param {Object} res - 响应对象，返回创建的任务信息或错误信息
 */
app.post("/tasks", (req, res) => {
  const { patientId } = req.body;
  const patient = patients.find((p) => p.id === patientId);
  if (!patient) {
    return res.status(404).json({ message: "病人未找到" });
  }
  const taskId = uuidv4();
  const task = {
    taskId,
    patientId,
    command: "deliver",
    status: "pending",
  };
  tasks[taskId] = task;

  // 通过WebSocket发送任务给连接的客户端
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "new_task", task }));
    }
  });

  res.status(201).json(task);
});

/**
 * 获取任务状态
 * @param {Object} req - 请求对象，包含任务ID
 * @param {Object} res - 响应对象，返回任务的状态信息或错误信息
 */
app.get("/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  const task = tasks[id];
  if (task) {
    res.json({ taskId: id, status: task.status });
  } else {
    res.status(404).json({ message: "任务未找到" });
  }
});

/**
 * 获取所有任务
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象，返回所有任务信息
 */
app.get("/tasks", (req, res) => {
  res.json(Object.values(tasks)); // 返回所有任务
});

/**
 * 删除任务信息
 * @param {Object} req - 请求对象，包含任务ID
 * @param {Object} res - 响应对象，返回删除成功消息或错误信息
 */
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  // 检查任务是否存在于 tasks 对象中
  if (tasks[id]) {
    delete tasks[id]; // 使用 delete 操作符删除对象中的任务
    res.json({ message: "任务已删除" });
  } else {
    res.status(404).json({ message: "任务未找到" });
  }
});

// WebSocket连接事件监听
wss.on("connection", (ws) => {
  console.log("客户端WebSocket事件连接:", ws._socket.remoteAddress);

  // 监听来自机器人的任务状态更新
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "task_status") {
      const { taskId, status } = data;
      if (tasks[taskId]) {
        tasks[taskId].status = status;
        // 向所有连接的客户端广播状态更新
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({ type: "update_task_status", taskId, status })
            );
          }
        });
      }
    }
  });

  ws.on("close", () => {
    console.log("客户端WebSocket事件断开连接");
  });
});

// 从'public'目录提供静态文件
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

// 启动服务器
const PORT = 3040;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`服务器运行在端口${PORT}`);
});
