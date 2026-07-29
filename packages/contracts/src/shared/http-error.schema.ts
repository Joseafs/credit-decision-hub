import { z } from "zod";

export const apiErrorResponseSchema = z
  .object({
    message: z.string().trim().min(1),
  })
  .strict();

export const validationErrorResponseSchema = apiErrorResponseSchema
  .extend({
    issues: z.array(
      z
        .object({
          path: z.string(),
          message: z.string().trim().min(1),
        })
        .strict(),
    ),
  })
  .strict();

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type ValidationErrorResponse = z.infer<
  typeof validationErrorResponseSchema
>;
