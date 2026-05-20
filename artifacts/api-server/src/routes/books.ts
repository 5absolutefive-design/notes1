import { Router } from "express";
import { db, booksTable, pagesTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";
import {
  CreateBookBody,
  UpdateBookParams,
  UpdateBookBody,
  DeleteBookParams,
  GetBookParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/books", async (req, res) => {
  const books = await db.select().from(booksTable).orderBy(desc(booksTable.updatedAt));

  const booksWithCount = await Promise.all(
    books.map(async (book) => {
      const [row] = await db
        .select({ count: count() })
        .from(pagesTable)
        .where(eq(pagesTable.bookId, book.id));
      return {
        ...book,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        pageCount: Number(row?.count ?? 0),
      };
    })
  );

  res.json(booksWithCount);
});

router.post("/books", async (req, res) => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { title, color } = parsed.data;
  const [book] = await db
    .insert(booksTable)
    .values({ title, color: color ?? "#2d2d2d" })
    .returning();

  res.status(201).json({
    ...book,
    createdAt: book!.createdAt.toISOString(),
    updatedAt: book!.updatedAt.toISOString(),
    pageCount: 0,
  });
});

router.get("/books/:bookId", async (req, res) => {
  const parsed = GetBookParams.safeParse({ bookId: Number(req.params.bookId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [book] = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, parsed.data.bookId));

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const [row] = await db
    .select({ count: count() })
    .from(pagesTable)
    .where(eq(pagesTable.bookId, book.id));

  res.json({
    ...book,
    createdAt: book.createdAt.toISOString(),
    updatedAt: book.updatedAt.toISOString(),
    pageCount: Number(row?.count ?? 0),
  });
});

router.patch("/books/:bookId", async (req, res) => {
  const paramsParsed = UpdateBookParams.safeParse({ bookId: Number(req.params.bookId) });
  const bodyParsed = UpdateBookBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [existing] = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, paramsParsed.data.bookId));

  if (!existing) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const [updated] = await db
    .update(booksTable)
    .set({ ...bodyParsed.data })
    .where(eq(booksTable.id, paramsParsed.data.bookId))
    .returning();

  const [row] = await db
    .select({ count: count() })
    .from(pagesTable)
    .where(eq(pagesTable.bookId, updated!.id));

  res.json({
    ...updated,
    createdAt: updated!.createdAt.toISOString(),
    updatedAt: updated!.updatedAt.toISOString(),
    pageCount: Number(row?.count ?? 0),
  });
});

router.delete("/books/:bookId", async (req, res) => {
  const parsed = DeleteBookParams.safeParse({ bookId: Number(req.params.bookId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  await db.delete(booksTable).where(eq(booksTable.id, parsed.data.bookId));
  res.status(204).send();
});

export default router;
