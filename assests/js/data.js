/* ===============================
   data.js - 核心数据传输层
================================ */
const API_BASE = "http://127.0.0.1:9000";
const API_LOAD = `${API_BASE}/load`;
const API_SAVE = `${API_BASE}/save`;

let saveTimer = null;

// ⭐ 延迟保存，防止频繁读写硬盘
function requestSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToServer, 800);
}

async function saveToServer() {
  // 检查 carddata.js 里的函数是否可用
  if (typeof serializeCourses !== "function") return;

  try {
    const payload = serializeCourses(); // 拿到全量数据 { math:[], physics:[] }
    console.log("📡 正在同步全量数据...", payload);

    const response = await fetch(API_SAVE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload) // 直接发送对象给 server.py
    });

    if (response.ok) console.log("✅ 数据已安全存入 data.json");
  } catch (err) {
    console.error("❌ 保存失败:", err);
  }
}

async function loadFromServer() {
  try {
    const res = await fetch(API_LOAD);
    const data = await res.json();
    console.log("📥 从后端加载原始数据:", data);

    if (typeof rebuildCourses === "function") {
      rebuildCourses(data); // 交给 carddata.js 去画 UI
    }
  } catch (err) {
    console.warn("⚠️ 加载失败，文件可能为空");
  }
}

// 页面加载启动
document.addEventListener("DOMContentLoaded", () => {
  loadFromServer();
});