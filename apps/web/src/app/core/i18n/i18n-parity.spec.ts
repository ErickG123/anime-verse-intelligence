import ptBR from '../../../../public/i18n/pt-BR.json';
import en from '../../../../public/i18n/en.json';

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

describe('i18n pt-BR / en parity', () => {
  it('maintains 100% key parity between pt-BR and en translation bundles', () => {
    const ptKeys = flattenKeys(ptBR as Record<string, unknown>);
    const enKeys = flattenKeys(en as Record<string, unknown>);
    expect(ptKeys).toEqual(enKeys);
    expect(ptKeys.length).toBeGreaterThan(40);
  });
});
