// __tests__/age-group-detector.test.ts
import { AgeGroupDetector } from '../src/lib/age-group-detector';

describe('AgeGroupDetector', () => {
  let detector: AgeGroupDetector;

  beforeEach(() => {
    detector = new AgeGroupDetector();
  });

  describe('detectAgeGroup', () => {
    it('should detect adults from various patterns', () => {
      const testCases = [
        'Open Studio - Adults (19 and up) only',
        'Workshop for Adults (19+)',
        'Adult only session - must be 19 and up',
        'Pottery class - Adults only'
      ];

      testCases.forEach(description => {
        const result = detector.detectAgeGroup(description);
        expect(result.group).toBe('adults');
        expect(result.emoji).toBe('🧑');
        expect(result.label).toBe('Adults (19+)');
        expect(result.color).toBe('#1e40af');
      });
    });

    it('should detect elementary age group', () => {
      const testCases = [
        'After School Art Club - Elementary (6-11 years)',
        'Kids workshop ages 6-11',
        'Summer camp for elementary kids (6 to 11)',
        'Elementary robotics - Ages 6-11 years'
      ];

      testCases.forEach(description => {
        const result = detector.detectAgeGroup(description);
        expect(result.group).toBe('elementary');
        expect(result.emoji).toBe('👶');
        expect(result.label).toBe('Kids (6-11)');
        expect(result.color).toBe('#059669');
      });
    });

    it('should detect all ages events', () => {
      const testCases = [
        'Family 3D Printing Workshop - All Ages',
        'Community event - All Ages welcome',
        'Family Friendly pottery session',
        'Intergenerational art class',
        'Everyone Welcome - open studio'
      ];

      testCases.forEach(description => {
        const result = detector.detectAgeGroup(description);
        expect(result.group).toBe('allages');
        expect(result.emoji).toBe('👪');
        expect(result.label).toBe('All Ages');
        expect(result.color).toBe('#7c3aed');
      });
    });

    it('should detect teens age group', () => {
      const testCases = [
        'Teen robotics club (12-18)',
        'Middle School art session',
        'High School maker space',
        'Teens (14-17) workshop'
      ];

      testCases.forEach(description => {
        const result = detector.detectAgeGroup(description);
        expect(result.group).toBe('teens');
        expect(result.emoji).toBe('🧒');
        expect(result.label).toBe('Teens (12-18)');
        expect(result.color).toBe('#ea580c');
      });
    });

    it('should default to unknown for unmatched patterns', () => {
      const testCases = [
        'Generic workshop description',
        'Some random event',
        'No age indicators here',
        ''
      ];

      testCases.forEach(description => {
        const result = detector.detectAgeGroup(description);
        expect(result.group).toBe('unknown');
        expect(result.emoji).toBe('🤖');
        expect(result.label).toBe('All Welcome');
        expect(result.color).toBe('#6b7280');
      });
    });

    it('should handle empty and null descriptions', () => {
      expect(detector.detectAgeGroup('')).toEqual({
        group: 'unknown',
        emoji: '🤖',
        label: 'All Welcome',
        color: '#6b7280'
      });

      expect(detector.detectAgeGroup(null as any)).toEqual({
        group: 'unknown',
        emoji: '🤖',
        label: 'All Welcome',
        color: '#6b7280'
      });
    });
  });

  describe('analyzeEvents', () => {
    it('should correctly count age group distribution', () => {
      const mockEvents = [
        { ageGroup: { group: 'adults', emoji: '🧑', label: 'Adults (19+)', color: '#1e40af' } },
        { ageGroup: { group: 'adults', emoji: '🧑', label: 'Adults (19+)', color: '#1e40af' } },
        { ageGroup: { group: 'elementary', emoji: '👶', label: 'Kids (6-11)', color: '#059669' } },
        { ageGroup: { group: 'allages', emoji: '👪', label: 'All Ages', color: '#7c3aed' } },
        { ageGroup: { group: 'teens', emoji: '🧒', label: 'Teens (12-18)', color: '#ea580c' } }
      ] as any[];

      const result = detector.analyzeEvents(mockEvents);
      
      expect(result).toEqual({
        adults: 2,
        elementary: 1,
        allages: 1,
        teens: 1
      });
    });

    it('should handle empty events array', () => {
      const result = detector.analyzeEvents([]);
      expect(result).toEqual({});
    });
  });

  describe('getAgeGroupByName', () => {
    it('should return correct age group for valid names', () => {
      const adults = detector.getAgeGroupByName('adults');
      expect(adults).toEqual({
        group: 'adults',
        emoji: '🧑',
        label: 'Adults (19+)',
        color: '#1e40af'
      });

      const elementary = detector.getAgeGroupByName('elementary');
      expect(elementary).toEqual({
        group: 'elementary',
        emoji: '👶',
        label: 'Kids (6-11)',
        color: '#059669'
      });
    });

    it('should return null for invalid names', () => {
      expect(detector.getAgeGroupByName('invalid')).toBeNull();
      expect(detector.getAgeGroupByName('')).toBeNull();
    });
  });

  describe('getAllAgeGroups', () => {
    it('should return all available age groups', () => {
      const allGroups = detector.getAllAgeGroups();
      
      expect(allGroups).toHaveLength(4);
      expect(allGroups.map(g => g.group)).toEqual(['adults', 'elementary', 'allages', 'teens']);
      
      allGroups.forEach(group => {
        expect(group).toHaveProperty('group');
        expect(group).toHaveProperty('emoji');
        expect(group).toHaveProperty('label');
        expect(group).toHaveProperty('color');
      });
    });
  });
});
