import { t } from "elysia";

const cacheQueryModel = t.Union([t.Literal("true"), t.Literal("false")], {
    default: "true",
})

const cacheDurationModel = t.Number({ default: 60 }) // in seconds


export const queryModel = t.Object({
    cache: cacheQueryModel,
    cacheDuration: cacheDurationModel
});

export function shouldCache(query: { cache: "true" | "false" }) {
    return query.cache === "true";
}