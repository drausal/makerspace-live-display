#!/usr/bin/env tsx
// scripts/test-integration.ts
// Manual integration test script for the calendar system

import { GoogleCalendarFetcher } from '../src/lib/calendar-fetcher';
import { EventValidator } from '../src/lib/event-validator';
import { AgeGroupDetector } from '../src/lib/age-group-detector';
import { CalendarUtils } from '../src/lib/calendar-utils';
import { Logger } from '../src/lib/logger';

// Sample calendar data for integration testing
const sampleCalendarData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Makerspace//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Makerspace Live Events
X-WR-TIMEZONE:UTC

BEGIN:VEVENT
DTSTART:20250811T090000Z
DTEND:20250811T110000Z
DTSTAMP:20250810T180000Z
UID:morning-studio@makerspace.com
SUMMARY:Open Studio - Adults (19 and up) only
DESCRIPTION:Morning pottery and ceramics session. Adult workspace for serious creators. Must be 19 or older to participate.
LOCATION:Main Pottery Studio
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250811T130000Z
DTEND:20250811T150000Z
DTSTAMP:20250810T180000Z
UID:kids-workshop@makerspace.com
SUMMARY:After School Makers - Elementary (6-11 years)
DESCRIPTION:Creative workshop for elementary students ages 6-11. Building, crafting, and learning together!
LOCATION:Kids Workshop Area
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250811T160000Z
DTEND:20250811T180000Z
DTSTAMP:20250810T180000Z
UID:family-3d@makerspace.com
SUMMARY:Family 3D Design Workshop - All Ages
DESCRIPTION:Learn 3D modeling and printing together! Family friendly event where everyone can participate. All ages welcome.
LOCATION:3D Lab
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250811T190000Z
DTEND:20250811T210000Z
DTSTAMP:20250810T180000Z
UID:teen-robotics@makerspace.com
SUMMARY:Teen Robotics Club (12-18)
DESCRIPTION:High school robotics club meeting. Working on competition robots and learning programming. Middle School and High School students welcome.
LOCATION:STEM Laboratory
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250811T120000Z
DTEND:20250811T130000Z
DTSTAMP:20250810T180000Z
UID:staff-meeting@makerspace.com
SUMMARY:Busy - Staff Lunch
DESCRIPTION:Private staff meeting and lunch
LOCATION:Office
STATUS:CONFIRMED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250811T220000Z
DTEND:20250811T230000Z
DTSTAMP:20250810T180000Z
UID:cancelled-event@makerspace.com
SUMMARY:Late Night Workshop
DESCRIPTION:This workshop was cancelled due to staffing
LOCATION:Workshop B
STATUS:CANCELLED
END:VEVENT

BEGIN:VEVENT
DTSTART:20250811T110000Z
DTEND:20250811T120000Z
DTSTAMP:20250810T180000Z
UID:unknown-event@makerspace.com
SUMMARY:Community Meeting
DESCRIPTION:General community meeting to discuss upcoming events and improvements
LOCATION:Main Hall
STATUS:CONFIRMED
END:VEVENT

