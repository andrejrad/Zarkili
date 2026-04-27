export type BookedInterval = {
  startMinutes: number;
  endMinutes: number;
  bufferMinutes: number;
};

export type ProposedInterval = {
  startMinutes: number;
  endMinutes: number;
};

/**
 * Returns true if the proposed interval overlaps with any booked interval.
 *
 * Each booked interval is treated as occupying [startMinutes, endMinutes + bufferMinutes]
 * so that the buffer gap following an existing booking is respected when scheduling
 * the next slot for the same staff member.
 */
export function hasConflict(proposed: ProposedInterval, booked: BookedInterval[]): boolean {
  return booked.some((b) => {
    const effectiveEnd = b.endMinutes + b.bufferMinutes;
    return proposed.startMinutes < effectiveEnd && b.startMinutes < proposed.endMinutes;
  });
}
