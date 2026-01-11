import { describe, expect, it } from 'vitest';
import { get, set, MAX_ARRAY_INDEX } from '@/utils/objectPath';
describe('objectPath', () => {
  describe('get', () => {
    it('returns the object itself for empty path', () => {
      const obj = { a: 1 };
      expect(get(obj, '')).toBe(obj);
      expect(get(obj, '.')).toBe(obj);
    });
    it('gets nested values with dot notation', () => {
      const obj = { a: { b: { c: 42 } } };
      expect(get(obj, 'a.b.c')).toBe(42);
      expect(get(obj, 'a.b')).toEqual({ c: 42 });
    });
    it('gets array elements with bracket notation', () => {
      const obj = { items: ['a', 'b', 'c'] };
      expect(get(obj, 'items[0]')).toBe('a');
      expect(get(obj, 'items[2]')).toBe('c');
    });
    it('gets array elements with dot notation', () => {
      const obj = { items: ['a', 'b', 'c'] };
      expect(get(obj, 'items.0')).toBe('a');
      expect(get(obj, 'items.1')).toBe('b');
    });
    it('handles nested arrays', () => {
      const obj = {
        matrix: [
          [1, 2],
          [3, 4],
        ],
      };
      expect(get(obj, 'matrix[0][1]')).toBe(2);
      expect(get(obj, 'matrix[1][0]')).toBe(3);
    });
    it('returns default value for non-existent paths', () => {
      const obj = { a: 1 };
      expect(get(obj, 'b', 'default')).toBe('default');
      expect(get(obj, 'a.b.c', 42)).toBe(42);
    });
    it('returns default value for out of bounds array access', () => {
      const obj = { items: [1, 2, 3] };
      expect(get(obj, 'items[5]', 'missing')).toBe('missing');
      expect(get(obj, 'items[-1]', 'missing')).toBe('missing');
    });
    it('returns default value when traversing null/undefined', () => {
      const obj = { a: null } as Record<string, unknown>;
      expect(get(obj, 'a.b', 'default')).toBe('default');
    });
    it('returns undefined when no default provided', () => {
      const obj = { a: 1 };
      expect(get(obj, 'b')).toBeUndefined();
    });
    it('handles deep nesting paths', () => {
      const obj = {
        a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: 99 } } } } } } } } } },
      };
      expect(get(obj, 'a.b.c.d.e.f.g.h.i.j.k')).toBe(99);
    });
    it('handles unicode keys', () => {
      const obj = { ключ: { значение: 7 } } as Record<string, unknown>;
      expect(get(obj, 'ключ.значение')).toBe(7);
    });
    it('treats dots as path separators, not literal keys', () => {
      const obj = { 'a.b': 1 } as Record<string, unknown>;
      expect(get(obj, 'a.b', 'missing')).toBe('missing');
    });
    it('treats trailing dot as no-op for the last segment', () => {
      const obj = { a: { '': 1 } } as Record<string, unknown>;
      expect(get(obj, 'a.')).toEqual({ '': 1 });
    });
  });
  describe('set', () => {
    it('sets simple nested values', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'a.b.c', 42);
      expect(obj).toEqual({ a: { b: { c: 42 } } });
    });
    it('creates arrays for numeric indices', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'items[0]', 'first');
      expect(obj).toEqual({ items: ['first'] });
    });
    it('handles mixed object and array paths', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'users[0].name', 'John');
      expect(obj).toEqual({ users: [{ name: 'John' }] });
    });
    it('creates sparse arrays for large indices', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'items[5]', 'value');
      expect(obj.items).toBeInstanceOf(Array);
      expect((obj.items as unknown[])[5]).toBe('value');
      expect((obj.items as unknown[]).length).toBe(6);
    });
    it('overwrites existing values', () => {
      const obj = { a: { b: 1 } };
      set(obj, 'a.b', 2);
      expect(obj.a.b).toBe(2);
    });
    it('uses Object.assign for root path', () => {
      const obj = { a: 1 } as Record<string, unknown>;
      set(obj, '.', { b: 2 });
      expect(obj).toEqual({ a: 1, b: 2 });
    });
    it('uses Object.assign for empty path', () => {
      const obj = { a: 1 } as Record<string, unknown>;
      set(obj, '', { b: 2 });
      expect(obj).toEqual({ a: 1, b: 2 });
    });
    it('throws for invalid root path assignment', () => {
      const obj = {} as Record<string, unknown>;
      expect(() => set(obj, '.', 'not an object')).toThrow(TypeError);
      expect(() => set(obj, '.', null)).toThrow(TypeError);
      expect(() => set(obj, '.', [1, 2, 3])).toThrow(TypeError);
    });
    it('throws when trying to traverse through a primitive', () => {
      const obj = { a: 'string' } as Record<string, unknown>;
      expect(() => set(obj, 'a.b', 1)).toThrow(TypeError);
    });
    it('throws for type mismatch (object vs array)', () => {
      const obj = { items: { id: 1 } } as Record<string, unknown>;
      expect(() => set(obj, 'items[0]', 'value')).toThrow(TypeError);
    });
    it('throws for type mismatch (array vs object)', () => {
      const obj = { items: [1, 2, 3] } as Record<string, unknown>;
      expect(() => set(obj, 'items.name', 'value')).toThrow(TypeError);
    });
    it('handles deep nesting paths', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'a.b.c.d.e.f.g.h.i.j.k', 'deep');
      expect(get(obj, 'a.b.c.d.e.f.g.h.i.j.k')).toBe('deep');
    });
    it('treats trailing dot as no-op for the last segment', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'a.', 3);
      expect(obj).toEqual({ a: 3 });
    });
    it('treats unmatched brackets as literal characters', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'config[weird]', 'value');
      expect(obj['config[weird]']).toBe('value');
    });
    it('throws for array index exceeding MAX_ARRAY_INDEX', () => {
      const obj: Record<string, unknown> = {};
      const largeIndex = MAX_ARRAY_INDEX + 1;
      expect(() => set(obj, `items[${largeIndex}]`, 'big')).toThrow(RangeError);
      expect(() => set(obj, `items[${largeIndex}]`, 'big')).toThrow(/exceeds maximum/);
    });
    it('allows overriding maxArrayIndex via options', () => {
      const obj: Record<string, unknown> = {};
      set(obj, 'items[50000]', 'value', { maxArrayIndex: 100_000 });
      expect((obj.items as unknown[])[50000]).toBe('value');
    });
    it('creates sparse array up to MAX_ARRAY_INDEX', () => {
      const obj: Record<string, unknown> = {};
      set(obj, `items[${MAX_ARRAY_INDEX}]`, 'max');
      const items = obj.items as unknown[];
      expect(items[MAX_ARRAY_INDEX]).toBe('max');
      expect(items.length).toBe(MAX_ARRAY_INDEX + 1);
    });
  });
  describe('parsePath edge cases', () => {
    it('throws for quoted bracket keys', () => {
      const obj = {} as Record<string, unknown>;
      expect(() => get(obj, 'items["key"]')).toThrow(/quoted bracket keys/);
      expect(() => get(obj, "items['key']")).toThrow(/quoted bracket keys/);
    });
    it('throws for consecutive dots', () => {
      const obj = {} as Record<string, unknown>;
      expect(() => get(obj, 'a..b')).toThrow(/consecutive dots/);
      expect(() => set(obj, 'a..b', 1)).toThrow(/consecutive dots/);
    });
    it('rejects quoted keys with dots or unicode', () => {
      const obj = {} as Record<string, unknown>;
      expect(() => get(obj, 'items["a.b"]')).toThrow(/quoted bracket keys/);
      expect(() => set(obj, "items['ключ']", 1)).toThrow(/quoted bracket keys/);
    });
  });
  describe('prototype pollution prevention', () => {
    it('rejects __proto__ in path', () => {
      const obj = {} as Record<string, unknown>;
      expect(() => set(obj, '__proto__.polluted', 'yes')).toThrow(/Dangerous key/);
      expect(() => set(obj, 'a.__proto__.polluted', 'yes')).toThrow(/Dangerous key/);
    });
    it('rejects constructor in path', () => {
      const obj = {} as Record<string, unknown>;
      expect(() => set(obj, 'constructor.prototype.polluted', 'yes')).toThrow(/Dangerous key/);
    });
    it('rejects prototype in path', () => {
      const obj = {} as Record<string, unknown>;
      expect(() => set(obj, 'prototype.polluted', 'yes')).toThrow(/Dangerous key/);
    });
    it('rejects dangerous keys in root path assignment', () => {
      const obj = {} as Record<string, unknown>;
      const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
      expect(() => set(obj, '.', malicious)).toThrow(/Dangerous key/);
    });
    it('does not pollute Object.prototype via __proto__', () => {
      const obj = {} as Record<string, unknown>;
      try {
        set(obj, '__proto__.polluted', 'yes');
      } catch {
        // Expected to throw
      }
      expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    });
    it('does not pollute Object.prototype via constructor', () => {
      const obj = {} as Record<string, unknown>;
      try {
        set(obj, 'constructor.prototype.polluted', 'yes');
      } catch {
        // Expected to throw
      }
      expect(({} as Record<string, unknown>)['polluted']).toBeUndefined();
    });
    it('allows legitimate keys that contain dangerous substrings', () => {
      const obj = {} as Record<string, unknown>;
      set(obj, 'my__proto__key', 'value');
      expect(obj['my__proto__key']).toBe('value');
      set(obj, 'constructorName', 'MyClass');
      expect(obj['constructorName']).toBe('MyClass');
    });
  });
});
