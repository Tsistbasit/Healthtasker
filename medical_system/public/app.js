// app.js

// 初始化socket.io连接
const socket = io();

// 获取DOM元素
const patientForm = document.getElementById("patient-form"); // 病人表单
const nameInput = document.getElementById("name"); // 病人姓名输入框
const roomInput = document.getElementById("room"); // 病人房间输入框
const medicineInput = document.getElementById("medicine"); // 病人药物输入框
const patientIdInput = document.getElementById("patient-id"); // 病人ID输入框
const patientsTableBody = document.querySelector("#patients-table tbody"); // 病人信息表格主体
const sendTaskButton = document.getElementById("send-task-button"); // 发送任务按钮
const tasksTableBody = document.querySelector("#tasks-table tbody"); // 任务表格主体

// 获取主机地址
const host = window.location.hostname; // 自动获取当前主机名
const port = 3040; // 设置服务器的端口号

// 动态构建API地址
const baseURL = `http://${host}:${port}`;

// 页面加载时加载病人信息
document.addEventListener("DOMContentLoaded", () => {
  fetchPatients(); // 获取病人信息
});

/**
 * 获取所有病人的信息并更新到表格中
 */
function fetchPatients() {
  fetch(`${baseURL}/patients`)
    .then((response) => response.json())
    .then((data) => {
      patientsTableBody.innerHTML = "";
      data.forEach((patient) => {
        const row = document.createElement("tr");

        const checkboxCell = document.createElement("td"); // 创建复选框单元格
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = patient.id; // 将病人ID作为复选框的值
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell); // 将复选框单元格添加到行

        const nameCell = document.createElement("td");
        nameCell.textContent = patient.name;
        row.appendChild(nameCell);

        const roomCell = document.createElement("td");
        roomCell.textContent = patient.room;
        row.appendChild(roomCell);

        const medicineCell = document.createElement("td");
        medicineCell.textContent = patient.medicine;
        row.appendChild(medicineCell);

        const actionCell = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.textContent = "编辑";
        editButton.onclick = () => editPatient(patient);
        actionCell.appendChild(editButton);

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "删除";
        deleteButton.onclick = () => deletePatient(patient.id);
        actionCell.appendChild(deleteButton);

        row.appendChild(actionCell);
        patientsTableBody.appendChild(row);
      });
    })
    .catch((error) => console.error("Error fetching patients:", error));

  fetch(`${baseURL}/tasks`)
    .then((response) => response.json())
    .then((data) => {
      tasksTableBody.innerHTML = "";
      data.forEach((task) => {
        addTaskToTable(task); // 将任务添加到任务表格
      });
    })
    .catch((error) => console.error("Error sending task:", error));
}

// 提交或更新病人信息
patientForm.addEventListener("submit", (e) => {
  e.preventDefault(); // 阻止表单默认提交行为
  const id = patientIdInput.value; // 获取病人ID
  const name = nameInput.value; // 获取病人姓名
  const room = roomInput.value; // 获取病人房间
  const medicine = medicineInput.value; // 获取病人药物

  const patientData = { name, room, medicine }; // 创建病人数据对象

  if (id) {
    // 更新现有病人信息
    fetch(`${baseURL}/patients/${id}`, {
      method: "PUT", // 设置请求方法为PUT
      headers: {
        "Content-Type": "application/json", // 设置请求头为JSON格式
      },
      body: JSON.stringify(patientData), // 将病人数据转为JSON字符串
    })
      .then((response) => response.json()) // 解析响应为JSON格式
      .then(() => {
        fetchPatients(); // 重新获取病人信息
        patientForm.reset(); // 重置表单
        patientIdInput.value = ""; // 清空病人ID输入框
      })
      .catch((error) => console.error("Error updating patient:", error)); // 捕获并打印错误
  } else {
    // 添加新病人信息
    fetch(`${baseURL}/patients`, {
      method: "POST", // 设置请求方法为POST
      headers: {
        "Content-Type": "application/json", // 设置请求头为JSON格式
      },
      body: JSON.stringify(patientData), // 将病人数据转为JSON字符串
    })
      .then((response) => response.json()) // 解析响应为JSON格式
      .then(() => {
        fetchPatients(); // 重新获取病人信息
        patientForm.reset(); // 重置表单
      })
      .catch((error) => console.error("Error adding patient:", error)); // 捕获并打印错误
  }
});

