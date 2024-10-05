// server.js

// 导入所需模块
const express = require("express");
const http = require("http");
const WebSocket = require("ws"); // 引入 ws 库
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const sqlite3 = require("sqlite3").verbose(); // 引入 sqlite3 库
const path = require("path");
const bcrypt = require("bcryptjs"); // 引入 bcrypt 库

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

// 初始化SQLite数据库
const db = new sqlite3.Database("./monitoring_system.db", (err) => {
  if (err) {
    console.error("无法连接到数据库", err);
  } else {
    console.log("成功连接到SQLite数据库");
  }
});

// 创建表
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS patients (id TEXT PRIMARY KEY, name TEXT, room TEXT, medicine TEXT)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS tasks (taskId TEXT PRIMARY KEY, patientId TEXT, taskName TEXT, taskTime TEXT, command TEXT, status TEXT)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT)"
  );
});

// db.serialize(() => {
//   db.run("DROP TABLE IF EXISTS tasks", (err) => {
//     if (err) {
//       console.error("无法删除旧的 tasks 表:", err);
//     } else {
//       console.log("成功删除旧的 tasks 表");
//     }
//   });

//   db.run(
//     "CREATE TABLE IF NOT EXISTS tasks (taskId TEXT PRIMARY KEY, patientId TEXT, taskName TEXT, taskTime TEXT, command TEXT, status TEXT)",
//     (err) => {
//       if (err) {
//         console.error("无法创建 tasks 表:", err);
//       } else {
//         console.log("成功创建 tasks 表");
//       }
//     }
//   );
// });

// REST API接口

/**
 * 用户注册
 * @param {Object} req - 请求对象，包含用户名和密码
 * @param {Object} res - 响应对象，返回注册结果
 */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const id = uuidv4();

  if (!username || !password) {
    return res.status(400).json({ message: "用户名和密码不能为空" });
  }

  try {
    // 生成密码哈希
    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (id, username, password) VALUES (?, ?, ?)",
      [id, username, hashedPassword],
      function (err) {
        if (err) {
          res.status(500).json({ message: "注册失败，用户名可能已存在" });
        } else {
          res.status(201).json({ message: "注册成功" });
        }
      }
    );
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ message: "服务器错误" });
  }
});

/**
 * 用户登录
 * @param {Object} req - 请求对象，包含用户名和密码
 * @param {Object} res - 响应对象，返回登录结果
 */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "用户名和密码不能为空" });
  }

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, row) => {
      if (err) {
        res.status(500).json({ message: "登录失败" });
      } else if (row) {
        // 比较密码
        const match = await bcrypt.compare(password, row.password);
        if (match) {
          res.status(200).json({ message: "登录成功" });
        } else {
          res.status(401).json({ message: "用户名或密码错误1" });
        }
      } else {
        res.status(401).json({ message: "用户名或密码错误2" });
      }
    }
  );
});

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

  db.run(
    "INSERT INTO patients (id, name, room, medicine) VALUES (?, ?, ?, ?)",
    [id, name, room, medicine],
    function (err) {
      if (err) {
        res.status(500).json({ message: "添加病人失败" });
      } else {
        res.status(201).json(newPatient);
      }
    }
  );
});

/**
 * 获取所有病人信息
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象，返回所有病人的数组
 */
app.get("/patients", (req, res) => {
  db.all("SELECT * FROM patients", [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: "获取病人信息失败" });
    } else {
      res.json(rows);
    }
  });
});

/**
 * 更新病人信息
 * @param {Object} req - 请求对象，包含更新后的病人信息
 * @param {Object} res - 响应对象，返回更新后的病人信息或错误信息
 */
app.put("/patients/:id", (req, res) => {
  const { id } = req.params;
  const { name, room, medicine } = req.body;

  db.run(
    "UPDATE patients SET name = ?, room = ?, medicine = ? WHERE id = ?",
    [name, room, medicine, id],
    function (err) {
      if (err) {
        res.status(500).json({ message: "更新病人信息失败" });
      } else if (this.changes === 0) {
        res.status(404).json({ message: "病人未找到" });
      } else {
        res.json({ id, name, room, medicine });
      }
    }
  );
});

