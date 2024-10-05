// app.js

// 初始化WebSocket连接
const socket = new WebSocket("ws://piyz97947344.vicp.fun:80"); // 使用标准 WebSocket 连接到服务器

// 获取DOM元素
const patientForm = document.getElementById("patient-form"); // 病人信息表单
const nameInput = document.getElementById("name"); // 病人姓名输入框
const roomInput = document.getElementById("room"); // 病人房号输入框
const medicineInput = document.getElementById("medicine"); // 病人药物输入框
const patientIdInput = document.getElementById("patient-id"); // 病人ID隐藏输入框
const patientsTableBody1 = document.querySelector("#patients-table1 tbody"); // 病人列表表格体
const patientsTableBody2 = document.querySelector("#patients-table2 tbody"); // 病人列表表格体
const sendTaskButton = document.getElementById("send-task-button"); // 发送任务按钮
const tasksTableBody = document.querySelector("#tasks-table tbody"); // 任务列表表格体
const loginForm = document.getElementById("login-form"); // 登录表单
const registerForm = document.getElementById("register-form"); // 注册表单
const scheduleTaskForm = document.getElementById("schedule-task-form"); // 定时任务表单
const scheduledTasksTableBody = document.querySelector(
  "#scheduled-tasks-table tbody"
); // 定时任务表格体

// 动态构建API地址
const baseURL = `http://piyz97947344.vicp.fun`;

let isLoggedIn = false; // 是否已登录的标志

// 页面加载时加载病人信息
if (isLoggedIn) {
  document.addEventListener("DOMContentLoaded", () => {
    fetchPatients(); // 如果已登录，加载病人信息
    loadTasks(); // 如果已登录，加载任务信息
    initializeCountdowns(); // 初始化倒计时
  });
}

// 登录处理
loginForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 阻止默认表单提交行为
  const username = document.getElementById("login-username").value.trim(); // 获取用户名输入值
  const password = document.getElementById("login-password").value.trim(); // 获取密码输入值

  if (username && password) {
    // 调用服务器的登录 API
    fetch(`${baseURL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.message === "登录成功") {
          isLoggedIn = true;
          alert("登录成功");
          document
            .querySelectorAll(".sidebar a")
            .forEach((link) => link.classList.remove("disabled")); // 解除导航栏链接的禁用状态
          showPatientManagement(); // 显示病人信息管理部分
          fetchPatients(); // 加载病人信息
          loadTasks(); // 加载任务信息
          initializeCountdowns(); // 初始化倒计时
        } else {
          alert(data.message);
        }
      })
      .catch((error) => console.error("登录过程中出现错误:", error));
  } else {
    alert("请输入用户名和密码");
  }
});

// 注册处理
registerForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 阻止默认表单提交行为
  const username = document.getElementById("register-username").value.trim(); // 获取用户名输入值
  const password = document.getElementById("register-password").value.trim(); // 获取密码输入值

  if (username && password) {
    // 调用服务器的注册 API
    fetch(`${baseURL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(data.message);
        if (data.message === "注册成功") {
          showLogin(); // 注册成功后显示登录界面
        }
      })
      .catch((error) => console.error("注册过程中出现错误:", error));
  } else {
    alert("请输入用户名和密码");
  }
});

