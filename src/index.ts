import openapi from "@elysiajs/openapi";
import { Effect } from "effect";
import Elysia, { t } from "elysia";
import { ExtractPDFService } from "./extract-pdf.service";
import { Runtime } from "./runtime";
import { InvoiceSchema, InvoiceSystemPrompt } from "./schema/invoice";
import {
  PELNG_EXTRACTION_SYSTEM_PROMPT,
  PELNGInvoiceSchema,
} from "./schema/pelng";

const app = new Elysia();

function debugEnv() {
  const program = Effect.Do.pipe(
    Effect.tap(() => Effect.logDebug("env", process.env))
  );
  Runtime.runSync(program);
}

debugEnv();

app
  .use(
    openapi({
      path: "/docs",
    })
  )
  .get("/health", () => "Ok")
  .post(
    "/invoice",
    async ({ body }) => {
      const arrBuf = await body.file.arrayBuffer();
      const fileBuffer = Buffer.from(arrBuf);

      const program = Effect.all({
        svc: ExtractPDFService,
      }).pipe(
        Effect.andThen(({ svc }) =>
          svc.processInline(fileBuffer, InvoiceSystemPrompt, InvoiceSchema)
        ),
        Effect.catchTag("ExtractPDF/Process/Error", (error) =>
          Effect.succeed(
            Response.json(
              {
                message: error.message,
                error: error.error,
                status: "500",
              },
              {
                status: 500,
              }
            )
          )
        )
      );

      const result = await Runtime.runPromise(program);
      console.log({ result });
      return result;
    },
    {
      body: t.Object(
        {
          file: t.File({ format: "application/pdf" }),
        },
        {
          description: "Upload an invoice",
        }
      ),
      tags: ["Invoice"],
    }
  )
  .post(
    "/pelng",
    async ({ body }) => {
      const arrBuf = await body.file.arrayBuffer();
      const fileBuffer = Buffer.from(arrBuf);

      const program = Effect.all({
        svc: ExtractPDFService,
      }).pipe(
        Effect.andThen(({ svc }) =>
          svc.processInline(
            fileBuffer,
            PELNG_EXTRACTION_SYSTEM_PROMPT,
            PELNGInvoiceSchema
          )
        ),
        Effect.catchTag("ExtractPDF/Process/Error", (error) =>
          Effect.succeed(
            Response.json(
              {
                message: error.message,
                error: error.error,
                status: "500",
              },
              {
                status: 500,
              }
            )
          )
        )
      );

      const result = await Runtime.runPromise(program);
      console.log({ result });
      return result;
    },
    {
      body: t.Object({
        file: t.File({ format: "application/pdf" }),
      }),

      tags: ["Invoice"],
    }
  );

app.listen(3000);
console.log("server start at port:", 3000);
