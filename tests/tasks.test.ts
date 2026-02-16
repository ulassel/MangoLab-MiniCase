import request from "supertest";
import app from "../src/app";
import prisma from "../src/lib/prisma";

beforeEach(async () => {
  await prisma.task.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /tasks", () => {
  it("should create a new task", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Test Task" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Task");
    expect(res.body.completed).toBe(false);
    expect(res.body).toHaveProperty("createdAt");
    expect(res.body).toHaveProperty("updatedAt");
  });

  it("should return 400 when title is missing", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when title is empty string", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when title is whitespace only", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "   " });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when title is not a string", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: 123 });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should ignore extra fields like completed", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Test Task", completed: true });

    expect(res.status).toBe(201);
    expect(res.body.completed).toBe(false);
  });

  it("should trim whitespace from title", async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "  Trimmed Task  " });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe("Trimmed Task");
  });

  it("should accept a title with exactly 255 characters", async () => {
    const title = "a".repeat(255);
    const res = await request(app)
      .post("/tasks")
      .send({ title });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe(title);
  });

  it("should reject a title with 256 characters", async () => {
    const title = "a".repeat(256);
    const res = await request(app)
      .post("/tasks")
      .send({ title });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /tasks", () => {
  it("should return empty data when no tasks exist", async () => {
    const res = await request(app).get("/tasks");

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta).toEqual({
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0,
    });
  });

  it("should return all tasks in data array", async () => {
    await request(app).post("/tasks").send({ title: "Task 1" });
    await request(app).post("/tasks").send({ title: "Task 2" });

    const res = await request(app).get("/tasks");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
  });

  it("should return tasks ordered by createdAt desc", async () => {
    await request(app).post("/tasks").send({ title: "First" });
    await request(app).post("/tasks").send({ title: "Second" });

    const res = await request(app).get("/tasks");

    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe("Second");
    expect(res.body.data[1].title).toBe("First");
  });

  it("should return tasks with correct shape", async () => {
    await request(app).post("/tasks").send({ title: "Shape Test" });

    const res = await request(app).get("/tasks");

    expect(res.status).toBe(200);
    const task = res.body.data[0];
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("title");
    expect(task).toHaveProperty("completed");
    expect(task).toHaveProperty("createdAt");
    expect(task).toHaveProperty("updatedAt");
    expect(typeof task.id).toBe("number");
    expect(typeof task.title).toBe("string");
    expect(typeof task.completed).toBe("boolean");
    expect(typeof task.createdAt).toBe("string");
    expect(typeof task.updatedAt).toBe("string");
  });

  it("should support pagination", async () => {
    // Create 3 tasks
    await request(app).post("/tasks").send({ title: "Task 1" });
    await request(app).post("/tasks").send({ title: "Task 2" });
    await request(app).post("/tasks").send({ title: "Task 3" });

    const res = await request(app).get("/tasks?page=1&pageSize=2");

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({
      total: 3,
      page: 1,
      pageSize: 2,
      totalPages: 2,
    });

    const res2 = await request(app).get("/tasks?page=2&pageSize=2");
    expect(res2.body.data).toHaveLength(1);
    expect(res2.body.meta.page).toBe(2);
  });
});

describe("GET /tasks/:id", () => {
  it("should return a single task by ID", async () => {
    const createRes = await request(app)
      .post("/tasks")
      .send({ title: "Find Me" });

    const res = await request(app).get(`/tasks/${createRes.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Find Me");
    expect(res.body.id).toBe(createRes.body.id);
  });

  it("should return 404 for non-existent task", async () => {
    const res = await request(app).get("/tasks/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for invalid ID", async () => {
    const res = await request(app).get("/tasks/abc");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("PATCH /tasks/:id", () => {
  let taskId: number;

  beforeEach(async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Original Task" });
    taskId = res.body.id;
  });

  it("should update only the title", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: "Updated Title" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated Title");
    expect(res.body.completed).toBe(false);
  });

  it("should update only the completed status", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.title).toBe("Original Task");
  });

  it("should update both title and completed", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: "New Title", completed: true });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("New Title");
    expect(res.body.completed).toBe(true);
  });

  it("should trim whitespace from title", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: "  Trimmed  " });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Trimmed");
  });

  it("should return 400 when title is empty string", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: "" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when title is whitespace only", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: "   " });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 when completed is a string", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ completed: "true" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for non-numeric ID", async () => {
    const res = await request(app)
      .patch("/tasks/abc")
      .send({ title: "Test" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for negative ID", async () => {
    const res = await request(app)
      .patch("/tasks/-1")
      .send({ title: "Test" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for zero ID", async () => {
    const res = await request(app)
      .patch("/tasks/0")
      .send({ title: "Test" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for float ID", async () => {
    const res = await request(app)
      .patch("/tasks/1.5")
      .send({ title: "Test" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 404 for non-existent task", async () => {
    const res = await request(app)
      .patch("/tasks/99999")
      .send({ title: "Test" });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return updatedAt field", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("updatedAt");
    expect(typeof res.body.updatedAt).toBe("string");
  });

  it("should ignore extra fields", async () => {
    const res = await request(app)
      .patch(`/tasks/${taskId}`)
      .send({ title: "Updated", extraField: "ignored" });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Updated");
    expect(res.body).not.toHaveProperty("extraField");
  });
});

describe("DELETE /tasks/:id", () => {
  let taskId: number;

  beforeEach(async () => {
    const res = await request(app)
      .post("/tasks")
      .send({ title: "Task to Delete" });
    taskId = res.body.id;
  });

  it("should delete a task and return 204", async () => {
    const res = await request(app).delete(`/tasks/${taskId}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
  });

  it("should not return deleted task in GET /tasks", async () => {
    await request(app).delete(`/tasks/${taskId}`);

    const res = await request(app).get("/tasks");
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it("should return 400 for non-numeric ID", async () => {
    const res = await request(app).delete("/tasks/abc");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for negative ID", async () => {
    const res = await request(app).delete("/tasks/-1");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for zero ID", async () => {
    const res = await request(app).delete("/tasks/0");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 for float ID", async () => {
    const res = await request(app).delete("/tasks/1.5");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 404 for non-existent task", async () => {
    const res = await request(app).delete("/tasks/99999");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 404 when deleting same task twice", async () => {
    await request(app).delete(`/tasks/${taskId}`);
    const res = await request(app).delete(`/tasks/${taskId}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /health", () => {
  it("should return 200 with ok status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("API versioning", () => {
  it("should work with /api/v1/tasks", async () => {
    const createRes = await request(app)
      .post("/api/v1/tasks")
      .send({ title: "Versioned Task" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.title).toBe("Versioned Task");

    const getRes = await request(app).get("/api/v1/tasks");
    expect(getRes.status).toBe(200);
    expect(getRes.body.data).toHaveLength(1);
  });
});

describe("Response headers", () => {
  it("should include security headers", async () => {
    const res = await request(app).get("/health");

    expect(res.headers).toHaveProperty("x-content-type-options");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("Malformed JSON", () => {
  it("should return 400 for invalid JSON body", async () => {
    const res = await request(app)
      .post("/tasks")
      .set("Content-Type", "application/json")
      .send("{invalid json}");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("404 handling", () => {
  it("should return 404 JSON for unknown routes", async () => {
    const res = await request(app).get("/unknown");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Not found" });
  });
});
