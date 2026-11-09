import { z } from "zod";

/**
 * Input schemas for every route that takes a JSON body from the outside world. The point is the
 * length limits: without them a client can post megabytes into a field, which costs memory, slows
 * the database and gets forwarded to paid APIs (SMS, the AI model).
 *
 * Use with safeParse and answer 400 with the first issue's message.
 */

const email = z.string().trim().toLowerCase().email("That does not look like an email address.").max(254);
const optionalText = (max: number) => z.string().trim().max(max).optional();

export const signupSchema = z.object({
  email,
  password: z
    .string()
    .min(8, "Your password must be at least 8 characters.")
    .max(128, "Your password must be at most 128 characters."),
  firstName: optionalText(50),
  lastName: optionalText(50),
  fullName: optionalText(100),
  phone: optionalText(20),
  // Only buyer/seller are honoured; the route maps anything else to "buyer".
  role: optionalText(20),
});

export const emailOnlySchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(200),
  password: z
    .string()
    .min(8, "Your password must be at least 8 characters.")
    .max(128, "Your password must be at most 128 characters."),
});

// The 2FA route. `email` is accepted for backwards compatibility but ignored on "send": the code is
// always mailed to the signed-in user's own address, never to one chosen by the caller.
export const otpSendSchema = z.object({
  action: z.literal("send"),
  email: optionalText(254),
  phone: optionalText(20),
});

export const otpVerifySchema = z.object({
  action: z.literal("verify"),
  email: optionalText(254),
  phone: optionalText(20),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
});

export const googleVerifySchema = z.object({
  action: z.literal("google_verify"),
  email: optionalText(254),
  googleToken: z.string().min(1).max(4096),
});

export const twoFactorSchema = z.discriminatedUnion("action", [otpSendSchema, otpVerifySchema, googleVerifySchema]);

export const smsSchema = z.object({
  action: z.enum(["send", "verify"]),
  phone: z.string().trim().min(7).max(20),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code.").optional(),
});

export const aiChatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().max(2000) }))
    .max(20),
  role: z.enum(["buyer", "seller", "landlord"]).optional(),
  user: z.object({ name: optionalText(100), email: optionalText(254) }).optional(),
});

export const createInvoiceSchema = z.object({
  propertyId: z.string().uuid(),
  purpose: z.enum(["rent", "security", "both", "reservation", "sale"]).optional(),
  period: optionalText(40),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dueDate must be YYYY-MM-DD").optional(),
  depositMonths: z.coerce.number().int().min(1).max(3).optional(),
});

export const ocrSchema = z.object({
  propertyId: z.string().uuid(),
  imagePath: z.string().min(1).max(300),
});

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
