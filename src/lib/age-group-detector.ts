// lib/age-group-detector.ts
import { AgeGroup, ProcessedEvent } from '@/shared/types';

export class AgeGroupDetector {
  private agePatterns = [
    {
      pattern: /Adults?\s*\(19\+?\s*and\s*up\)|Adults?\s*\(19\s*and\s*up\)|Adult.*(?:19|only)/i,
      group: 'adults' as const,
      emoji: '🧑',
      label: 'Adults (19+)',
      color: '#1e40af' // Blue
    },
    {
      pattern: /Elementary.*\(6[-\s]*11\s*years?\)|Ages?\s*6[-\s]*11|Kids?.*6[-\s]*11|elementary.*kids|Summer.*camp.*elementary/i,
      group: 'elementary' as const,
      emoji: '👶',
      label: 'Kids (6-11)',
      color: '#059669' // Green
    },
    {
      pattern: /All\s*Ages?|Family.*Friendly|Intergenerational|Everyone.*Welcome/i,
      group: 'allages' as const,
      emoji: '👪',
      label: 'All Ages',
      color: '#7c3aed' // Purple
    },
    {
      pattern: /Teens?.*\(1[2-8][-\s]*1[8-9]\)|Teen.*robotics|Middle.*School|High.*School|Teens?.*\(1[4-7][-\s]*1[7-9]\)/i,
      group: 'teens' as const,
      emoji: '🧒',
      label: 'Teens (12-18)',
      color: '#ea580c' // Orange
    }
  ];
  
  detectAgeGroup(title: string, description: string): AgeGroup {
    const combinedText = `${title} ${description}`;
    
    for (const { pattern, group, emoji, label, color } of this.agePatterns) {
      if (pattern.test(combinedText)) {
        return { group, emoji, label, color };
      }
    }
    
    return {
      group: 'unknown',
      emoji: '🤖',
      label: 'All Welcome',
      color: '#6b7280' // Gray
    };
  }
  
  analyzeEvents(events: ProcessedEvent[]): Record<string, number> {
    const stats = events.reduce((acc, event) => {
      acc[event.ageGroup.group] = (acc[event.ageGroup.group] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('Age group statistics:', stats);
    return stats;
  }
  
  getAgeGroupByName(groupName: string): AgeGroup | null {
    const pattern = this.agePatterns.find(p => p.group === groupName);
    if (pattern) {
      const { group, emoji, label, color } = pattern;
      return { group, emoji, label, color };
    }
    return null;
  }
  
  getAllAgeGroups(): AgeGroup[] {
    return this.agePatterns.map(({ group, emoji, label, color }) => ({
      group, emoji, label, color
    }));
  }
}