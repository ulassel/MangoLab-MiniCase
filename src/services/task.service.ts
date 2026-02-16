import { PrismaClient, Task, Prisma } from "@prisma/client";
import { NotFoundError, ConflictError } from "../errors";

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export class TaskService {
  constructor(private prisma: PrismaClient) {}

  async createTask(title: string): Promise<Task> {
    try {
      return await this.prisma.task.create({ data: { title } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictError();
      }
      throw err;
    }
  }

  async getAllTasks(page = 1, pageSize = 20): Promise<PaginatedResult<Task>> {
    const skip = (page - 1) * pageSize;
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip,
        take: pageSize,
      }),
      this.prisma.task.count(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getTaskById(id: number): Promise<Task> {
    try {
      return await this.prisma.task.findUniqueOrThrow({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new NotFoundError();
      }
      throw err;
    }
  }

  async updateTask(id: number, data: { title?: string; completed?: boolean }): Promise<Task> {
    try {
      return await this.prisma.task.update({ where: { id }, data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new NotFoundError();
      }
      throw err;
    }
  }

  async removeTask(id: number): Promise<void> {
    try {
      await this.prisma.task.delete({ where: { id } });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
        throw new NotFoundError();
      }
      throw err;
    }
  }
}
