import { z } from "zod";

export const paymentMethods = ["check", "bank_transfer"] as const;
export const paymentStatuses = [
  "pending",
  "cashed",
  "deposited",
  "voided",
  "returned",
] as const;

export type PaymentMethod = (typeof paymentMethods)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

export const paymentStatusLabels: Record<(typeof paymentStatuses)[number], string> = {
  pending: "Pendiente",
  cashed: "Cobrado",
  deposited: "Depositado",
  voided: "Anulado",
  returned: "Devuelto",
};

export const paymentMethodLabels: Record<(typeof paymentMethods)[number], string> = {
  check: "Cheque",
  bank_transfer: "Transferencia",
};

const baseSchema = z.object({
  bankAccountId: z.uuid("Selecciona una cuenta bancaria"),
  payeeId: z.uuid().optional().or(z.literal("")),
  categoryId: z.uuid().optional().or(z.literal("")),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  paymentDate: z.string().min(1, "La fecha es requerida"),
  status: z.enum(paymentStatuses),
  description: z.string().max(500).optional().or(z.literal("")),
});

export const paymentSchema = z.discriminatedUnion("paymentMethod", [
  baseSchema.extend({
    paymentMethod: z.literal("check"),
    checkNumber: z.string().trim().min(1, "El número de cheque es requerido"),
    transferReference: z.literal("").optional(),
  }),
  baseSchema.extend({
    paymentMethod: z.literal("bank_transfer"),
    transferReference: z.string().trim().min(1, "La referencia es requerida"),
    checkNumber: z.literal("").optional(),
  }),
]);

export const bankAccountSchema = z.object({
  bankName: z.string().trim().min(1, "El banco es requerido").max(100),
  accountAlias: z.string().trim().min(1, "El alias es requerido").max(100),
  accountNumberLast4: z
    .string()
    .trim()
    .regex(/^\d{0,4}$/, "Máximo 4 dígitos")
    .optional()
    .or(z.literal("")),
});

export const payeeSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(150),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(80),
});