/**
 * 删除病人信息
 * @param {Object} req - 请求对象，包含病人ID
 * @param {Object} res - 响应对象，返回删除成功消息或错误信息
 */
app.delete("/patients/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM patients WHERE id = ?", id, function (err) {
    if (err) {
      res.status(500).json({ message: "删除病人信息失败" });
    } else if (this.changes === 0) {
      res.status(404).json({ message: "病人未找到" });
    } else {
      res.json({ message: "病人已删除" });
    }
  });
});

/**
 * 创建新任务
 * @param {Object} req - 请求对象，包含病人ID, 任务名称和执行时间
 * @param {Object} res - 响应对象，返回创建的任务信息或错误信息
 */
app.post("/tasks", (req, res) => {
  const { patientId, taskName, taskTime } = req.body;

  if (!patientId || !taskName || !taskTime) {
    return res
      .status(400)
      .json({ message: "病人ID、任务名称和执行时间不能为空" });
  }

  const taskId = uuidv4();
  const task = {
    taskId,
    patientId,
    taskName,
    taskTime,
    command: "deliver",
    status: "pending",
  };

  db.run(
    "INSERT INTO tasks (taskId, patientId, taskName, taskTime, command, status) VALUES (?, ?, ?, ?, ?, ?)",
    [taskId, patientId, taskName, taskTime, task.command, task.status],
    function (err) {
      if (err) {
        console.error("创建任务时出错:", err);
        return res.status(500).json({ message: "创建任务失败" });
      }

      // 通过WebSocket发送任务给连接的客户端
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "new_task", task }));
        }
      });

      res.status(201).json(task);
    }
  );
});

/**
 * 获取所有任务
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象，返回所有任务信息
 */
app.get("/tasks", (req, res) => {
  db.all("SELECT * FROM tasks", [], (err, rows) => {
    if (err) {
      res.status(500).json({ message: "获取任务信息失败" });
    } else {
      res.json(rows);
    }
  });
});

/**
 * 获取任务状态
 * @param {Object} req - 请求对象，包含任务ID
 * @param {Object} res - 响应对象，返回任务的状态信息或错误信息
 */
app.get("/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  db.get("SELECT status FROM tasks WHERE taskId = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ message: "获取任务状态失败" });
    } else if (!row) {
      res.status(404).json({ message: "任务未找到" });
    } else {
      res.json({ taskId: id, status: row.status });
    }
  });
});

/**
 * 删除任务信息
 * @param {Object} req - 请求对象，包含任务ID
 * @param {Object} res - 响应对象，返回删除成功消息或错误信息
 */
app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM tasks WHERE taskId = ?", id, function (err) {
    if (err) {
      res.status(500).json({ message: "删除任务失败" });
    } else if (this.changes === 0) {
      res.status(404).json({ message: "任务未找到" });
    } else {
      res.json({ message: "任务已删除" });
    }
  });
});

// WebSocket连接事件监听
wss.on("connection", (ws) => {
  console.log("客户端WebSocket事件连接:", ws._socket.remoteAddress);

  // 监听来自机器人的任务状态更新
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "task_status") {
      const { taskId, status } = data;
      db.run(
        "UPDATE tasks SET status = ? WHERE taskId = ?",
        [status, taskId],
        function (err) {
          if (!err && this.changes > 0) {
            // 向所有连接的客户端广播状态更新
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(
                  JSON.stringify({
                    type: "update_task_status",
                    taskId,
                    status,
                  })
                );
              }
            });
          }
        }
      );
    }
  });

  ws.on("close", () => {
    console.log("客户端WebSocket事件断开连接");
  });
});

// 从'public'目录提供静态文件
app.use(express.static(path.join(__dirname, "public")));

// 启动服务器
const PORT = 3040;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`服务器运行在端口${PORT}`);
});
