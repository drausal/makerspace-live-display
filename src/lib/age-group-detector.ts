// lib/age-group-detector.ts
import { AgeGroup } from '@/shared/types';

export class AgeGroupDetector {
  private agePatterns = [
    {
      pattern: /Adults?\s*\(19\+?\s*and\s*up\)|Adults?\s*\(19\s*and\s*up\)|Adult.*(?:19|only)/i,
      group: 'adults' as const,
      emoji: '🧑',
      label: 'Adults (19+)',
    },
    {
      pattern: /Elementary.*\(6[-\s]*11\s*years?\)|Ages?\s*6[-\s]*11|Kids?.*6[-\s]*11|elementary.*kids|Summer.*camp.*elementary/i,
      group: 'elementary' as const,
      emoji: '👶',
      label: 'Kids (6-11)',
    },
    {
      pattern: /All\s*Ages?|Family.*Friendly|Intergenerational|Everyone.*Welcome/i,
      group: 'allages' as const,
      emoji: '👪',
      label: 'All Ages',
    },
    {
      pattern: /Teens?.*\(1[2-8][-\s]*1[8-9]\)|Teen.*robotics|Middle.*School|High.*School|Teens?.*\(1[4-7][-\s]*1[7-9]\)/i,
      group: 'teens' as const,
      emoji: '🧒',
      label: 'Teens (12-18)',
    }
  ];
  
  detectAgeGroup(title: string, description: string): AgeGroup {
    const combinedText = `${title} ${description}`;
    
    for (const { pattern, group, emoji, label } of this.agePatterns) {
      if (pattern.test(combinedText)) {
        return { group, emoji, label };
      }
    }
    
    return {
      group: 'unknown',
      emoji: '🤖',
      label: 'All Welcome',
    };
  }
}
