import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import applicationsRouter from "./applications";
import bookingsRouter from "./bookings";
import contentRouter from "./content";
import analyticsRouter from "./analytics";
import uploadRouter from "./upload";
import storageRouter from "./storage";
import authRouter from "./auth";
import coursesRouter from "./courses";
import worksRouter from "./works";
import dailyRouter from "./daily";
import statsRouter from "./stats";
import userUploadRouter from "./userUpload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(applicationsRouter);
router.use(bookingsRouter);
router.use(contentRouter);
router.use(analyticsRouter);
router.use(uploadRouter);
router.use(storageRouter);
router.use(authRouter);
router.use(coursesRouter);
router.use(worksRouter);
router.use(dailyRouter);
router.use(statsRouter);
router.use(userUploadRouter);

export default router;
