import { DateTime, Settings } from 'luxon';
import {
  convertToLocalTime,
  createDateTimeFilter,
  formatNullableDateToLocalTime,
  convertDatesToLocalISO,
} from '../date-utils';

describe('Date Utils', () => {
  beforeAll(() => {
    // Set default Locale and Zone
    Settings.defaultLocale = 'zh-TW';
    Settings.defaultZone = 'Asia/Taipei';
  });

  describe('convertToLocalTime', () => {
    it('should convert ISO string to local time in default timezone (ISO format)', () => {
      const dateInput = '2023-10-05T14:48:00.000Z'; // UTC time
      const expected = DateTime.fromISO(dateInput, { zone: 'utc' })
        .setZone('Asia/Taipei')
        .toISO();

      const result = convertToLocalTime(dateInput);
      expect(result).toBe(expected);
    });

    it('should convert ISO string to local time in specified timezone (ISO format)', () => {
      const dateInput = '2023-10-05T14:48:00.000Z';
      const timeZone = 'America/New_York';
      const expected = DateTime.fromISO(dateInput, { zone: 'utc' })
        .setZone(timeZone)
        .toISO();

      const result = convertToLocalTime(dateInput, timeZone);
      expect(result).toBe(expected);
    });

    it('should handle different ISO string formats', () => {
      const dateInput = '2023-12-31T23:59:59Z';
      const expected = DateTime.fromISO(dateInput, { zone: 'utc' })
        .setZone('Asia/Taipei')
        .toISO();

      const result = convertToLocalTime(dateInput);
      expect(result).toBe(expected);
    });

    it('should handle invalid ISO string and return original string', () => {
      const invalidDateInput = 'invalid-date-string';
      const result = convertToLocalTime(invalidDateInput);
      expect(result).toBe(invalidDateInput);
    });

    it('should handle different timezones including daylight saving changes', () => {
      const dateInput = '2023-03-12T07:00:00.000Z';
      const timeZone = 'America/New_York';
      const expected = DateTime.fromISO(dateInput, { zone: 'utc' })
        .setZone(timeZone)
        .toISO();

      const result = convertToLocalTime(dateInput, timeZone);
      expect(result).toBe(expected);
    });

    it('should handle Date object and convert to local time in default timezone', () => {
      const dateInput = new Date('2023-10-05T14:48:00.000Z');
      const expected = DateTime.fromJSDate(dateInput)
        .setZone('Asia/Taipei')
        .toISO();

      const result = convertToLocalTime(dateInput);
      expect(result).toBe(expected);
    });

    it('should handle Date object and convert to local time in specified timezone', () => {
      const dateInput = new Date('2023-10-05T14:48:00.000Z');
      const timeZone = 'America/New_York';
      const expected = DateTime.fromJSDate(dateInput).setZone(timeZone).toISO();

      const result = convertToLocalTime(dateInput, timeZone);
      expect(result).toBe(expected);
    });
  });

  describe('formatNullableDateToLocalTime', () => {
    it('should handle valid Date object and convert to local time string', () => {
      const dateInput = new Date('2023-10-05T14:48:00.000Z');
      const expected = DateTime.fromJSDate(dateInput)
        .setZone('Asia/Taipei')
        .toISO();
      const result = formatNullableDateToLocalTime(dateInput);
      expect(result).toBe(expected);
    });

    it('should return empty string when input is null', () => {
      const result = formatNullableDateToLocalTime(null);
      expect(result).toBe('');
    });
  });

  describe('convertDatesToLocalISO', () => {
    it('should convert Date in object to local ISO string without modifying original object', () => {
      const input = { a: new Date('2023-10-05T14:48:00.000Z') } as const;
      const originalA = input.a;
      const expectedA = convertToLocalTime(originalA);

      const result = convertDatesToLocalISO(input);

      expect(result.a).toBe(expectedA);
      // Should not modify original object
      expect(input.a).toBeInstanceOf(Date);
      expect(input.a).toBe(originalA);
    });

    it('should deeply process Date in arrays and nested objects', () => {
      const input = {
        list: [
          new Date('2023-10-05T14:48:00.000Z'),
          { b: new Date('2024-02-29T00:00:00.000Z') },
        ],
      };

      const result = convertDatesToLocalISO(input);

      expect(result.list[0]).toBe(
        convertToLocalTime(input.list[0] as unknown as Date),
      );
      const nested = input.list[1] as { b: Date };
      expect((result.list[1] as any).b).toBe(convertToLocalTime(nested.b));
    });

    it('should not try to parse date patterns in strings, strings should remain unchanged', () => {
      const input = { s: '2023-12-31T23:59:59Z' };
      const result = convertDatesToLocalISO(input);
      expect(result.s).toBe('2023-12-31T23:59:59Z');
    });

    it('should preserve Map/Set as is', () => {
      const m = new Map<string, any>([
        ['d', new Date('2023-10-05T14:48:00.000Z')],
      ]);
      const s = new Set<any>([new Date('2024-01-01T00:00:00.000Z')]);
      const input = { m, s };
      const result = convertDatesToLocalISO(input);
      expect(result.m).toBe(m);
      expect(result.s).toBe(s);
    });

    it('should handle null and undefined and keep them unchanged', () => {
      const input = { a: null as null | Date, b: undefined as any };
      const result = convertDatesToLocalISO(input);
      expect(result.a).toBeNull();
      expect(result.b).toBeUndefined();
    });

    it('should properly handle circular references (self reference in result)', () => {
      const input: any = {};
      input.self = input;
      input.d = new Date('2023-10-05T14:48:00.000Z');

      const result: any = convertDatesToLocalISO(input);

      expect(result.self).toBe(result);
      expect(result.d).toBe(convertToLocalTime(input.d));
    });

    it('should support timezone parameter', () => {
      const timeZone = 'America/New_York';
      const input = { a: new Date('2023-10-05T14:48:00.000Z') };
      const result = convertDatesToLocalISO(input, timeZone);
      expect(result.a).toBe(convertToLocalTime(input.a, timeZone));
    });
  });

  describe('createDateTimeFilter', () => {
    it('should return undefined when no ISO string is provided', () => {
      const result = createDateTimeFilter();
      expect(result).toBeUndefined();
    });

    it('should convert valid ISO string to { gte: Date } object (without day range)', () => {
      const isoString = '2023-10-05T14:48:00.000Z';
      const parsedDate = DateTime.fromISO(isoString, {
        zone: 'utc',
      }).toJSDate();

      const result = createDateTimeFilter(isoString);
      expect(result).toEqual({ gte: parsedDate });
    });

    it('should handle different ISO string formats (without day range)', () => {
      const isoString = '2023-12-31T23:59:59Z';
      const parsedDate = DateTime.fromISO(isoString, {
        zone: 'utc',
      }).toJSDate();

      const result = createDateTimeFilter(isoString);
      expect(result).toEqual({ gte: parsedDate });
    });

    it('should throw error when invalid ISO string is provided', () => {
      const invalidIsoString = 'invalid-date-string';
      expect(() => createDateTimeFilter(invalidIsoString)).toThrow(
        `Invalid date format: ${invalidIsoString}`,
      );
    });

    it('should handle edge cases like leap year dates (without day range)', () => {
      const isoString = '2024-02-29T12:00:00Z';
      const parsedDate = DateTime.fromISO(isoString, {
        zone: 'utc',
      }).toJSDate();

      const result = createDateTimeFilter(isoString);
      expect(result).toEqual({ gte: parsedDate });
    });

    it('should return { gte: Date, lt: Date } object for day range when useDayRange is true', () => {
      const isoString = '2023-10-05T14:48:00.000Z';
      const parsedDate = DateTime.fromISO(isoString, { zone: 'utc' });
      const startOfDay = parsedDate.startOf('day').toJSDate();
      const endOfDay = parsedDate.startOf('day').plus({ days: 1 }).toJSDate();
      const result = createDateTimeFilter(isoString, true);
      expect(result).toEqual({ gte: startOfDay, lt: endOfDay });
    });

    it('should handle leap year dates when useDayRange is true', () => {
      const isoString = '2024-02-29T12:00:00Z';
      const parsedDate = DateTime.fromISO(isoString, { zone: 'utc' });
      const startOfDay = parsedDate.startOf('day').toJSDate();
      const endOfDay = parsedDate.startOf('day').plus({ days: 1 }).toJSDate();
      const result = createDateTimeFilter(isoString, true);
      expect(result).toEqual({ gte: startOfDay, lt: endOfDay });
    });
  });
});
