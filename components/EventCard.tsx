"use client";

import { ProcessedEvent } from '@/shared/types';
import { AgeGroupBadge } from './AgeGroupBadge';
import { 
  Card, 
  Text, 
  Heading, 
  HStack, 
  VStack, 
  Grid, 
  GridItem,
  Box
} from '@chakra-ui/react';

interface EventCardProps {
  event: ProcessedEvent;
  type: 'current' | 'next';
  timeRemaining?: string;
  timeUntilStart?: string;
}

export function EventCard({ event, type, timeRemaining, timeUntilStart }: EventCardProps) {
  const formatTime = (time: string) =>
    new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatDate = (time: string) =>
    new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const isToday = (time: string) => {
    const eventDate = new Date(time);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  };

  const borderColor = type === 'current' ? 'blue.500' : 'gray.600';
  const themeColor = `var(--theme-color)`;

  return (
    <Card.Root 
      size="lg" 
      variant="elevated"
      borderWidth="4px"
      borderColor={borderColor}
      bg="surface"
      p="3"
      w="100%"
      maxH="450px"
      overflow="hidden"
    >
      <Card.Body>
        <HStack justify="space-between" align="center" mb="2">
          <Heading 
            size="2xl" 
            fontWeight="bold"
            color={themeColor}
          >
            {type === 'current' ? 'Live Now' : 'Up Next'}
          </Heading>
          <AgeGroupBadge ageGroup={event.ageGroup} />
        </HStack>

        <Heading 
          size="3xl" 
          fontWeight="extrabold" 
          color="fg" 
          mb="2"
          lineHeight="shorter"
        >
          {event.title}
        </Heading>

        {event.description && (
          <Text 
            fontSize="xl" 
            color="fg.muted" 
            mb="4" 
            fontWeight="semibold"
            whiteSpace="pre-line"
          >
            {event.description}
          </Text>
        )}

        <Grid templateColumns="repeat(2, 1fr)" gap="4" textAlign="center">
          <GridItem>
            <Box bg="bg" p="4" rounded="md" minH="100px">
              <Heading size="lg" fontWeight="bold" color="fg.muted">START</Heading>
              <HStack justify="center" align="center" gap="3">
                <Text fontSize="4xl" fontWeight="bold" color="fg">
                  {formatTime(event.start)}
                </Text>
                {!isToday(event.start) && (
                  <Text fontSize="2xl" fontWeight="bold" color="blue.300">
                    {formatDate(event.start)}
                  </Text>
                )}
              </HStack>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="bg" p="4" rounded="md" minH="100px">
              <Heading size="lg" fontWeight="bold" color="fg.muted">END</Heading>
              <Text fontSize="4xl" fontWeight="bold" color="fg">
                {formatTime(event.end)}
              </Text>
              {type === 'next' && !isToday(event.end) && (
                <Text fontSize="2xl" fontWeight="bold" color="blue.300" mt="1">
                  {formatDate(event.end)}
                </Text>
              )}
            </Box>
          </GridItem>
        </Grid>

        {timeRemaining && (
          <Box mt="4" textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="green.400">
              {timeRemaining} Remaining
            </Text>
          </Box>
        )}

        {timeUntilStart && (
          <Box mt="4" textAlign="center">
            <Text fontSize="2xl" fontWeight="bold" color="yellow.400">
              Starts in {timeUntilStart}
            </Text>
          </Box>
        )}
      </Card.Body>
    </Card.Root>
  );
}
