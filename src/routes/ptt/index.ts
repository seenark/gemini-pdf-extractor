import Elysia from "elysia";
import { lngRoutes } from "./lng";
import { lpgRoutes } from "./lpg";
import { supplyRoutes } from "./supply";
import { tsoRoutes } from "./tso";

export const pttRoutes = new Elysia().group("/ptt", (c) =>
    c.use(supplyRoutes).use(tsoRoutes).use(lngRoutes).use(lpgRoutes)
);
