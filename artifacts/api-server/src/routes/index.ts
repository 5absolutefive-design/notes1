import { Router, type IRouter } from "express";
import healthRouter from "./health";
import booksRouter from "./books";
import pagesRouter from "./pages";
import summaryRouter from "./summary";

const router: IRouter = Router();

router.use(healthRouter);
router.use(booksRouter);
router.use(pagesRouter);
router.use(summaryRouter);

export default router;