// 编辑病人信息
function editPatient(patient) {
  patientIdInput.value = patient.id; // 设置病人ID输入框的值
  nameInput.value = patient.name; // 设置姓名输入框的值
  roomInput.value = patient.room; // 设置房间输入框的值
  medicineInput.value = patient.medicine; // 设置药物输入框的值
}

// 删除病人信息
function deletePatient(id) {
  if (confirm("确定要删除这个病人吗？")) {
    // 确认删除操作
    fetch(`${baseURL}/patients/${id}`, {
      method: "DELETE", // 设置请求方法为DELETE
    })
      .then((response) => response.json()) // 解析响应为JSON格式
      .then(() => fetchPatients()) // 重新获取病人信息
      .catch((error) => console.error("Error deleting patient:", error)); // 捕获并打印错误
  }
}

// 发送任务
sendTaskButton.addEventListener("click", () => {
  const selectedPatients = Array.from(
    patientsTableBody.querySelectorAll("input[type='checkbox']:checked")
  ).map((checkbox) => checkbox.value); // 获取选中的病人ID

  if (selectedPatients.length > 0) {
    selectedPatients.forEach((patientId) => {
      fetch(`${baseURL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId: patientId }),
      })
        .then((response) => {
          return response.json();
        })
        .then((task) => {
          addTaskToTable(task); // 将任务添加到任务表格
        })
        .catch((error) => console.error("Error sending task:", error));
    });
  } else {
    alert("请选择至少一个病人来发送任务。");
  }
});

// 将任务添加到任务表格中
function addTaskToTable(task) {
  const row = document.createElement("tr"); // 创建表格行
  row.id = `task-${task.taskId}`; // 设置行ID
  const { taskId } = task; // 解构任务ID和状态

  const taskIdCell = document.createElement("td"); // 创建任务ID单元格
  taskIdCell.textContent = task.taskId; // 设置任务ID内容
  row.appendChild(taskIdCell); // 将任务ID单元格添加到行

  fetch(`${baseURL}/patients`)
    .then((response) => response.json())
    .then((data) => {
      const patient = data.find((p) => p.id === task.patientId); // 查找对应病人
      const patientNameCell = document.createElement("td"); // 创建病人姓名单元格
      patientNameCell.textContent = patient ? patient.name : "未知"; // 设置病人姓名内容
      row.appendChild(patientNameCell); // 将病人姓名单元格添加到行

      const statusCell = document.createElement("td"); // 创建状态单元格
      statusCell.textContent = task.status; // 设置任务状态内容
      statusCell.id = `status-${task.taskId}`; // 设置状态单元格ID
      row.appendChild(statusCell); // 将状态单元格添加到行

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "删除";
      deleteButton.onclick = () => deleteTasks(taskId);
      row.appendChild(deleteButton); // 将状态单元格添加到行

      tasksTableBody.appendChild(row); // 将行添加到任务表格主体
    })
    .catch((error) => console.error("Error fetching patients:", error));
}

// 删除任务信息
function deleteTasks(id) {
  if (confirm("确定要删除这个任务吗？")) {
    // 确认删除操作
    fetch(`${baseURL}/tasks/${id}`, {
      method: "DELETE", // 设置请求方法为DELETE
    })
      .then((response) => response.json()) // 解析响应为JSON格式
      .then(() => fetchPatients()) // 重新获取任务信息
      .catch((error) => console.error("Error deleting patient:", error)); // 捕获并打印错误
  }
}

// 监听实时任务状态更新
socket.on("update_task_status", (data) => {
  const { taskId, status } = data; // 解构任务ID和状态
  const statusCell = document.getElementById(`status-${taskId}`); // 获取状态单元格
  if (statusCell) {
    statusCell.textContent = status; // 更新状态单元格内容
  }
});

// 加载现有任务（可选，因为我们使用内存存储）
