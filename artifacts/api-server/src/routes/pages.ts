import { Router } from "express";
import { db, pagesTable, booksTable } from "@workspace/db";
import { eq, and, count, desc } from "drizzle-orm";
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

router.get("/books/:bookId/pages", async (req, res) => {
  const parsed = ListPagesParams.safeParse({ bookId: Number(req.params.bookId) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid book id" });
    return;
  }

  const pages = await db
    .select()
    .from(pagesTable)
    .where(eq(pagesTable.bookId, parsed.data.bookId))
    .orderBy(pagesTable.pageNumber);

  res.json(
    pages.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
  );
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
    .where(eq(pagesTable.bookId, paramsParsed.data.bookId));

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

  res.status(201).json({
    ...page,
    createdAt: page!.createdAt.toISOString(),
    updatedAt: page!.updatedAt.toISOString(),
  });
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

  res.json({
    ...page,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  });
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

  res.json({
    ...updated,
    createdAt: updated!.createdAt.toISOString(),
    updatedAt: updated!.updatedAt.toISOString(),
  });
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
