import { Request, Response } from "express";
import { TaskService } from "../services/task.service";
import { paginationSchema } from "../schemas/task.schema";
import { asyncHandler } from "../middlewares/async-handler";

export class TaskController {
  constructor(private taskService: TaskService) {}

  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const task = await this.taskService.createTask(req.body.title);
    res.status(201).json(task);
  });

  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, pageSize } = paginationSchema.parse(req.query);
    const result = await this.taskService.getAllTasks(page, pageSize);
    res.status(200).json(result);
  });

  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const task = await this.taskService.getTaskById(id);
    res.status(200).json(task);
  });

  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const task = await this.taskService.updateTask(id, req.body);
    res.status(200).json(task);
  });

  remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    await this.taskService.removeTask(id);
    res.status(204).send();
  });
}
