export function toUtcDateTimeString(date: Date): string {
  return date.toISOString();
}

export function isBeforeUtcInstant(now: Date, boundary: Date): boolean {
  return now.getTime() < boundary.getTime();
}

export function isAtOrAfterUtcInstant(now: Date, boundary: Date): boolean {
  return now.getTime() >= boundary.getTime();
}

export function isWithinUtcWindow(
  now: Date,
  opensAt?: Date | null,
  closesAt?: Date | null,
): boolean {
  if (opensAt && isBeforeUtcInstant(now, opensAt)) {
    return false;
  }

  if (closesAt && isAtOrAfterUtcInstant(now, closesAt)) {
    return false;
  }

  return true;
}