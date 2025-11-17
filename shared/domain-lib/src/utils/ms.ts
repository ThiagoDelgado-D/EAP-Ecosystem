export function ms(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