// 获取所有病人信息并更新到表格中
function fetchPatients() {
  fetch(`${baseURL}/patients`)
    .then((response) => response.json())
    .then((data) => {
      // 清空现有的病人表格
      [patientsTableBody1, patientsTableBody2].forEach((tableBody) => {
        tableBody.innerHTML = ""; // 清空表格体
        data.forEach((patient) => {
          const row = document.createElement("tr"); // 创建表格行

          if (tableBody === patientsTableBody2) {
            const checkboxCell = document.createElement("td");
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox"; // 复选框用于选择病人
            checkbox.value = patient.id;
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);
          }

          // 添加病人姓名、房号和药物信息到表格行中
          const nameCell = document.createElement("td");
          nameCell.textContent = patient.name;
          row.appendChild(nameCell);

          const roomCell = document.createElement("td");
          roomCell.textContent = patient.room;
          row.appendChild(roomCell);

          const medicineCell = document.createElement("td");
          medicineCell.textContent = patient.medicine;
          row.appendChild(medicineCell);

          if (tableBody === patientsTableBody1) {
            // 操作单元格，包含编辑和删除按钮
            const actionCell = document.createElement("td");
            const editButton = document.createElement("button");
            editButton.textContent = "编辑";
            editButton.onclick = () => editPatient(patient); // 点击编辑按钮，加载病人信息到表单中进行编辑
            actionCell.appendChild(editButton);

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "删除";
            deleteButton.onclick = () => deletePatient(patient.id); // 点击删除按钮，删除病人信息
            actionCell.appendChild(deleteButton);

            row.appendChild(actionCell);
          }
          tableBody.appendChild(row); // 将行添加到表格体中
        });
      });
    })
    .catch((error) => console.error("获取病人信息时出错:", error));
}

// 提交或更新病人信息
patientForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = patientIdInput.value;
  const name = nameInput.value;
  const room = roomInput.value;
  const medicine = medicineInput.value;

  const patientData = { name, room, medicine };

  if (id) {
    // 更新现有病人信息
    fetch(`${baseURL}/patients/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    })
      .then((response) => response.json())
      .then(() => {
        fetchPatients();
        patientForm.reset();
        patientIdInput.value = "";
      })
      .catch((error) => console.error("Error updating patient:", error));
  } else {
    // 添加新病人信息
    fetch(`${baseURL}/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(patientData),
    })
      .then((response) => response.json())
      .then(() => {
        fetchPatients();
        patientForm.reset();
      })
      .catch((error) => console.error("Error adding patient:", error));
  }
});

// 编辑病人信息
function editPatient(patient) {
  // 将病人信息加载到表单中，便于编辑
  patientIdInput.value = patient.id;
  nameInput.value = patient.name;
  roomInput.value = patient.room;
  medicineInput.value = patient.medicine;
}

// 删除病人信息
function deletePatient(id) {
  if (confirm("确定要删除这个病人吗？")) {
    // 确认删除病人信息
    fetch(`${baseURL}/patients/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then(() => fetchPatients()) // 更新病人列表
      .catch((error) => console.error("删除病人信息时出错:", error));
  }
}

// 发送任务按钮的事件监听器
sendTaskButton.addEventListener("click", () => {
  // 获取选中的病人ID
  const selectedPatients = Array.from(
    patientsTableBody2.querySelectorAll("input[type='checkbox']:checked")
  ).map((checkbox) => checkbox.value);

  if (selectedPatients.length > 0) {
    // 使用 Promise.all 来确保所有任务都发送完成后再刷新任务列表
    const taskPromises = selectedPatients.map((patientId) => {
      return fetch(`${baseURL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: patientId,
          taskName: "加急任务", // 修改为实际任务名称
          taskTime: new Date().toISOString(), // 根据需要设置任务时间
        }), // 将任务数据转换为JSON字符串
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`网络响应不是OK: ${response.statusText}`);
          }
          return response.json();
        })
        .catch((error) => {
          console.error(`发送任务给病人ID ${patientId} 时出错:`, error);
          throw error; // 继续抛出错误以便 Promise.all 处理
        });
    });

    // 等待所有任务发送完成
    Promise.all(taskPromises)
      .then(() => {
        // 所有任务发送成功后，刷新任务列表
        loadTasks();
      })
      .catch((error) => {
        alert("有些任务发送失败，请检查控制台了解详细信息。");
      });
  } else {
    alert("请选择至少一个病人来发送任务。");
  }
});

