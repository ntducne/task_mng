import http from "./httpCommon";

export interface Task {
    task_id: string;
    coding: number;
    local_test: number;
    develop_test: number;
    production_test: number;
    deploy_date?: string | null;
    mgmt_code: number;
    bug: number;
}

export interface TaskListResponse {
    data: Task[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface UpdateTaskPayload {
    task_id?: string;
    mgmt_code?: number;
    coding?: number;
    local_test?: number;
    develop_test?: number;
    production_test?: number;
    deploy_date?: string;
    bug?: number;
}

export default {
    async getTasks(
        page: number = 1,
        limit: number = 10,
        search: string = ""
    ): Promise<TaskListResponse> {
        const response = await http.get<TaskListResponse>("/tasks/", {
            params: { page, limit, search }
        });
        return response.data;
    },

    async getTaskById(taskId: string): Promise<Task> {
        const response = await http.get<Task>(`/tasks/${taskId}`);
        return response.data;
    },

    async createTask(payload: Task): Promise<Task> {
        const response = await http.post<Task>("/tasks/", payload);
        return response.data;
    },

    async updateTask(
        taskId: string,
        payload: UpdateTaskPayload
    ): Promise<Task> {
        const response = await http.put<Task>(
            `/tasks/${taskId}`,
            payload
        );
        return response.data;
    },

    async deleteTask(taskId: string): Promise<{ message: string }> {
        const response = await http.delete<{ message: string }>(
            `/tasks/${taskId}`
        );
        return response.data;
    },

    async getAnalysisData(): Promise<any> {
        const response = await http.get<any>("/analysis");
        return response.data;
    }
};