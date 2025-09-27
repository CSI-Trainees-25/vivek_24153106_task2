let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let dragTaskId = null;
let timers = {};

function saveTasks() { localStorage.setItem("tasks", JSON.stringify(tasks)); }

function renderTasks() {
  const taskList = document.getElementById("taskList");
  const doNow = document.getElementById("doNow");
  taskList.innerHTML = ""; doNow.innerHTML = "";

  tasks.forEach(task => {
    const card = document.createElement("div");
    card.className = "task-card";
    card.setAttribute("draggable", "true");
    card.setAttribute("ondragstart", `onDragStart(event, ${task.id})`);
    card.setAttribute("ondragend", "onDragEnd(event)");

    card.innerHTML = `
      <div class="task-title">${task.name}</div>
      <div class="task-info">Due: ${task.due || "No date"}</div>
      <label>Priority:
        <select onchange="updatePriority(${task.id}, this.value)">
          <option value="high" ${task.priority==="high"?"selected":""}>High</option>
          <option value="medium" ${task.priority==="medium"?"selected":""}>Medium</option>
          <option value="low" ${task.priority==="low"?"selected":""}>Low</option>
        </select>
      </label>
      <label>Status:
        <select onchange="updateStatus(${task.id}, this.value)">
          <option value="not-started" ${task.status==="not-started"?"selected":""}>Not Started</option>
          <option value="in-progress" ${task.status==="in-progress"?"selected":""}>In Progress</option>
          <option value="done" ${task.status==="done"?"selected":""}>Done</option>
        </select>
      </label>
      <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
      <button class="btn off" onclick="deleteTask(${task.id})">Delete</button>
    `;

    if (task.status === "in-progress") {
      const doNowCard = card.cloneNode(true);
      const timerDisplay = document.createElement("div");
      timerDisplay.className = "task-info";
      timerDisplay.id = `timer-${task.id}`;
      timerDisplay.textContent = formatTime(task.remainingTime || 1500); // default 25 mins if missing
      doNowCard.appendChild(timerDisplay);
      doNow.appendChild(doNowCard);
    } else {
      taskList.appendChild(card);
    }
  });
}

function updatePriority(id, val) {
  let t = tasks.find(x=>x.id===id); t.priority=val; saveTasks();
}

function updateStatus(id, val) {
  let t = tasks.find(x=>x.id===id); t.status=val;
  if (val==="in-progress") {
    if (!t.remainingTime) t.remainingTime = 1500; 
    startTimer(t);
  } else {
    clearInterval(timers[t.id]);
    delete timers[t.id];
    delete t.remainingTime;
  }
  saveTasks(); renderTasks();
}

function formatTime(sec) {
  let h=String(Math.floor(sec/3600)).padStart(2,"0");
  let m=String(Math.floor((sec%3600)/60)).padStart(2,"0");
  let s=String(sec%60).padStart(2,"0");
  return `${h}:${m}:${s}`;
}

function startTimer(task) {
  if (timers[task.id]) clearInterval(timers[task.id]);
  timers[task.id] = setInterval(()=>{
    if (task.remainingTime>0) {
      task.remainingTime--;
      let el=document.getElementById(`timer-${task.id}`);
      if (el) el.textContent=formatTime(task.remainingTime);
      saveTasks();
    } else {
      clearInterval(timers[task.id]);
      task.status="done"; delete task.remainingTime;
      saveTasks(); renderTasks();
      alert(`Task "${task.name}" finished!`);
    }
  },1000);
}


function editTask(id) {
  let t=tasks.find(x=>x.id===id);
  let newName=prompt("Edit name:",t.name);
  if (newName) { t.name=newName; saveTasks(); renderTasks(); }
}
function deleteTask(id) {
  clearInterval(timers[id]);
  tasks=tasks.filter(x=>x.id!==id);
  saveTasks(); renderTasks();
}


document.getElementById("addTaskBtn").onclick=()=>document.getElementById("newTaskPanel").classList.remove("hidden");
document.getElementById("cancelTaskBtn").onclick=()=>document.getElementById("newTaskPanel").classList.add("hidden");
document.getElementById("saveTaskBtn").onclick=()=>{
  const name=document.getElementById("taskName").value.trim();
  const due=document.getElementById("taskDue").value;
  const prio=document.getElementById("taskPriority").value;
  if (!name) return alert("Enter a task name!");
  tasks.push({id:Date.now(), name, due, priority:prio, status:"not-started"});
  saveTasks(); renderTasks();
  document.getElementById("newTaskPanel").classList.add("hidden");
  document.getElementById("taskName").value=""; document.getElementById("taskDue").value="";
  document.getElementById("taskPriority").value="medium";
};


function onDragStart(e,id){ dragTaskId=id; }
function onDragEnd(e){ dragTaskId=null; }
const dropZone=document.getElementById("doNowDropZone");
dropZone.addEventListener("dragover",e=>{ e.preventDefault(); dropZone.classList.add("drag-over"); });
dropZone.addEventListener("dragleave",()=>dropZone.classList.remove("drag-over"));
dropZone.addEventListener("drop",e=>{
  e.preventDefault(); dropZone.classList.remove("drag-over");
  if (dragTaskId) { updateStatus(dragTaskId,"in-progress"); dragTaskId=null; }
});


window.onload=()=>{
  renderTasks();
  tasks.forEach(t=>{ if (t.status==="in-progress" && t.remainingTime) startTimer(t); });
};
