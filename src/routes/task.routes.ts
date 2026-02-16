import { Router } from "express";
import { TaskController } from "../controllers/task.controller";
import { TaskService } from "../services/task.service";
import prisma from "../lib/prisma";
import { validate } from "../middlewares/validate";
import { validateId } from "../middlewares/validate-id";
import { createTaskSchema, updateTaskSchema } from "../schemas/task.schema";

const router = Router();
const taskService = new TaskService(prisma);
const taskController = new TaskController(taskService);

router.post("/", validate(createTaskSchema), taskController.create);
router.get("/", taskController.getAll);
router.get("/:id", validateId, taskController.getById);
router.patch("/:id", validateId, validate(updateTaskSchema), taskController.update);
router.delete("/:id", validateId, taskController.remove);

export default router;
