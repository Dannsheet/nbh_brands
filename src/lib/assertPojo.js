// src/lib/assertPojo.js
export function isPlainObject(o) {
    if (o === null || typeof o !== 'object') return false;
    const proto = Object.getPrototypeOf(o);
    return proto === Object.prototype || proto === null;
  }
  
  export function assertPojo(value, name = 'value') {
    // arrays of POJO are allowed
    const check = (v) => {
      if (v === null) return true;
      if (Array.isArray(v)) return v.every(check);
      if (typeof v !== 'object') return true;
      if (!isPlainObject(v)) return false;
      // check nested
      return Object.keys(v).every((k) => check(v[k]));
    };
  
    if (!check(value)) {
      // Build a concise diagnostic log with stack trace
      const err = new Error(`[ASSERT_POJO] Non-POJO detected for ${name}`);
      console.error(err.stack);
      try {
        // Attempt safe inspection (truncate large structures)
        const inspected = JSON.stringify(value, (k, v) => {
          if (typeof v === 'function') return `[Function:${v.name || 'anon'}]`;
          if (typeof v === 'object' && v !== null && !isPlainObject(v) && !Array.isArray(v)) {
            // mark special prototype objects
            return { __non_pojo__: true, proto: Object.getPrototypeOf(v)?.constructor?.name || String(Object.getPrototypeOf(v)) };
          }
          return v;
        }, 2);
        console.error(`[ASSERT_POJO] Content snippet for ${name}:`, inspected);
      } catch (e) {
        console.error('[ASSERT_POJO] Could not stringify value:', e);
      }
      // Throw to stop render (optional) — comment if prefieres sólo log
      // throw err;
    }
  }
  