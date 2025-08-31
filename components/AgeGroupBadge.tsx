"use client";

import { AgeGroup } from '@/shared/types';
import { HStack, Text, Badge } from '@chakra-ui/react';

interface AgeGroupBadgeProps {
  ageGroup: AgeGroup;
  className?: string;
}

export function AgeGroupBadge({ ageGroup, className = '' }: AgeGroupBadgeProps) {
  const themeColor = `var(--theme-${ageGroup.group})`;
  
  return (
    <Badge 
      size="lg"
      variant="solid"
      bg={themeColor}
      color="white"
      px="6"
      py="3"
      rounded="full"
      fontSize="2xl"
      fontWeight="bold"
      className={className}
    >
      <HStack gap="2">
        <Text fontSize="3xl" aria-hidden="true">
          {ageGroup.emoji}
        </Text>
        <Text>{ageGroup.label}</Text>
      </HStack>
    </Badge>
  );
}
