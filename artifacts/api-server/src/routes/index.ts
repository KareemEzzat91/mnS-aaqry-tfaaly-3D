import { Router, type IRouter } from "express";
import healthRouter from "./health";
import realEstateRouter from "./real-estate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(realEstateRouter);

export default router;
