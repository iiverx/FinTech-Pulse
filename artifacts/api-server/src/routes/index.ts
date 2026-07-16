import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import savingsRouter from "./savings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(savingsRouter);

export default router;
