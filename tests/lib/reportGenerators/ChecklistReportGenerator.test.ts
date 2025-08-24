import {
  mockAllChecklistsData,
  mockAllMissingData,
  mockChecklistReportData,
  mockEmptyChecklistData,
  mockLargeData,
  mockSingleMemberData,
  mockSpecialCharactersData,
  mockUnicodeData,
  mockZeroChecklistsData,
} from '~/mocks/checklistReport';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ChecklistReportGenerator from '@/lib/reportGenerators/ChecklistReportGenerator';

describe('ChecklistReportGenerator', () => {
  let generator: ChecklistReportGenerator;

  beforeEach(() => {
    vi.setSystemTime(new Date('2024-12-25T10:30:00.000Z'));
    generator = new ChecklistReportGenerator(mockChecklistReportData);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should initialize with report data', () => {
      expect(generator).toBeInstanceOf(ChecklistReportGenerator);
    });
  });

  describe('membersSubReport', () => {
    it('should generate correct members sub-report with percentages', () => {
      const report = generator.report;

      expect(report).toContain('Total Members: 5');
      expect(report).toContain('Weekly Checklists Created: 15 (300%)');
      expect(report).toContain('Weekly Checklists Missing: 2 (40%)');
    });

    it('should handle zero members', () => {
      const zeroGenerator = new ChecklistReportGenerator(mockEmptyChecklistData);
      expect(() => zeroGenerator.report).toThrow();
    });

    it('should handle zero checklists', () => {
      const zeroGenerator = new ChecklistReportGenerator(mockZeroChecklistsData);
      const report = zeroGenerator.report;

      expect(report).toContain('Total Members: 3');
      expect(report).toContain('Weekly Checklists Created: 0 (0%)');
      expect(report).toContain('Weekly Checklists Missing: 3 (100%)');
    });

    it('should handle all members having checklists', () => {
      const allGenerator = new ChecklistReportGenerator(mockAllChecklistsData);
      const report = allGenerator.report;

      expect(report).toContain('Total Members: 3');
      expect(report).toContain('Weekly Checklists Created: 3 (100%)');
      expect(report).toContain('Weekly Checklists Missing: 0 (0%)');
    });
  });

  describe('report', () => {
    it('should generate main report with correct format', () => {
      const report = generator.report;

      expect(report).toContain('📣 Weekly Checklist Report');

      expect(report).toContain('--------------------------------');

      expect(report).toContain('Total Members: 5');
      expect(report).toContain('Weekly Checklists Created: 15 (300%)');
      expect(report).toContain('Weekly Checklists Missing: 2 (40%)');
    });

    it('should use dedent for proper formatting', () => {
      const report = generator.report;

      expect(report).toContain('\n');
      expect(report).not.toMatch(/\s+$/);
      expect(report.trim()).toBeTruthy();
    });

    it('should generate report with current system time', () => {
      const report = generator.report;

      expect(report).toContain('📣 Weekly Checklist Report');
      expect(report).toContain('05:30 AM');
    });

    it('should generate report with different system times', () => {
      vi.setSystemTime(new Date('2024-06-15T14:45:00.000Z'));
      const differentGenerator = new ChecklistReportGenerator(mockChecklistReportData);
      const report = differentGenerator.report;

      expect(report).toContain('📣 Weekly Checklist Report');
      vi.setSystemTime(new Date('2024-12-25T10:30:00.000Z'));
    });
  });

  describe('unblindedReport', () => {
    it('should generate unblinded report with all data', () => {
      const report = generator.unblindedReport;

      expect(report).toContain('🔍 Unblinded Data:');
      expect(report).toContain('--------------------------------');
      expect(report).toContain('Members List:');
      expect(report).toContain('John Doe, Jane Smith, Bob Johnson, Alice Brown, Charlie Wilson');
      expect(report).toContain('Checklist Submitters:');
      expect(report).toContain('John Doe, Jane Smith, Bob Johnson');
      expect(report).toContain('Missing Checklists:');
      expect(report).toContain('Alice Brown, Charlie Wilson');
    });

    it('should handle empty members list', () => {
      const emptyGenerator = new ChecklistReportGenerator(mockEmptyChecklistData);
      const report = emptyGenerator.unblindedReport;

      expect(report).toContain('Members List:');
      expect(report).toContain('None');
      expect(report).toContain('Checklist Submitters:');
      expect(report).toContain('None');
      expect(report).toContain('Missing Checklists:');
      expect(report).toContain('None');
    });

    it('should handle single member', () => {
      const singleGenerator = new ChecklistReportGenerator(mockSingleMemberData);
      const report = singleGenerator.unblindedReport;

      expect(report).toContain('Members List:');
      expect(report).toContain('John Doe');
      expect(report).toContain('Checklist Submitters:');
      expect(report).toContain('John Doe');
      expect(report).toContain('Missing Checklists:');
      expect(report).toContain('None');
    });

    it('should handle all members missing checklists', () => {
      const allMissingGenerator = new ChecklistReportGenerator(mockAllMissingData);
      const report = allMissingGenerator.unblindedReport;

      expect(report).toContain('Members List:');
      expect(report).toContain('John Doe, Jane Smith, Bob Johnson');
      expect(report).toContain('Checklist Submitters:');
      expect(report).toContain('None');
      expect(report).toContain('Missing Checklists:');
      expect(report).toContain('John Doe, Jane Smith, Bob Johnson');
    });
  });

  describe('edge cases and data validation', () => {
    it('should handle very large numbers', () => {
      const largeGenerator = new ChecklistReportGenerator(mockLargeData);
      const report = largeGenerator.report;

      expect(report).toContain('Total Members: 1000');
      expect(report).toContain('Weekly Checklists Created: 999999 (99999.9%)');
      expect(report).toContain('Weekly Checklists Missing: 0 (0%)');
    });

    it('should handle special characters in member names', () => {
      const specialGenerator = new ChecklistReportGenerator(mockSpecialCharactersData);
      const report = specialGenerator.unblindedReport;

      expect(report).toContain('John-Doe, Jane_Smith, Bob@Johnson, Alice-Brown, Charlie_Wilson');
      expect(report).toContain('John-Doe, Jane_Smith, Bob@Johnson');
      expect(report).toContain('Alice-Brown, Charlie_Wilson');
    });

    it('should handle unicode characters in member names', () => {
      const unicodeGenerator = new ChecklistReportGenerator(mockUnicodeData);
      const report = unicodeGenerator.unblindedReport;

      expect(report).toContain('Jess Smith, Micheal Muller');
      expect(report).toContain('Jess Smith, Micheal Muller');
    });
  });

  describe('integration with utilities', () => {
    it('should use getPercentage utility correctly', () => {
      const report = generator.report;

      expect(report).toContain('(300%)');
      expect(report).toContain('(40%)');
    });

    it('should use dedent utility correctly', () => {
      const report = generator.report;

      const lines = report.split('\n');
      const nonEmptyLines = lines.filter(line => line.trim().length > 0);

      nonEmptyLines.forEach(line => {
        if (line.trim().length > 0 && !line.startsWith(' ')) {
          expect(line).not.toMatch(/^\s+/);
        }
      });
    });
  });
});
