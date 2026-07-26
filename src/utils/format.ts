/** Locale-aware formatters. Pure — safe on the server and the client. */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/** 179.9 → "R$ 179,90" */
export const formatPrice = (value: number) => brl.format(value);

/** 179.9 → "3x de R$ 59,97" — the store's default instalment plan. */
export const formatInstalments = (value: number, instalments = 3) =>
  `${instalments}x de ${brl.format(value / instalments)}`;
