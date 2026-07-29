import { z } from "zod";

export const entityIdSchema = z.string().regex(/^[a-f\d]{24}$/i);
