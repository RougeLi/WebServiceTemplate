import { DateTime, Settings } from 'luxon';
import { BadRequestError } from 'src/core/server';
import { ReplaceDateWithString } from 'src/core/types';

// Set default locale to Traditional Chinese
Settings.defaultLocale = 'zh-TW';

// Set default timezone to Asia/Taipei
Settings.defaultZone = 'Asia/Taipei';

/** Convert ISO string to local Taiwan time (ISO format) */
export function convertToLocalTime(
  dateInput: Date | string,
  timeZone?: string,
): string {
  let dateTime: DateTime =
    dateInput instanceof Date
      ? DateTime.fromJSDate(dateInput)
      : DateTime.fromISO(dateInput);
  if (timeZone) {
    dateTime = dateTime.setZone(timeZone);
  }
  return <string>dateTime.toISO() ?? dateInput;
}

/** Convert nullable date from database to local Taiwan time */
export function formatNullableDateToLocalTime(dateInput: Date | null): string {
  return dateInput ? convertToLocalTime(dateInput) : '';
}

/** Create date time filter using UTC time for database queries */
export function createDateTimeFilter(
  isoString?: string,
  useDayRange: boolean = false,
): undefined | { gte: Date; lt?: Date } {
  if (!isoString) {
    return undefined;
  }

  const parsedDate = DateTime.fromISO(isoString, { zone: 'utc' });
  if (!parsedDate.isValid) {
    throw new BadRequestError(`Invalid date format: ${isoString}`);
  }

  if (useDayRange) {
    const startOfDay = parsedDate.startOf('day');
    const endOfDay = startOfDay.plus({ days: 1 });
    return {
      gte: startOfDay.toJSDate(),
      lt: endOfDay.toJSDate(),
    };
  } else {
    return {
      gte: parsedDate.toJSDate(),
    };
  }
}

/**
 * Deep traverse any value and convert all Date objects to local time ISO strings.
 * - Only converts Date objects (will not try to parse strings)
 * - Keeps other types unchanged
 * - Does not modify original object, returns new instance
 *
 * Example: convertDatesToLocalISO({ createdAt: new Date() }) => { createdAt: '2025-01-01T12:00:00.000+08:00' }
 */
export function convertDatesToLocalISO<T>(
  value: T,
  timeZone?: string,
): ReplaceDateWithString<T> {
  const visitedObjects = new WeakMap<object, any>();

  const traverse = (currentValue: any): any => {
    if (currentValue === null || currentValue === undefined)
      return currentValue;

    // Only process Date objects
    if (currentValue instanceof Date) {
      return convertToLocalTime(currentValue, timeZone);
    }

    // Return primitive types directly
    const valueType = typeof currentValue;
    if (valueType !== 'object') return currentValue;

    // Avoid circular references
    if (visitedObjects.has(currentValue))
      return visitedObjects.get(currentValue);

    // Array
    if (Array.isArray(currentValue)) {
      const resultArray = currentValue.map(traverse);
      visitedObjects.set(currentValue, resultArray);
      return resultArray;
    }

    // Map / Set can be extended as needed; keep as is here (can be expanded manually)
    if (currentValue instanceof Map || currentValue instanceof Set) {
      return currentValue;
    }

    // Regular object: shallow copy + recursive property handling
    const resultObject: Record<string, any> = {};
    visitedObjects.set(currentValue, resultObject);

    // Only process enumerable own properties
    for (const propKey of Object.keys(currentValue)) {
      resultObject[propKey] = traverse(currentValue[propKey]);
    }

    return resultObject;
  };

  return traverse(value) as ReplaceDateWithString<T>;
}
