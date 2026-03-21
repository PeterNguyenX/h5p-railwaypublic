const {
  parseTranscript,
  parseTimestamp,
  detectFormat,
  mergeSegments
} = require('./transcriptParser');

describe('transcriptParser', () => {
  test('parses SRT transcript into segments', () => {
    const srt = [
      '1',
      '00:00:01,000 --> 00:00:03,500',
      'Hello world',
      '',
      '2',
      '00:00:05,000 --> 00:00:07,000',
      'Second line'
    ].join('\n');

    const result = parseTranscript(srt, 'srt');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ start: 1, end: 3.5, text: 'Hello world' });
    expect(result[1]).toEqual({ start: 5, end: 7, text: 'Second line' });
  });

  test('parses VTT transcript into segments', () => {
    const vtt = [
      'WEBVTT',
      '',
      '00:00:01.000 --> 00:00:03.000',
      'Intro text',
      '',
      '00:00:10.500 --> 00:00:12.000',
      'Concept explained'
    ].join('\n');

    const result = parseTranscript(vtt, 'vtt');

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Intro text');
    expect(result[1].start).toBe(10.5);
  });

  test('auto-detects transcript format', () => {
    expect(detectFormat('WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nA')).toBe('vtt');
    expect(detectFormat('1\n00:00:01,000 --> 00:00:02,000\nA')).toBe('srt');
  });

  test('parses timestamps across supported formats', () => {
    expect(parseTimestamp('00:00:10,500')).toBe(10.5);
    expect(parseTimestamp('00:00:10.500')).toBe(10.5);
    expect(parseTimestamp('01:02:03.000')).toBe(3723);
    expect(parseTimestamp('02:30.000')).toBe(150);
  });

  test('merges nearby segments when gap is small', () => {
    const merged = mergeSegments([
      { start: 0, end: 1, text: 'A' },
      { start: 2, end: 3, text: 'B' },
      { start: 10, end: 11, text: 'C' }
    ], 1);

    expect(merged).toEqual([
      { start: 0, end: 3, text: 'A B' },
      { start: 10, end: 11, text: 'C' }
    ]);
  });
});
