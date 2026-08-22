import { cn } from "@/lib/utils";
import { paymentStatusLabels, type paymentStatuses } from "@/lib/validations";

const statusStyles: Record<(typeof paymentStatuses)[number], string> = {
  pending: "bg-warning-bg text-warning",
  cashed: "bg-success-bg text-success",
  deposited: "bg-info-bg text-info",
  voided: "bg-neutral-bg text-neutral",
  returned: "bg-danger-bg text-danger",
};

export function StatusBadge({ status }: { status: (typeof paymentStatuses)[number] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        statusStyles[status],
      )}
    >
      {paymentStatusLabels[status]}
    </span>
  );
}
