/* -------------------------------
     5. PDF 阅读器逻辑（完整保留）
  --------------------------------*/
  document.addEventListener("click", e => {
    const pdfCard = e.target.closest(".pdf-card");
    if (!pdfCard) return;

    const pdfPath = pdfCard.dataset.pdf;
    if (!pdfPath) return;

    e.preventDefault();

    document.body.innerHTML = `
      <div id="pdf-viewer" style="width:100%; height:100vh; display:flex; flex-direction:column;">
        <div style="background:#6ac7ca; color:white; padding:10px 20px; display:flex; justify-content:space-between;">
          <div style="font-weight:600; font-size:18px;">📖 ${pdfCard.textContent.trim()}</div>
          <div>
            <a href="${pdfPath}" download style="color:white; margin-right:20px;">⬇️ 下载</a>
            <button id="pdf-exit" style="background:none; border:none; color:white; font-size:20px;">✕ 退出</button>
          </div>
        </div>
        <iframe src="${pdfPath}" style="flex:1; border:none;"></iframe>
      </div>
    `;

    document.getElementById("pdf-exit").addEventListener("click", () => {
      location.reload();
    });
  });
