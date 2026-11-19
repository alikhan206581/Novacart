export function formatMoney(value, currency) {
  if (currency === "USD") {
    return `$${(value / 100).toFixed(2)}`;
  }
  return `Rs ${Number(value).toLocaleString("en-PK")}`;
}
