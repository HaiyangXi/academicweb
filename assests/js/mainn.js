document.addEventListener("DOMContentLoaded", () => {
  console.log("🔥 Main script loaded");

  /* ===============================
     基础选择器
  =============================== */
  const topLinks = document.querySelectorAll(".navbar a");
  const sideMenu = document.querySelector(".side-menu");
  const sections = document.querySelectorAll(".section");
  const content = document.querySelector(".content");

  /* ===============================
     SECTION 切换（唯一版本）
  =============================== */
  function showSection(id) {
    if (!id) return;

    sections.forEach(s => s.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");

    topLinks.forEach(a => {
      a.classList.toggle("active", a.dataset.target === id);
    });

    // ⭐ 记住当前页面
    localStorage.setItem("currentSection", id);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ===============================
     顶部导航绑定
  =============================== */
  topLinks.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const target = link.dataset.target;
      showSection(target);
      updateSideMenu(target);
    });
  });

  /* ===============================
     左侧课程目录配置
  =============================== */
  const menuCourses = {
    math: ["Foundations","Calculus","Matrix Operations","ODE","Analysis","Complex Analysis","Topology"],
    physics: ["经典力学","电磁学","光学","热学"],
    mech: ["嵌入式控制","执行器","传感器"],
    program: ["Python","C++","MATLAB","C","Rust","Julia"],
    algorithm: ["数学基础","路径规划","最优化"],
    signal: ["信号与系统","经典控制","现代控制","自适应控制"],
    projects: ["UGV 控制","PSO-BP 控制","协同控制"],
    password: ["密码学基础"],
    music: ["乐理"],
    others: [],
    home: []
  };

  function updateSideMenu(section) {
    const list = menuCourses[section];

    if (!list || list.length === 0) {
      sideMenu.classList.add("hidden");
      sideMenu.innerHTML = "";
      return;
    }

    sideMenu.classList.remove("hidden");
    sideMenu.innerHTML = list
      .map(name =>
        `<a class="side-link" data-jump="${name.replace(/\s+/g,"")}">${name}</a>`
      )
      .join("");

    bindSideMenuScroll();
  }

  function bindSideMenuScroll() {
    document.querySelectorAll(".side-link").forEach(link => {
      link.onclick = e => {
        e.preventDefault();
        const id = link.dataset.jump;
        const card = document.getElementById(id);
        if (!card) return;

        const y = card.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top: y, behavior: "smooth" });
      };
    });
  }

  /* ===============================
     课程详情 section（保留）
  =============================== */
  const detailSection = document.createElement("div");
  detailSection.id = "course-detail";
  detailSection.classList.add("section");
  content.appendChild(detailSection);

  /* ===============================
     初始化（唯一入口）
  =============================== */

  // ✅ 只在这里恢复页面状态
  const lastSection = localStorage.getItem("currentSection") || "home";
  showSection(lastSection);
  updateSideMenu(lastSection);

  // ✅ 后端数据加载（不影响 section）
  loadFromServer().then(() => {
    console.log("✅ backend loaded");
  });

});