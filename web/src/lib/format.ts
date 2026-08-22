export function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("es-SV", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(isoDate: string) {
  return new Intl.DateTimeFormat("es-SV", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(`${isoDate}T00:00:00`));
}
