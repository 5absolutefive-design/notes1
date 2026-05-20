import { Router } from "express";
import { db, booksTable, pagesTable } from "@workspace/db";
import { eq, count, desc } from "drizzle-orm";

const router = Router();

router.get("/summary", async (_req, res) => {
  const books = await db.select().from(booksTable).orderBy(desc(booksTable.updatedAt));

  const [totalPagesRow] = await db.select({ count: count() }).from(pagesTable);

  const recentBooks = books.slice(0, 5);
  const recentBooksWithCount = await Promise.all(
    recentBooks.map(async (book) => {
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

  res.json({
    totalBooks: books.length,
    totalPages: Number(totalPagesRow?.count ?? 0),
    recentBooks: recentBooksWithCount,
  });
});

export default router;