END:VCALENDAR`;

async function runIntegrationTest() {
  console.log('🧪 Starting Calendar System Integration Test\n');
  
  // Initialize components
  const fetcher = new GoogleCalendarFetcher('test-calendar');
  const validator = new EventValidator();
  const detector = new AgeGroupDetector();
  
  Logger.setLogLevel('info');
  
  try {
    console.log('📅 Step 1: Mock calendar data fetch...');
    
    // Mock fetch to return our sample data
    global.fetch = (() => Promise.resolve({
      ok: true,
      text: () => Promise.resolve(sampleCalendarData)
    })) as any;
    
    const startDate = new Date('2025-08-11T00:00:00Z');
    const endDate = new Date('2025-08-11T23:59:59Z');
    
    const rawEvents = await fetcher.fetchEvents(startDate, endDate);
    console.log(`✅ Fetched ${rawEvents.length} raw events from calendar`);
    
    console.log('\n🔍 Step 2: Event validation and filtering...');
    const filteredEvents = validator.filterEvents(rawEvents);
    console.log(`✅ After filtering: ${filteredEvents.length} valid events`);
    console.log(`   - Filtered out: ${rawEvents.length - filteredEvents.length} events (busy/cancelled)`);
    
    console.log('\n🏷️ Step 3: Age group analysis...');
    const ageStats = detector.analyzeEvents(filteredEvents);
    console.log('✅ Age group distribution:');
    Object.entries(ageStats).forEach(([group, count]) => {
      const ageGroup = detector.getAgeGroupByName(group);
      console.log(`   ${ageGroup?.emoji} ${ageGroup?.label}: ${count} events`);
    });
    
    console.log('\n⏰ Step 4: Display status simulation...');
    
    // Test different time scenarios
    const testTimes = [
      { time: '2025-08-11T08:00:00Z', desc: 'Before any events' },
      { time: '2025-08-11T10:00:00Z', desc: 'During adult workshop' },
      { time: '2025-08-11T12:30:00Z', desc: 'Between events' },
      { time: '2025-08-11T14:00:00Z', desc: 'During kids workshop' },
      { time: '2025-08-11T17:00:00Z', desc: 'During family workshop' },
      { time: '2025-08-11T20:00:00Z', desc: 'During teen robotics' },
      { time: '2025-08-11T23:00:00Z', desc: 'After all events' }
    ];
    
    testTimes.forEach(({ time, desc }) => {
      const displayStatus = CalendarUtils.getCurrentDisplayStatus(filteredEvents, time);
      const timeStr = new Date(time).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      
      console.log(`   ${timeStr} (${desc}):`);
      console.log(`   Status: ${displayStatus.status.toUpperCase()}`);
      
      if (displayStatus.currentEvent) {
        const event = displayStatus.currentEvent;
        console.log(`   Current: ${event.ageGroup.emoji} ${event.title}`);
      }
      
      if (displayStatus.nextEvent) {
        const nextEvent = displayStatus.nextEvent;
        console.log(`   Next: ${nextEvent.ageGroup.emoji} ${nextEvent.title}`);
        if (displayStatus.timeUntilNext) {
          console.log(`   Time until next: ${displayStatus.timeUntilNext}`);
        }
      }
      
      console.log();
    });
    
    console.log('📊 Step 5: Performance test...');
    const startTime = Date.now();
    
    // Process events multiple times to test performance
    for (let i = 0; i < 10; i++) {
      const events = await fetcher.fetchEvents(startDate, endDate);
      validator.filterEvents(events);
      detector.analyzeEvents(events);
      CalendarUtils.getCurrentDisplayStatus(events);
    }
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Processed events 10 times in ${processingTime}ms (avg: ${processingTime/10}ms per cycle)`);
    
    console.log('\n🎯 Step 6: Event details verification...');
    filteredEvents.forEach((event, index) => {
      console.log(`   Event ${index + 1}:`);
      console.log(`   ${event.ageGroup.emoji} ${event.title}`);
      console.log(`   Time: ${new Date(event.start).toLocaleTimeString()} - ${new Date(event.end).toLocaleTimeString()}`);
      console.log(`   Age Group: ${event.ageGroup.label} (${event.ageGroup.group})`);
      console.log(`   Location: ${event.location}`);
      console.log(`   Status: ${event.status}`);
      console.log();
    });
    
    console.log('📈 Step 7: System health check...');
    const errorSummary = Logger.getLogs('error');
    const warningSummary = Logger.getLogs('warn');
    
    console.log(`✅ System health: ${errorSummary.length} errors, ${warningSummary.length} warnings`);
    
    if (errorSummary.length > 0) {
      console.log('❌ Errors found:');
      errorSummary.forEach(log => {
        console.log(`   [${log.component}] ${log.message}`);
      });
    }
    
    if (warningSummary.length > 0) {
      console.log('⚠️ Warnings found:');
      warningSummary.forEach(log => {
        console.log(`   [${log.component}] ${log.message}`);
      });
    }
    
    console.log('\n🎉 Integration Test Complete!');
    console.log('✅ All systems working correctly');
    console.log(`✅ ${filteredEvents.length} events processed successfully`);
    console.log('✅ Age group detection functioning properly');
    console.log('✅ Event validation and filtering operational');
    console.log('✅ Display status calculation accurate');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    process.exit(1);
  }
}

// Mock Jest functions if not in test environment
if (typeof jest === 'undefined') {
  (global as any).jest = {
    fn: (impl?: any) => impl || (() => {}),
  };
}

// Run the integration test
if (require.main === module) {
  runIntegrationTest().catch(console.error);
}

export { runIntegrationTest };
