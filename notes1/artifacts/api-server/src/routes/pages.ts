import { Router } from "express";
import { db, pagesTable, booksTable } from "@workspace/db";
import { eq, and, count, isNull, isNotNull } from "drizzle-orm";
import {
  ListPagesParams,
  CreatePageParams,
  CreatePageBody,
  GetPageParams,
  UpdatePageParams,
  UpdatePageBody,
  DeletePageParams,
} from "@workspace/api-zod";

const router = Router();

const serializePage = (p: typeof pagesTable.$inferSelect) => ({
  ...p,
  deletedAt: p.deletedAt ? p.deletedAt.toISOString() : null,
  createdAt: p.createdAt.toISOString(),
  updatedAt: p.updatedAt.toISOString(),
});

router.get("/books/:bookId/pages", async (req, res) => {
  const parsed = ListPagesParams.safeParse({ bookId: Number(req.params.bookId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book id" });
    return;
  }

  const pages = await db
    .select()
    .from(pagesTable)
    .where(and(eq(pagesTable.bookId, parsed.data.bookId), isNull(pagesTable.deletedAt)))
    .orderBy(pagesTable.pageNumber);

  res.json(pages.map(serializePage));
});

router.post("/books/:bookId/pages", async (req, res) => {
  const paramsParsed = CreatePageParams.safeParse({ bookId: Number(req.params.bookId) });
  const bodyParsed = CreatePageBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [book] = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, paramsParsed.data.bookId));

  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }

  const [lastPage] = await db
    .select({ count: count() })
    .from(pagesTable)
    .where(and(eq(pagesTable.bookId, paramsParsed.data.bookId), isNull(pagesTable.deletedAt)));

  const nextPageNumber = Number(lastPage?.count ?? 0) + 1;

  const [page] = await db
    .insert(pagesTable)
    .values({
      bookId: paramsParsed.data.bookId,
      title: bodyParsed.data.title,
      content: bodyParsed.data.content ?? "",
      pageNumber: nextPageNumber,
    })
    .returning();

  res.status(201).json(serializePage(page!));
});

router.get("/books/:bookId/trash", async (req, res) => {
  const parsed = ListPagesParams.safeParse({ bookId: Number(req.params.bookId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book id" });
    return;
  }

  const pages = await db
    .select()
    .from(pagesTable)
    .where(and(eq(pagesTable.bookId, parsed.data.bookId), isNotNull(pagesTable.deletedAt)))
    .orderBy(pagesTable.pageNumber);

  res.json(pages.map(serializePage));
});

router.get("/books/:bookId/pages/:pageId", async (req, res) => {
  const parsed = GetPageParams.safeParse({
    bookId: Number(req.params.bookId),
    pageId: Number(req.params.pageId),
  });

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const [page] = await db
    .select()
    .from(pagesTable)
    .where(
      and(
        eq(pagesTable.id, parsed.data.pageId),
        eq(pagesTable.bookId, parsed.data.bookId)
      )
    );

  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  res.json(serializePage(page));
});

router.patch("/books/:bookId/pages/:pageId", async (req, res) => {
  const paramsParsed = UpdatePageParams.safeParse({
    bookId: Number(req.params.bookId),
    pageId: Number(req.params.pageId),
  });
  const bodyParsed = UpdatePageBody.safeParse(req.body);

  if (!paramsParsed.success || !bodyParsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const [existing] = await db
    .select()
    .from(pagesTable)
    .where(
      and(
        eq(pagesTable.id, paramsParsed.data.pageId),
        eq(pagesTable.bookId, paramsParsed.data.bookId)
      )
    );

  if (!existing) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  const [updated] = await db
    .update(pagesTable)
    .set({ ...bodyParsed.data })
    .where(eq(pagesTable.id, paramsParsed.data.pageId))
    .returning();

  res.json(serializePage(updated!));
});

router.delete("/books/:bookId/pages/:pageId", async (req, res) => {
  const parsed = DeletePageParams.safeParse({
    bookId: Number(req.params.bookId),
    pageId: Number(req.params.pageId),
  });

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  await db
    .update(pagesTable)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(pagesTable.id, parsed.data.pageId),
        eq(pagesTable.bookId, parsed.data.bookId)
      )
    );

  res.status(204).send();
});

router.post("/books/:bookId/pages/:pageId/restore", async (req, res) => {
  const parsed = DeletePageParams.safeParse({
    bookId: Number(req.params.bookId),
    pageId: Number(req.params.pageId),
  });

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const [page] = await db
    .update(pagesTable)
    .set({ deletedAt: null })
    .where(
      and(
        eq(pagesTable.id, parsed.data.pageId),
        eq(pagesTable.bookId, parsed.data.bookId)
      )
    )
    .returning();

  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }

  res.json(serializePage(page));
});

router.delete("/books/:bookId/pages/:pageId/permanent", async (req, res) => {
  const parsed = DeletePageParams.safeParse({
    bookId: Number(req.params.bookId),
    pageId: Number(req.params.pageId),
  });

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  await db
    .delete(pagesTable)
    .where(
      and(
        eq(pagesTable.id, parsed.data.pageId),
        eq(pagesTable.bookId, parsed.data.bookId)
      )
    );

  res.status(204).send();
});

export default router;
