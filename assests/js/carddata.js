/* =====================================================
   CONFIG
===================================================== */
const API_LOAD = "http://127.0.0.1:9000/load";
const API_SAVE = "http://127.0.0.1:9000/save";

/* =====================================================
   GLOBAL STATE
===================================================== */
let initialized = false;
let saveTimer = null;
// 将 grid 改为 let，以便在多板块间动态切换指向
let grid = document.querySelector(".course-grid");

/* =====================================================
   DOM
===================================================== */
const addModal = document.getElementById("modal-overlay");
const deleteModal = document.getElementById("delete-overlay");
const input = document.getElementById("subcourse-name");

/* =====================================================
   SERIALIZE / DESERIALIZE
===================================================== */
function serializeCourses() {
  const fullData = {};
  
  // ⭐ 核心修复：扫描每一个板块 (Section)
  document.querySelectorAll(".section").forEach(section => {
    const sid = section.id;
    if (!sid || sid === "course-detail") return;

    const grid = section.querySelector(".course-grid");
    if (!grid) return;

    fullData[sid] = Array.from(grid.querySelectorAll(".course-card")).map(card => ({
      id: card.id, // 一级 ID (必须有，用于侧边栏跳转)
      title: card.querySelector("h3")?.textContent.trim() || "",
      subs: Array.from(card.querySelectorAll(".sub-card")).map(sub => ({
        id: sub.dataset.id, // 二级 ID
        name: sub.querySelector(".sub-text")?.textContent.trim() || ""
      }))
    }));
  });
  return fullData;
}
function rebuildCourses(data) {
  if (!data || typeof data !== "object") return;

  // 获取所有在 main.js 中定义的 Section 容器
  Object.entries(data).forEach(([sid, courses]) => {
    // 💡 核心修复：使用全局选择器查找，不受当前 active 状态限制
    const gridContainer = document.querySelector(`#${sid} .course-grid`);
    
    if (!gridContainer) {
      console.warn(`⚠️ 数据包含板块 [${sid}]，但页面中找不到对应 ID 的容器`);
      return;
    }

    gridContainer.innerHTML = ""; // 彻底清空旧 DOM

    if (Array.isArray(courses)) {
      courses.forEach(c => {
        // 使用 c.id 恢复卡片身份，确保 side-menu 能跳转
        const card = createCourseCard(c.title, c.id);
        const content = card.querySelector(".course-content");

        (c.subs || []).forEach(subObj => {
          // 兼容处理：支持旧版字符串和新版对象格式
          const name = typeof subObj === 'string' ? subObj : subObj.name;
          const id = typeof subObj === 'object' ? subObj.id : null;
          content.appendChild(createSubCard(name, id));
        });

        gridContainer.appendChild(card);
      });
    }
  });
  console.log("✅ 所有学科板块数据已精准分发");
}
/* =====================================================
   SERVER (SAVE / LOAD)
===================================================== */
async function saveToServer() {
  const data = serializeCourses();
  await fetch(API_SAVE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
}

function requestSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToServer, 500);
}

async function loadFromServer() {
  try {
    const res = await fetch(API_LOAD);
    const rawData = await res.json();
    console.log("📥 收到后端原始数据:", rawData);

    // 💡 核心修复：后端可能直接返回对象，也可能包裹在 {sections: ...} 或 {data: ...} 中
    const data = rawData.sections || rawData.data || rawData;

    if (!data || Object.keys(data).length === 0) {
      console.log("ℹ️ 服务器数据为空，跳过重建");
      return;
    }

    // ⭐ 核心修复：确保在 DOM 完全稳定后再重建
    requestAnimationFrame(() => {
      rebuildCourses(data);
      initialized = true;
    });

  } catch (err) {
    console.error("❌ 数据流中断:", err);
  }
}

/* =====================================================
   ELEMENT FACTORIES (保持不变)
===================================================== */
function createCourseCard(title, id) {
  const card = document.createElement("div");
  card.className = "course-card";
  card.setAttribute("draggable", "true");
  
  // 生成规则：优先用旧 ID，新卡片用标题去空格
  card.id = id || title.replace(/\s+/g, "") || `c-${Date.now()}`;
  
  card.innerHTML = `
    <div class="course-header">
      <h3>${title}</h3>
      <div class="header-right">
        <button class="add-sub">＋</button>
        <button class="del-main">－</button>
        <span class="arrow">▼</span>
      </div>
    </div>
    <div class="course-content"></div>`;
  return card;
}