// 删除任务的函数
function deleteTasks(taskId) {
  if (confirm("确定要删除这个任务吗？")) {
    fetch(`${baseURL}/tasks/${taskId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`删除任务失败: ${response.statusText}`);
        }
        // 删除成功后，刷新任务列表
        loadTasks();
      })
      .catch((error) => console.error("删除任务时出错:", error));
  }
}

// 加载并渲染所有任务的函数
function loadTasks() {
  loadTasks2();

  // 首先获取所有任务
  fetch(`${baseURL}/tasks`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`获取任务失败: ${response.statusText}`);
      }
      return response.json();
    })
    .then((tasks) => {
      // 然后获取所有病人信息
      return fetch(`${baseURL}/patients`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`获取病人信息失败: ${response.statusText}`);
          }
          return response.json();
        })
        .then((patients) => {
          // 创建一个病人ID到病人姓名的映射
          const patientMap = {};
          patients.forEach((patient) => {
            patientMap[patient.id] = patient.name;
          });

          // 清空现有的任务表格
          tasksTableBody.innerHTML = "";

          // 遍历所有任务并添加到表格中
          tasks.forEach((task) => {
            const row = document.createElement("tr");
            row.id = `task-${task.taskId}`;

            // 任务ID单元格
            const taskIdCell = document.createElement("td");
            taskIdCell.textContent = task.taskId;
            row.appendChild(taskIdCell);

            // 病人姓名单元格
            const patientNameCell = document.createElement("td");
            patientNameCell.textContent = patientMap[task.patientId] || "未知";
            row.appendChild(patientNameCell);

            // 任务状态单元格
            const statusCell = document.createElement("td");
            statusCell.textContent = task.status;
            statusCell.id = `status-${task.taskId}`;
            row.appendChild(statusCell);

            // 删除按钮单元格
            const deleteCell = document.createElement("td");
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "删除";
            deleteButton.onclick = () => deleteTasks(task.taskId); // 绑定删除任务的事件
            deleteCell.appendChild(deleteButton);
            row.appendChild(deleteCell);

            // 将行添加到任务表格体中
            tasksTableBody.appendChild(row);
          });
        });
    })
    .catch((error) => console.error("加载任务时出错:", error));
}

// 定义刷新任务表格的函数
function loadTasks2() {
  // 清空当前任务表格中的内容
  scheduledTasksTableBody.innerHTML = "";

  const patientMap = {};
  fetch(`${baseURL}/patients`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("无法获取病人信息");
      }
      return response.json();
    })
    .then((patients) => {
      // 创建一个病人ID到药品名称的映射
      patients.forEach((patient) => {
        patientMap[patient.id] = patient.medicine;
      });

      // 从服务器获取所有任务
      fetch(`${baseURL}/tasks`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("无法获取任务列表");
          }
          return response.json();
        })
        .then((tasks) => {
          // 遍历每个任务并将其添加到表格中
          tasks.forEach((task) => {
            addTaskToTable(
              task.patientId,
              task.taskId,
              patientMap[task.patientId] || "未知",
              task.taskTime,
              task.taskName,
              task.status
            );
          });
        })
        .catch((error) => {
          console.error("加载任务失败:", error);
          alert("加载任务失败，请稍后重试或联系管理员");
        });
    })
    .catch((error) => {
      console.error("获取病人信息失败:", error);
      alert("获取病人信息失败，请稍后重试或联系管理员");
    });
}

// 处理定时任务表单提交事件
scheduleTaskForm.addEventListener("submit", (event) => {
  event.preventDefault(); // 阻止表单默认提交行为

  // 获取任务备注和执行时间的值
  const taskName = document.getElementById("task-name").value;
  const taskTime = document.getElementById("task-time").value;

  // 验证输入是否为空
  if (!taskName || !taskTime) {
    alert("请填写所有必填项");
    return;
  }

  // 获取选中的病人ID
  const selectedPatients = Array.from(
    patientsTableBody2.querySelectorAll("input[type='checkbox']:checked")
  ).map((checkbox) => checkbox.value);

  if (selectedPatients.length > 0) {
    // 使用 Promise.all 来确保所有任务都发送完成后再刷新任务列表
    const taskPromises = selectedPatients.map((patientId) => {
      return fetch(`${baseURL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: patientId,
          taskName: taskName,
          taskTime: taskTime,
          status: "待执行",
        }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("无法添加定时任务");
          }
          return response.json();
        })
        .then((data) => {
          const taskId = data.taskId;
          // 更新页面上的任务表格
          addTaskToTable(
            patientId,
            taskId,
            medicine,
            taskTime,
            taskName,
            "待执行"
          );
        })
        .catch((error) => {
          console.error("添加定时任务失败:", error);
          alert("添加定时任务失败，请稍后重试或联系管理员");
        });
    });

    // 等待所有任务发送完成
    Promise.all(taskPromises)
      .then(() => {
        // 所有任务发送成功后，刷新任务列表
        loadTasks();
      })
      .catch((error) => {
        alert("有些任务发送失败，请检查控制台了解详细信息。");
      });
  } else {
    alert("请选择至少一个病人来发送任务。");
  }
});

