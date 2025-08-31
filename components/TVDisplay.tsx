'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DisplayStatus } from '@/shared/types';
import { EventCard } from './EventCard';
import { StatusBanner } from './StatusBanner';
import { Clock } from './Clock';
import { ErrorBoundary } from './ErrorBoundary';
import {
  Box,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Spinner
} from '@chakra-ui/react';

export function TVDisplay() {
  const [displayStatus, setDisplayStatus] = useState<DisplayStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const router = useRouter();

  // Add keyboard shortcut for admin panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'a' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        router.push('/admin');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [router]);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar/status');
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDisplayStatus(data);
      setError(null);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <Flex 
        className="tv-display" 
        minH="100vh" 
        direction="column"
        align="center" 
        justify="center" 
        textAlign="center" 
        p="16"
      >
        <VStack gap="6">
          <Heading size="6xl" fontWeight="extrabold">HQ MAKERSPACE</Heading>
          <Text fontSize="4xl" color="fg.muted">Loading Display...</Text>
          <Spinner size="xl" color="blue.500" />
        </VStack>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex 
        className="tv-display" 
        minH="100vh" 
        direction="column"
        align="center" 
        justify="center" 
        textAlign="center" 
        p="16"
      >
        <Box 
          bg="surface" 
          p="20" 
          rounded="lg" 
          borderWidth="4px" 
          borderColor="red.500"
          maxW="4xl"
        >
          <VStack gap="6">
            <Heading size="5xl" color="red.400">Display Error</Heading>
            <Text fontSize="3xl">{error}</Text>
            <Button
              onClick={fetchStatus}
              size="lg"
              colorPalette="blue"
              fontSize="2xl"
              px="12"
              py="6"
            >
              Retry
            </Button>
          </VStack>
        </Box>
      </Flex>
    );
  }

  if (!displayStatus) return null;

  const theme = displayStatus.displayTheme || 'closed';

  return (
    <ErrorBoundary>
      <Box 
        className={`tv-display theme-${theme} animate-fadeIn`} 
        h="100vh" 
        w="100vw"
        p="8"
        display="flex"
        flexDirection="column"
        overflow="hidden"
      >
        <Grid as="header" templateColumns="1fr 1fr" alignItems="start" mb="8" h="120px">
          <GridItem>
            <VStack align="start" gap="2">
              <Heading size="5xl" fontWeight="extrabold">HQ MAKERSPACE</Heading>
              <Text fontSize="3xl" color="fg.muted">Event Schedule</Text>
            </VStack>
          </GridItem>
          <GridItem>
            <Clock
              currentTime={displayStatus.currentTime}
              mockTime={displayStatus.mockTime}
            />
          </GridItem>
        </Grid>

        <Flex as="main" flex="1" direction="column" justify="center">
          <StatusBanner
            status={displayStatus.status}
            ageGroup={displayStatus.currentEvent?.ageGroup}
            nextEvent={displayStatus.nextEvent}
          />

          <Grid 
            templateColumns={
              displayStatus.currentEvent && displayStatus.nextEvent 
                ? 'repeat(2, 1fr)' 
                : '1fr'
            }
            gap="8" 
            mt="8"
            flex="1"
            justifyItems="center"
            maxW="100%"
          >
            {displayStatus.currentEvent && (
              <GridItem w="100%" maxW={displayStatus.nextEvent ? "100%" : "800px"}>
                <EventCard
                  event={displayStatus.currentEvent}
                  type="current"
                  timeRemaining={displayStatus.timeRemaining}
                />
              </GridItem>
            )}

            {displayStatus.nextEvent && (
              <GridItem w="100%" maxW={displayStatus.currentEvent ? "100%" : "800px"}>
                <EventCard
                  event={displayStatus.nextEvent}
                  type="next"
                  timeUntilStart={displayStatus.timeUntilNext}
                />
              </GridItem>
            )}
          </Grid>
        </Flex>

        <Box as="footer" textAlign="center" mt="4" py="2">
          <Text fontSize="xl" color="fg.muted">
            Last updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'N/A'}
          </Text>
          {displayStatus.mockTime && (
            <Text fontSize="xl" fontWeight="bold" color="yellow.400" ml="8" display="inline">
              (Test Mode)
            </Text>
          )}
        </Box>
      </Box>
    </ErrorBoundary>
  );
}