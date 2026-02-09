from fastapi import FastAPI, HTTPException, Body, Query
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
import math
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

load_dotenv()

cors_domains = os.getenv("CORS_DOMAIN_ALLOW", "")
allow_origins = [d.strip() for d in cors_domains.split(",") if d.strip()]

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = "project_management"
COLLECTION_NAME = "tasks"

app = FastAPI(title="Task Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]


class TaskSchema(BaseModel):
    task_id: str = Field(..., example="LOWCODE-2073")
    coding: int
    local_test: int
    develop_test: int
    production_test: int
    deploy_date: Optional[str] = None
    mgmt_code: int
    bug: int


class UpdateTaskSchema(BaseModel):
    coding: Optional[int] = None
    local_test: Optional[int] = None
    develop_test: Optional[int] = None
    production_test: Optional[int] = None
    deploy_date: Optional[str] = None
    mgmt_code: Optional[int] = None
    bug: Optional[int] = None


class TaskListResponse(BaseModel):
    data: List[TaskSchema]
    total: int
    page: int
    limit: int
    total_pages: int


def task_helper(task) -> dict:
    return {
        "task_id": task["task_id"],
        "coding": task["coding"],
        "local_test": task["local_test"],
        "develop_test": task["develop_test"],
        "production_test": task["production_test"],
        "deploy_date": task["deploy_date"],
        "mgmt_code": task["mgmt_code"],
        "bug": task["bug"]
    }


@app.post("/tasks/", response_model=TaskSchema)
async def create_task(task: TaskSchema):
    existing_task = await collection.find_one({"task_id": task.task_id})
    if existing_task:
        raise HTTPException(status_code=400, detail="Task ID already exists")

    await collection.insert_one(task.dict())
    return task


@app.get("/tasks/", response_model=TaskListResponse)
async def get_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None
):
    filter_query = {}
    if search:
        filter_query = {
            "$or": [
                {"task_id": {"$regex": search, "$options": "i"}},
            ]
        }

    skip = (page - 1) * limit
    total_record = await collection.count_documents(filter_query)

    cursor = collection.find(filter_query).sort("_id", -1).skip(skip).limit(limit)
    tasks = [task_helper(task) async for task in cursor]

    total_pages = math.ceil(total_record / limit)

    return {
        "data": tasks,
        "total": total_record,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@app.get("/tasks/{task_id}", response_model=TaskSchema)
async def get_task(task_id: str):
    task = await collection.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task_helper(task)


@app.put("/tasks/{task_id}", response_model=TaskSchema)
async def update_task(task_id: str, req: UpdateTaskSchema = Body(...)):
    req_data = {k: v for k, v in req.dict().items() if v is not None}

    if req_data:
        await collection.update_one(
            {"task_id": task_id},
            {"$set": req_data}
        )

    task = await collection.find_one({"task_id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task_helper(task)


@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await collection.delete_one({"task_id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": f"Task {task_id} deleted successfully"}


@app.get("/analysis")
async def task_analysis():
    pipeline = [
        {
            "$facet": {
                "coding": [
                    {"$match": {"coding": 0}},
                    {"$count": "count"}
                ],
                "bugs": [
                    {"$group": {"_id": None, "total": {"$sum": "$bug"}}}
                ],
                "wait_local": [
                    {"$match": {"local_test": 0}},
                    {"$count": "count"}
                ],
                "wait_develop": [
                    {"$match": {"develop_test": 0}},
                    {"$count": "count"}
                ],
                "wait_production": [
                    {"$match": {"production_test": 0}},
                    {"$count": "count"}
                ],
                "test_local": [
                    {"$match": {"local_test": 1}},
                    {"$count": "count"}
                ],
                "test_develop": [
                    {"$match": {"develop_test": 1}},
                    {"$count": "count"}
                ],
                "test_production": [
                    {"$match": {"production_test": 1}},
                    {"$count": "count"}
                ],
                "total": [
                    {"$count": "count"}
                ]
            }
        }
    ]

    result = await collection.aggregate(pipeline).to_list(1)
    data = result[0]

    def get_count(key):
        return data[key][0]["count"] if data[key] else 0

    return {
        "coding": get_count("coding"),
        "bugs": data["bugs"][0]["total"] if data["bugs"] else 0,
        "waiting_test": {
            "local": get_count("wait_local"),
            "develop": get_count("wait_develop"),
            "production": get_count("wait_production")
        },
        "testing": {
            "local": get_count("test_local"),
            "develop": get_count("test_develop"),
            "production": get_count("test_production")
        },
        "total": get_count("total")
    }
