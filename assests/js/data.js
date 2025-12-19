/* ===============================
   data.js - 核心数据层
================================ */
const API_BASE = "http://127.0.0.1:9000";
const API_LOAD = `${API_BASE}/load`;
const API_SAVE = `${API_BASE}/save`;
const CURRENT_USER_ID = "user_demo_001";

let saveTimer = null;

// ⭐ 修复：确保 requestSave 能被其他 JS 文件调用
function requestSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToServer, 500);
}

async function saveToServer() {
  // 检查 serializeCourses 是否在 carddata.js 中定义
  if (typeof serializeCourses !== "function") {
    console.error("serializeCourses function not found!");
    return;
  }

  try {
    const sectionsData = serializeCourses(); // 这里拿到的是 { sections: {...} }
    const payload = {
      userId: CURRENT_USER_ID,
      data: sectionsData  // 建议包裹一层，方便后端解析
    };

    console.log("📡 Sending to server:", payload);

    const response = await fetch(API_SAVE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log("✅ Save successful");
    }
  } catch (err) {
    console.error("❌ Network error during save:", err);
  }
}

async function loadFromServer() {
  try {
    const res = await fetch(API_LOAD);
    const result = await res.json();
    
    // ⭐ 核心修复：拿到数据后必须重建 UI
    // 根据你后端的返回结构进行调整
    const finalData = result.data || result; 
    if (typeof rebuildCourses === "function") {
      rebuildCourses(finalData);
      console.log("📥 Data loaded and UI rebuilt");
    }
  } catch (err) {
    console.warn("⚠️ Load failed or server empty");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // 确保 Modal 初始状态正确（如果变量存在的话）
  const addModal = document.getElementById("modal-overlay");
  const deleteModal = document.getElementById("delete-overlay");
  if (addModal) addModal.classList.add("hidden");
  if (deleteModal) deleteModal.classList.add("hidden");

  loadFromServer();
});