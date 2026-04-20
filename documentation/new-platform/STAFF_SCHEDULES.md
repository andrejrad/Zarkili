# Staff Schedules Domain (Week 3.3)

## Purpose
Staff schedules domain stores reusable week templates and date-specific exceptions for staff availability per tenant and location.

## Model summary
Current model is defined in src/domains/staff/staffSchedulesModel.ts.

Core fields:
- scheduleId
- tenantId
- staffId
- locationId
- weekTemplate
- exceptions
- updatedAt

Week template:
- day keys: mon, tue, wed, thu, fri, sat, sun
- each day contains a list of time blocks with start/end in HH:mm format

Exceptions:
- date (YYYY-MM-DD)
- blocks (HH:mm ranges)
- isClosed (boolean)
- note (string or null)

## Repository API
Implemented in src/domains/staff/staffSchedulesRepository.ts.

- upsertScheduleTemplate(input)
  - validates template and exceptions
  - creates or updates a schedule template
- getScheduleTemplate(tenantId, staffId, locationId)
  - returns template or null
- addException(scheduleId, exception)
  - validates exception and appends it
  - rejects duplicate exception date
- removeException(scheduleId, date)
  - removes existing date exception

## Overlap and range validation
- Time values must use HH:mm and valid clock ranges.
- Each time block must satisfy end > start.
- Week template blocks for a day cannot overlap.
- Exception blocks for a date cannot overlap.
- Date values must use YYYY-MM-DD.

## Tests
- src/domains/staff/__tests__/staffSchedulesRepository.test.ts
  - upsert/get behavior
  - malformed range rejection
  - overlap detection for week templates
  - overlap detection for exceptions
  - add/remove exception behavior

## Known limitations and follow-up
- Overnight spans are not yet supported (for example 22:00-02:00).
- Timezone-aware normalization is deferred to scheduling engine milestones.
- Recurring exception series support is out of current scope.
