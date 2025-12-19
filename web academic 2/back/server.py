print("🔥🔥🔥 FULL-STORAGE SERVER IS RUNNING 🔥🔥🔥")

from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = "data.json"

# --- 1. 修改后的加载接口：返回全部数据 ---
@app.get("/load")
def load():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            db = json.load(f)
    except Exception:
        db = {}
    return db  # 直接返回整个 JSON 对象

# --- 2. 修改后的保存接口：接收全量 payload ---
@app.post("/save")
def save(payload: Dict = Body(...)):
    """
    接收前端传来的 { "sections": { "math": [...], "physics": [...] } }
    """
    try:
        # payload 结构取决于你前端发送的内容
        # 如果你前端发的是 serializeAll() 的结果，它就是 {"sections": {...}}
        data_to_save = payload.get("sections", payload)

        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(data_to_save, f, ensure_ascii=False, indent=2)
        
        print("✅ 数据已全量写入 data.json")
        return {"status": "ok"}
    except Exception as e:
        print(f"❌ 保存出错: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=9000)