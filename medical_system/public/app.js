// app.js

// 初始化WebSocket连接
const socket = new WebSocket("ws://piyz97947344.vicp.fun:80"); // 使用标准 WebSocket

// 获取DOM元素
const patientForm = document.getElementById("patient-form");
const nameInput = document.getElementById("name");
const roomInput = document.getElementById("room");
const medicineInput = document.getElementById("medicine");
const patientIdInput = document.getElementById("patient-id");
const patientsTableBody = document.querySelector("#patients-table tbody");
const sendTaskButton = document.getElementById("send-task-button");
const tasksTableBody = document.querySelector("#tasks-table tbody");

// 动态构建API地址
const baseURL = `http://piyz97947344.vicp.fun`;

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
        const checkboxCell = document.createElement("td");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = patient.id;
        checkboxCell.appendChild(checkbox);
        row.appendChild(checkboxCell);

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
        addTaskToTable(task);
      });
    })
    .catch((error) => console.error("Error fetching tasks:", error));
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
  patientIdInput.value = patient.id;
  nameInput.value = patient.name;
  roomInput.value = patient.room;
  medicineInput.value = patient.medicine;
}

// 删除病人信息
function deletePatient(id) {
  if (confirm("确定要删除这个病人吗？")) {
    fetch(`${baseURL}/patients/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then(() => fetchPatients())
      .catch((error) => console.error("Error deleting patient:", error));
  }
}

// 发送任务
sendTaskButton.addEventListener("click", () => {
  const selectedPatients = Array.from(
    patientsTableBody.querySelectorAll("input[type='checkbox']:checked")
  ).map((checkbox) => checkbox.value);

  if (selectedPatients.length > 0) {
    selectedPatients.forEach((patientId) => {
      fetch(`${baseURL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ patientId: patientId }),
      })
        .then((response) => response.json())
        .then((task) => {
          addTaskToTable(task);
        })
        .catch((error) => console.error("Error sending task:", error));
    });
  } else {
    alert("请选择至少一个病人来发送任务。");
  }
});

// 将任务添加到任务表格中
function addTaskToTable(task) {
  const row = document.createElement("tr");
  row.id = `task-${task.taskId}`;
  const { taskId } = task;

  const taskIdCell = document.createElement("td");
  taskIdCell.textContent = task.taskId;
  row.appendChild(taskIdCell);

  fetch(`${baseURL}/patients`)
    .then((response) => response.json())
    .then((data) => {
      const patient = data.find((p) => p.id === task.patientId);
      const patientNameCell = document.createElement("td");
      patientNameCell.textContent = patient ? patient.name : "未知";
      row.appendChild(patientNameCell);

      const statusCell = document.createElement("td");
      statusCell.textContent = task.status;
      statusCell.id = `status-${task.taskId}`;
      row.appendChild(statusCell);

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "删除";
      deleteButton.onclick = () => deleteTasks(taskId);
      row.appendChild(deleteButton);

      tasksTableBody.appendChild(row);
    })
    .catch((error) => console.error("Error fetching patients:", error));
}

// 删除任务信息
function deleteTasks(id) {
  if (confirm("确定要删除这个任务吗？")) {
    fetch(`${baseURL}/tasks/${id}`, {
      method: "DELETE",
    })
      .then((response) => response.json())
      .then(() => fetchPatients())
      .catch((error) => console.error("Error deleting task:", error));
  }
}

// 监听实时任务状态更新
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  const { taskId, status } = data;
  const statusCell = document.getElementById(`status-${taskId}`);
  if (statusCell) {
    statusCell.textContent = status;
  }
});
