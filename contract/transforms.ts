export const applyTransforms = (value: any, transforms: string[]): any => {
  let result = value;

  for (const t of transforms) {
    if (!t) continue;
    
    switch (t) {
      case 'upper':
        if (typeof result === 'string') result = result.toUpperCase();
        break;
      case 'lower':
        if (typeof result === 'string') result = result.toLowerCase();
        break;
      case 'number':
        result = Number(result);
        break;
      case 'pct':
        if (typeof result === 'number') result = `${(result * 100).toFixed(0)}%`;
        break;
      case 'json':
        result = JSON.stringify(result, null, 2);
        break;
      default:
        // Handle parameterized transforms like fixed(n)
        if (typeof t === 'string' && t.startsWith('fixed(')) {
          // Fixed: Use optional chaining with bracket access instead of .at(0) to ensure compatibility with RegExpMatchArray.
          const n = parseInt(t.match(/\d+/)?.[0] || '0');
          if (typeof result === 'number') result = result.toFixed(n);
        }
        break;
    }
  }

  return result;
};