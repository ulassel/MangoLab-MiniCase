import { Request, Response, NextFunction } from "express";

export function validateId(req: Request, res: Response, next: NextFunction): void {
  const id = Number(req.params.id);
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }
  next();
}
