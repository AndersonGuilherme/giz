// Comunicação: o texto da confirmação. Função pura, sem envio.
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function confirmationText(total: number, saved: number): string {
  return `Pedido confirmado! Total: ${formatBRL(total)} (você economizou ${formatBRL(saved)})`;
}
