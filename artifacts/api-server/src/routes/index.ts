import { Router, type IRouter } from "express";
import healthRouter from "./health";
import realEstateRouter from "./real-estate";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(realEstateRouter);
router.use("/admin", adminRouter);

export default router;
