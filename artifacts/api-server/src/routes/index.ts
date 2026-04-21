import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import applicationsRouter from "./applications";
import contentRouter from "./content";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(applicationsRouter);
router.use(contentRouter);
router.use(analyticsRouter);

export default router;
