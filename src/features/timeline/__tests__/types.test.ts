import {
  createInitialState,
  parseTimelineContent,
  TimelineEvent,
} from '../types/timeline.types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal valid TimelineEvent. */
function makeEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return { text: 'Signed for Arsenal', year: 1999, ...overrides };
}

/** Build an array of exactly 6 valid TimelineEvents. */
function makeEvents(overrides: Partial<TimelineEvent>[] = []): TimelineEvent[] {
  const base: TimelineEvent[] = [
    { text: 'Born in Paris', year: 1979 },
    { text: 'Joined Monaco youth academy', year: 1994 },
    { text: 'Signed for Arsenal', year: 1999 },
    { text: 'Won the Invincibles season', year: 2004 },
    { text: 'Moved to Barcelona', year: 2008 },
    { text: 'Retired', year: 2019 },
  ];
  overrides.forEach((o, i) => {
    if (i < base.length) base[i] = { ...base[i], ...o };
  });
  return base;
}

/** Build a raw object that represents valid TimelineContent. */
function makeRawContent(overrides: Record<string, unknown> = {}): unknown {
  return {
    events: makeEvents(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
  const events = makeEvents();

  it('sets eventOrder to the provided events', () => {
    const state = createInitialState(events);
    expect(state.eventOrder).toBe(events);
  });

  it('initializes lockedIndices as an empty Set', () => {
    const state = createInitialState(events);
    expect(state.lockedIndices).toBeInstanceOf(Set);
    expect(state.lockedIndices.size).toBe(0);
  });

  it('initializes attemptCount to 0', () => {
    const state = createInitialState(events);
    expect(state.attemptCount).toBe(0);
  });

  it('initializes firstAttemptResults as an empty array', () => {
    const state = createInitialState(events);
    expect(state.firstAttemptResults).toEqual([]);
  });

  it('initializes lastAttemptResults as an empty array', () => {
    const state = createInitialState(events);
    expect(state.lastAttemptResults).toEqual([]);
  });

  it('initializes revealPhase as "idle"', () => {
    const state = createInitialState(events);
    expect(state.revealPhase).toBe('idle');
  });

  it('initializes gameStatus as "playing"', () => {
    const state = createInitialState(events);
    expect(state.gameStatus).toBe('playing');
  });

  it('initializes attemptId to null', () => {
    const state = createInitialState(events);
    expect(state.attemptId).toBeNull();
  });

  it('initializes startedAt to null', () => {
    const state = createInitialState(events);
    expect(state.startedAt).toBeNull();
  });

  it('initializes score to null', () => {
    const state = createInitialState(events);
    expect(state.score).toBeNull();
  });

  it('initializes attemptSaved as false', () => {
    const state = createInitialState(events);
    expect(state.attemptSaved).toBe(false);
  });

  it('returns independent state objects for each call', () => {
    const stateA = createInitialState(events);
    const stateB = createInitialState(events);
    stateA.lockedIndices.add(0);
    expect(stateB.lockedIndices.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseTimelineContent
// ---------------------------------------------------------------------------

describe('parseTimelineContent', () => {
  describe('valid input', () => {
    it('parses valid content with 6 events', () => {
      const raw = makeRawContent();
      const result = parseTimelineContent(raw);
      expect(result).not.toBeNull();
      expect(result!.events).toHaveLength(6);
    });

    it('returns events with the correct text and year values', () => {
      const raw = makeRawContent();
      const result = parseTimelineContent(raw);
      expect(result!.events[0]).toMatchObject({ text: 'Born in Paris', year: 1979 });
    });

    it('parses content with title and subject', () => {
      const raw = makeRawContent({ title: 'Thierry Henry Career', subject: 'Thierry Henry', subject_id: 'Q12345' });
      const result = parseTimelineContent(raw);
      expect(result!.title).toBe('Thierry Henry Career');
      expect(result!.subject).toBe('Thierry Henry');
      expect(result!.subject_id).toBe('Q12345');
    });

    it('parses content with optional month field on events', () => {
      const eventsWithMonth = makeEvents([{ text: 'Born in Paris', year: 1979, month: 8 }]);
      const raw = { events: eventsWithMonth };
      const result = parseTimelineContent(raw);
      expect(result).not.toBeNull();
      expect(result!.events[0].month).toBe(8);
    });

    it('allows month values across the full valid range 1–12', () => {
      for (const month of [1, 6, 12]) {
        const eventsWithMonth = makeEvents([{ text: 'Born in Paris', year: 1979, month }]);
        const raw = { events: eventsWithMonth };
        expect(parseTimelineContent(raw)).not.toBeNull();
      }
    });

    it('handles missing optional top-level fields (title, subject, subject_id)', () => {
      const raw = makeRawContent();
      const result = parseTimelineContent(raw);
      expect(result!.title).toBeUndefined();
      expect(result!.subject).toBeUndefined();
      expect(result!.subject_id).toBeUndefined();
    });

    it('treats empty string title as absent (returns undefined)', () => {
      const raw = makeRawContent({ title: '' });
      const result = parseTimelineContent(raw);
      expect(result!.title).toBeUndefined();
    });

    it('treats empty string subject as absent (returns undefined)', () => {
      const raw = makeRawContent({ subject: '' });
      const result = parseTimelineContent(raw);
      expect(result!.subject).toBeUndefined();
    });

    it('accepts subject_id as an empty string', () => {
      const raw = makeRawContent({ subject_id: '' });
      const result = parseTimelineContent(raw);
      expect(result!.subject_id).toBe('');
    });

    it('ignores unknown extra properties at the top level', () => {
      const raw = makeRawContent({ unknownField: 42 });
      expect(parseTimelineContent(raw)).not.toBeNull();
    });
  });

  describe('null and non-object input', () => {
    it('returns null for null input', () => {
      expect(parseTimelineContent(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(parseTimelineContent(undefined)).toBeNull();
    });

    it('returns null for a string input', () => {
      expect(parseTimelineContent('{"events":[]}')).toBeNull();
    });

    it('returns null for a number input', () => {
      expect(parseTimelineContent(42)).toBeNull();
    });

    it('returns null for a boolean input', () => {
      expect(parseTimelineContent(true)).toBeNull();
    });

    it('returns null for an array input', () => {
      expect(parseTimelineContent([])).toBeNull();
    });
  });

  describe('missing or invalid events property', () => {
    it('returns null when events property is absent', () => {
      expect(parseTimelineContent({})).toBeNull();
    });

    it('returns null when events is null', () => {
      expect(parseTimelineContent({ events: null })).toBeNull();
    });

    it('returns null when events is not an array', () => {
      expect(parseTimelineContent({ events: 'not-an-array' })).toBeNull();
      expect(parseTimelineContent({ events: 42 })).toBeNull();
      expect(parseTimelineContent({ events: {} })).toBeNull();
    });

    it('returns null for events array shorter than 6', () => {
      const raw = { events: makeEvents().slice(0, 5) };
      expect(parseTimelineContent(raw)).toBeNull();
    });

    it('returns null for events array longer than 6', () => {
      const extra = [...makeEvents(), makeEvent()];
      expect(parseTimelineContent({ events: extra })).toBeNull();
    });

    it('returns null for an empty events array', () => {
      expect(parseTimelineContent({ events: [] })).toBeNull();
    });
  });

  describe('invalid individual events', () => {
    it('returns null for an event that is not an object', () => {
      const events = makeEvents();
      (events as unknown[])[0] = 'not-an-object';
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for an event that is null', () => {
      const events = makeEvents();
      (events as unknown[])[0] = null;
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for an event missing the text field', () => {
      const events = makeEvents();
      const { text: _text, ...noText } = events[0];
      (events as unknown[])[0] = noText;
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for an event with empty text', () => {
      const events = makeEvents([{ text: '' }]);
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for an event with non-string text', () => {
      const events = makeEvents();
      (events[0] as unknown as Record<string, unknown>).text = 123;
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for an event missing the year field', () => {
      const events = makeEvents();
      const { year: _year, ...noYear } = events[0];
      (events as unknown[])[0] = noYear;
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for an event with a non-number year', () => {
      const events = makeEvents([{ year: '1999' as unknown as number }]);
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for an event with a float year', () => {
      const events = makeEvents([{ year: 1999.5 }]);
      expect(parseTimelineContent({ events })).toBeNull();
    });
  });

  describe('invalid optional month field', () => {
    it('returns null for month of 0 (below valid range)', () => {
      const events = makeEvents([{ month: 0 }]);
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for month of 13 (above valid range)', () => {
      const events = makeEvents([{ month: 13 }]);
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for a non-integer month', () => {
      const events = makeEvents([{ month: 6.5 }]);
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('returns null for a string month', () => {
      const events = makeEvents();
      (events[0] as unknown as Record<string, unknown>).month = 'June';
      expect(parseTimelineContent({ events })).toBeNull();
    });

    it('accepts null month (treated as absent)', () => {
      const events = makeEvents();
      (events[0] as unknown as Record<string, unknown>).month = null;
      expect(parseTimelineContent({ events })).not.toBeNull();
    });

    it('accepts undefined month (treated as absent)', () => {
      const events = makeEvents();
      (events[0] as unknown as Record<string, unknown>).month = undefined;
      expect(parseTimelineContent({ events })).not.toBeNull();
    });
  });
});
