import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import savingsRouter from "./savings";
import usersRouter from "./users";
import financeRouter from "./finance";
import transactionsRouter from "./transactions";
import pulseRouter from "./pulse";
import notificationsRouter from "./notifications";
import reportsRouter from "./reports";
import simulationRouter from "./simulation";
import assistantRouter from "./assistant";
import communityRouter from "./community";
import calculatorRouter from "./calculator";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(savingsRouter);
router.use(usersRouter);
router.use(financeRouter);
router.use(transactionsRouter);
router.use(pulseRouter);
router.use(notificationsRouter);
router.use(reportsRouter);
router.use(simulationRouter);
router.use(assistantRouter);
router.use(communityRouter);
router.use("/calculator", calculatorRouter);

export default router;
