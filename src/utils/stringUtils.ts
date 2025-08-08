export const dedent = (str: TemplateStringsArray, ...values: unknown[]) => {
  const raw = String.raw({ raw: str }, ...values);
  const lines = raw.replace(/^\n/, '').split('\n');
  const minIndent = Math.min(...lines.filter(l => l.trim()).map(l => /^ */.exec(l)?.[0]?.length ?? 0));
  return lines.map(l => l.slice(minIndent)).join('\n');
};
