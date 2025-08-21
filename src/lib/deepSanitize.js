// src/lib/deepSanitize.js
function isPrimitive(v) {
    return v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
  }
  
  export function deepSanitize(value) {
    // primitives
    if (isPrimitive(value)) return value;
  
    // Dates -> ISO
    if (value instanceof Date) return value.toISOString();
  
    // BigInt -> Number (cuidado con overflow)
    if (typeof value === 'bigint') return Number(value);
  
    // Arrays -> map
    if (Array.isArray(value)) return value.map(deepSanitize);
  
    // If has toJSON, call it and sanitize result
    if (value && typeof value.toJSON === 'function') {
      try {
        return deepSanitize(value.toJSON());
      } catch (e) {
        // fallthrough
      }
    }
  
    // Plain object? copy own enumerable properties
    const proto = Object.getPrototypeOf(value);
    if (proto === Object.prototype || proto === null) {
      const out = {};
      for (const k of Object.keys(value)) {
        out[k] = deepSanitize(value[k]);
      }
      return out;
    }
  
    // Fallback: convert to plain object by copying enumerable props
    const out = {};
    for (const k of Object.keys(value || {})) {
      out[k] = deepSanitize(value[k]);
    }
    // Mark that it was sanitized from a special type (optional)
    out.__sanitized_from__ = (proto && proto.constructor && proto.constructor.name) || String(proto);
    return out;
  }
  