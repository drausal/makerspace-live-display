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
      h="500px"
      display="flex"
      flexDirection="column"
    >
      <Card.Body flex="1" display="flex" flexDirection="column">
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

        {timeRemaining && (
          <Box textAlign="center" mb="2">
            <Text fontSize="2xl" fontWeight="bold" color="#10b981">
              {timeRemaining} Remaining
            </Text>
          </Box>
        )}

        {timeUntilStart && (
          <Box textAlign="center" mb="2">
            <Text fontSize="2xl" fontWeight="bold" color="#f59e0b">
              Starts in {timeUntilStart}
            </Text>
          </Box>
        )}

        {event.description && (
          <Text 
            fontSize="lg" 
            color="fg.muted" 
            mb="3" 
            fontWeight="semibold"
            whiteSpace="pre-line"
            flex="1"
            overflow="hidden"
          >
            {event.description}
          </Text>
        )}

        <Grid templateColumns="repeat(2, 1fr)" gap="3" textAlign="center" mt="auto">
          <GridItem>
            <Box bg="bg" p="3" rounded="md" minH="80px">
              <Heading size="md" fontWeight="bold" color="fg.muted">START</Heading>
              <HStack justify="center" align="center" gap="3">
                <Text fontSize="3xl" fontWeight="bold" color="fg">
                  {formatTime(event.start)}
                </Text>
                {!isToday(event.start) && (
                  <Text fontSize="xl" fontWeight="bold" color="#60a5fa">
                    {formatDate(event.start)}
                  </Text>
                )}
              </HStack>
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="bg" p="3" rounded="md" minH="80px">
              <Heading size="md" fontWeight="bold" color="fg.muted">END</Heading>
              <HStack justify="center" align="center" gap="3">
                <Text fontSize="3xl" fontWeight="bold" color="fg">
                  {formatTime(event.end)}
                </Text>
                {type === 'next' && !isToday(event.end) && (
                  <Text fontSize="xl" fontWeight="bold" color="#60a5fa">
                    {formatDate(event.end)}
                  </Text>
                )}
              </HStack>
            </Box>
          </GridItem>
        </Grid>
      </Card.Body>
    </Card.Root>
  );
}