// 将新任务添加到任务表格中
function addTaskToTable(
  patientId,
  taskId,
  medicine,
  taskTime,
  taskName,
  status
) {
  const newRow = document.createElement("tr");

  // 创建执行时间单元格
  const execTimeCell = document.createElement("td");
  execTimeCell.classList.add("execution-time");
  execTimeCell.setAttribute("data-time", taskTime);
  execTimeCell.textContent = taskTime; // 初始显示

  // 创建任务名单元格
  const nameCell = document.createElement("td");
  nameCell.textContent = taskName;

  // 创建药物单元格
  const medicineCell = document.createElement("td");
  medicineCell.textContent = medicine; // 根据需要修改

  // 创建状态单元格
  const statusCell = document.createElement("td");
  statusCell.id = `status-${taskId}`;
  statusCell.textContent = status;

  // 创建操作单元格
  const actionCell = document.createElement("td");
  const deleteButton = document.createElement("button");
  deleteButton.textContent = "删除";
  deleteButton.onclick = () => removeTask(taskId);
  actionCell.appendChild(deleteButton);

  // 将所有单元格添加到行中
  newRow.appendChild(execTimeCell);
  newRow.appendChild(nameCell);
  newRow.appendChild(medicineCell);
  newRow.appendChild(statusCell);
  newRow.appendChild(actionCell);

  // 将行添加到表格体中
  scheduledTasksTableBody.appendChild(newRow);
}

// 删除任务
function removeTask(taskId) {
  // 从数据库中删除任务
  fetch(`${baseURL}/tasks/${taskId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("无法删除定时任务");
      }
      loadTasks(); // 刷新任务列表
    })
    .catch((error) => {
      console.error("删除定时任务失败:", error);
    });
}

// 监听实时任务状态更新
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data); // 解析接收到的任务状态更新数据
  const { taskId, status } = data;
  const statusCell = document.getElementById(`status-${taskId}`);
  if (statusCell) {
    statusCell.textContent = status; // 更新任务状态
    loadTasks(); // 加载任务信息
  }
});

// 计算时间差并格式化为天、小时、分钟、秒
function getTimeDifference(executionTime) {
  const now = new Date();
  const execTime = new Date(executionTime);
  const diff = execTime - now;

  if (diff <= 0) {
    return "已执行"; // 或者其他你想显示的文本
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return `${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒`;
}

// 更新所有执行时间单元格的倒计时
function updateCountdowns() {
  const executionTimeCells = document.querySelectorAll(
    "#scheduled-tasks-table tbody .execution-time"
  );

  executionTimeCells.forEach((cell) => {
    const executionTime = cell.getAttribute("data-time");
    const countdown = getTimeDifference(executionTime);
    cell.textContent = countdown;
  });
}

// 初始化倒计时更新
function initializeCountdowns() {
  updateCountdowns(); // 初始调用
  setInterval(updateCountdowns, 1000); // 每秒更新一次
}

// 当 DOM 完全加载后初始化倒计时
document.addEventListener("DOMContentLoaded", initializeCountdowns);