function createSubCard(name, id) {
  const sub = document.createElement("div");
  sub.className = "sub-card";
  sub.setAttribute("draggable", "true");
  // 二级 ID 存入 dataset
  sub.dataset.id = id || `s-${Math.random().toString(36).substr(2, 9)}`;
  sub.innerHTML = `
    <span class="sub-text">${name}</span>
    <button class="sub-del">－</button>`;
  return sub;
}
/* =====================================================
   MODAL STATE & ACTIONS
===================================================== */
const modalState = {
  addMode: null,
  addTarget: null,
  deleteTarget: null
};

function openAddModal(mode, target = null) {
  modalState.addMode = mode;
  modalState.addTarget = target;
  const title = addModal.querySelector("h3");
  const label = addModal.querySelector("label");

  if (mode === "main") {
    title.textContent = "添加主课程";
    label.textContent = "主课程名称";
    input.value = "";
  } else if (mode === "sub") {
    title.textContent = "添加子内容";
    label.textContent = "子内容名称";
    input.value = "";
  } else if (mode === "rename") {
    const isSub = target.classList.contains("sub-card");
    title.textContent = isSub ? "重命名子内容" : "重命名主课程";
    input.value = isSub 
      ? target.querySelector(".sub-text").textContent.trim() 
      : target.querySelector("h3").textContent.trim();
  }
  addModal.classList.remove("hidden");
}

function closeAddModal() { addModal.classList.add("hidden"); }
function openDeleteModal(target) {
  modalState.deleteTarget = target;
  deleteModal.classList.remove("hidden");
}
function closeDeleteModal() { deleteModal.classList.add("hidden"); }

/* =====================================================
   EVENTS: 核心修复与监听
===================================================== */
// 1. 统一处理弹窗确认
document.getElementById("modal-ok").onclick = () => {
  const name = input.value.trim();
  if (!name) return;

  // 动态锁定当前的 grid
  const activeGrid = document.querySelector(".section.active .course-grid") || grid;

  if (modalState.addMode === "main") {
    activeGrid.appendChild(createCourseCard(name));
  } else if (modalState.addMode === "sub") {
    modalState.addTarget.querySelector(".course-content").appendChild(createSubCard(name));
    modalState.addTarget.classList.add("expanded");
  } else if (modalState.addMode === "rename") {
    const t = modalState.addTarget;
    if (t.classList.contains("sub-card")) t.querySelector(".sub-text").textContent = name;
    else t.querySelector("h3").textContent = name;
  }
  closeAddModal();
  requestSave();
};

document.getElementById("modal-cancel").onclick = closeAddModal;
document.getElementById("delete-ok").onclick = () => {
  modalState.deleteTarget?.remove();
  closeDeleteModal();
  requestSave();
};
document.getElementById("delete-cancel").onclick = closeDeleteModal;

// 2. 增强版点击监听：包含主界面标题栏的 + 按钮
document.addEventListener("click", e => {
  // A. 处理主标题栏的添加按钮 (title-add)
  const titleAdd = e.target.closest(".title-add");
  if (titleAdd) {
    const section = titleAdd.closest(".section");
    grid = section.querySelector(".course-grid"); // 修正 grid 指向
    openAddModal("main");
    return;
  }

  // B. 处理卡片内的功能按钮
  const addSub = e.target.closest(".add-sub");
  if (addSub) openAddModal("sub", addSub.closest(".course-card"));

  const delSub = e.target.closest(".sub-del");
  if (delSub) openDeleteModal(delSub.closest(".sub-card"));

  const delMain = e.target.closest(".del-main");
  if (delMain) openDeleteModal(delMain.closest(".course-card"));

  // C. 处理折叠展开
  const header = e.target.closest(".course-header");
  if (header && !e.target.closest("button")) {
    header.parentElement.classList.toggle("expanded");
  }
});

// 3. 右键重命名
document.addEventListener("contextmenu", e => {
  const sub = e.target.closest(".sub-card");
  const course = e.target.closest(".course-card");
  if (sub || course) {
    e.preventDefault();
    openAddModal("rename", sub || course);
  }
});

/* =====================================================
   DRAG & DROP (保持逻辑，优化选择器)
===================================================== */
let dragged = null;
document.addEventListener("dragstart", e => {
  dragged = e.target.closest(".course-card, .sub-card");
  if (dragged) dragged.classList.add("dragging");
});

document.addEventListener("dragover", e => {
  e.preventDefault();
  const target = e.target.closest(".course-card, .sub-card");
  if (!target || target === dragged || target.parentNode !== dragged.parentNode) return;

  const rect = target.getBoundingClientRect();
  const next = (e.clientY - rect.top) > (rect.height / 2);
  target.parentNode.insertBefore(dragged, next ? target.nextSibling : target);
});

document.addEventListener("dragend", () => {
  if (dragged) dragged.classList.remove("dragging");
  dragged = null;
  requestSave();
});


window.onload = loadFromServer;
