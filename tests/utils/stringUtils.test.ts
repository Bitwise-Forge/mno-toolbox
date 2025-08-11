import { describe, expect, it } from 'vitest';

import { dedent } from '@/utils/stringUtils';

describe('stringUtils', () => {
  describe('dedent', () => {
    it('should handle basic indentation patterns', () => {
      expect(dedent`
        This is a
          multi-line string
            with indentation
      `).toBe('This is a\n  multi-line string\n    with indentation\n');

      expect(dedent`
        No indentation
        on any lines
      `).toBe('No indentation\non any lines\n');

      expect(dedent`
        First line
          Second line
        Third line
            Fourth line
      `).toBe('First line\n  Second line\nThird line\n    Fourth line\n');

      expect(dedent`
        Single line
      `).toBe('Single line\n');
    });

    it('should handle edge cases and special patterns', () => {
      expect(dedent`
        First line

        Third line
      `).toBe('First line\n\nThird line\n');

      expect(dedent`

        Content here

      `).toBe('\nContent here\n\n');

      expect(dedent`
        a
         b
          c
      `).toBe('a\n b\n  c\n');

      expect(dedent`
        First
                    Deep indentation
        Last
      `).toBe('First\n            Deep indentation\nLast\n');
    });

    it('should handle template values correctly', () => {
      expect(dedent`
        Hello ${'World'}!
          Welcome to
            our app
      `).toBe('Hello World!\n  Welcome to\n    our app\n');

      expect(dedent`
        Count: ${42}
        Price: $${19.99}
      `).toBe('Count: 42\nPrice: $19.99\n');

      expect(dedent`
        Active: ${true}
        Enabled: ${false}
      `).toBe('Active: true\nEnabled: false\n');

      expect(dedent`
        ${1}${2}${3}
      `).toBe('123\n');
    });

    it('should handle complex patterns and special characters', () => {
      expect(dedent`
        function example() {
          if (condition) {
            doSomething();
          }
        }
      `).toBe('function example() {\n  if (condition) {\n    doSomething();\n  }\n}\n');

      expect(dedent`
        Path: C:\Users\Name
        Regex: \d+
        Newline: \n
      `).toBe('Path: C:UsersName\nRegex: d+\nNewline: \n\n');
    });

    it('should handle boundary conditions', () => {
      expect(dedent`
      `).toBe('');

      expect(dedent`


      `).toBe('\n\n');
    });

    it('should handle whitespace-only lines that need filtering', () => {
      expect(dedent`
        First line

        Third line
      `).toBe('First line\n  \nThird line\n');

      expect(dedent`
        Content


        More content
      `).toBe('Content\n  \n  \nMore content\n');
    });

    it('should handle completely empty lines in the middle', () => {
      expect(dedent`
        Line 1

        Line 3
      `).toBe('Line 1\n\nLine 3\n');

      expect(dedent`
        Start

        Middle

        End
      `).toBe('Start\n\nMiddle\n\nEnd\n');
    });
  });
});
