# Maker Space Live Event Display - AI Agent Coordination Hub

## 🤖 AI Agent System Overview

This project uses **3 specialized AI agents** working collaboratively to build a production-ready Maker Space TV display system. Each agent has specific expertise and communicates through structured logs and shared interfaces.

## 👥 Agent Roles & Responsibilities

### 🔧 Backend Agent (@backend-agent)
- **Expertise**: Data processing, calendar integration, APIs, databases
- **Guide**: `README-BACKEND.md`
- **Communication**: Posts to `AGENT-LOGS.md` with `[BACKEND]` prefix
- **Dependencies**: Provides data models for Frontend, APIs for Vercel Functions

### 🌐 Vercel Functions Agent (@functions-agent)  
- **Expertise**: Serverless functions, cron jobs, cloud infrastructure, deployment
- **Guide**: `README-VERCEL-FUNCTIONS.md`
- **Communication**: Posts to `AGENT-LOGS.md` with `[FUNCTIONS]` prefix
- **Dependencies**: Consumes Backend APIs, serves Frontend data

### 🎨 Frontend Agent (@frontend-agent)
- **Expertise**: React/Next.js UI, user experience, styling, accessibility
- **Guide**: `README-FRONTEND.md`  
- **Communication**: Posts to `AGENT-LOGS.md` with `[FRONTEND]` prefix
- **Dependencies**: Consumes Functions APIs, implements Backend data models

## 📝 Communication Protocol

### 🗂️ Shared Communication Log: `AGENT-LOGS.md`

All agents **MUST**:
1. **Read `AGENT-LOGS.md`** before starting any work
2. **Post updates** when completing tasks or encountering blockers
3. **Tag dependencies** when work affects other agents
4. **Follow the structured format** below

### Message Format
```markdown
## [AGENT] YYYY-MM-DD HH:MM - [STATUS] Task Description

**What I Did:**
- Specific accomplishments
- Files created/modified
- APIs or interfaces implemented

**Dependencies:**
- @backend-agent: What I need from Backend
- @functions-agent: What I need from Functions  
- @frontend-agent: What I need from Frontend

**Next Steps:**
- My immediate next tasks
- Estimated completion time

**Blockers:**
- Issues preventing progress
- Questions for other agents

---
```

### Status Types
- **[COMPLETE]** - Task finished and ready for integration
- **[IN-PROGRESS]** - Currently working on task
- **[BLOCKED]** - Cannot proceed without dependency
- **[QUESTION]** - Need clarification from another agent
- **[URGENT]** - Critical issue requiring immediate attention

## 🏗️ Project Architecture for AI Agents

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND AGENT DOMAIN                        │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   TV Display     │  │   Admin Panel    │  │  React Components│ │
│  │   Interface      │  │   (Time Override)│  │  & Styling       │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                   ↕
                            API Communication
                                   ↕
┌─────────────────────────────────────────────────────────────────┐
│                  FUNCTIONS AGENT DOMAIN                         │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   Cron Jobs      │  │   API Routes     │  │   Admin APIs     │ │
│  │  (Every 15min)   │  │ (/api/status)    │  │ (/api/admin)     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                   ↕
                            Data Processing
                                   ↕
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND AGENT DOMAIN                          │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  Calendar Parser │  │ Age Group Engine │  │ Event Validator  │ │
│  │   (iCal → JSON)  │  │ (Text Analysis)  │  │ (Data Quality)   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Agent Workflow Phases

### Phase 1: Foundation Setup (Days 1-2)

**Backend Agent Start Here:**
1. Create shared TypeScript interfaces in `/shared/types.ts`
2. Implement calendar fetching logic
3. Build age group detection algorithm
4. Post to log when interfaces are ready

**Functions Agent (Wait for Backend interfaces):**
1. Read Backend's interface definitions
2. Create Vercel Function structure
3. Implement basic cron job
4. Set up KV storage

**Frontend Agent (Wait for Functions APIs):**
1. Read Backend interfaces and Functions APIs  
2. Create basic Next.js structure
3. Build time display component
4. Design layout wireframes

### Phase 2: Core Integration (Days 3-4)

**All Agents:**
- Implement cross-agent communication via shared APIs
- Test integration points
- Report issues in log file

### Phase 3: Advanced Features (Days 5-6)

**All Agents:**
- Add age group visual themes
- Implement admin panel
- Add production monitoring

### Phase 4: Production Ready (Days 7-8)

**All Agents:**
- Final integration testing
- Deploy to production
- Document for end users

## 🔧 Shared Interfaces & Contracts

### TypeScript Interfaces (Backend Agent Creates)
```typescript
// /shared/types.ts - BACKEND AGENT: Create this first!

export interface ProcessedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  start: string; // ISO string
  end: string;   // ISO string
  status: 'confirmed' | 'cancelled' | 'tentative';
  isAllDay: boolean;
  ageGroup: AgeGroup;
  categories: string[];
}

export interface AgeGroup {
  group: 'adults' | 'elementary' | 'allages' | 'teens' | 'unknown';
  emoji: string;
  label: string;
  color: string; // CSS color for themes
}

export interface DisplayStatus {
  status: 'current' | 'between' | 'closed';
  currentEvent?: ProcessedEvent;
  nextEvent?: ProcessedEvent;
  currentTime: string;
  mockTime?: string; // For admin time override
}
```

### API Endpoints (Functions Agent Creates)
```typescript
// API Contract - FUNCTIONS AGENT: Implement these endpoints

// GET /api/calendar/status?mockTime=2025-01-01T12:00:00Z
// Returns: DisplayStatus

// GET /api/calendar/events?start=2025-01-01&end=2025-01-02  
// Returns: ProcessedEvent[]

// POST /api/admin/time-override
// Body: { mockTime: string | null }
// Returns: { success: boolean }

// GET /api/health
// Returns: SystemHealth
```

### React Components (Frontend Agent Creates)
```typescript
// Component Interface - FRONTEND AGENT: Build these components

// <TVDisplay />           - Main display for TV screen
// <AdminPanel />          - Time override and controls  
// <EventCard />           - Individual event display
// <AgeGroupBadge />       - Age group indicator
// <StatusBanner />        - Current status display
```

## 📋 Task Assignment & Dependencies

### Backend Agent Tasks
```markdown
- [ ] 1. Create `/shared/types.ts` interface definitions
- [ ] 2. Implement calendar fetching from Google Calendar API
- [ ] 3. Build age group detection algorithm  
- [ ] 4. Create event validation and filtering
- [ ] 5. Add data sanitization and error handling
- [ ] 6. Document APIs for Functions Agent

**Dependencies I Provide:**
- TypeScript interfaces for all agents
- Calendar parsing logic
- Age group detection algorithms
```

### Functions Agent Tasks  
```markdown
- [ ] 1. Wait for Backend interfaces, then create Vercel Function structure
- [ ] 2. Implement cron job for calendar fetching (every 15 min)
- [ ] 3. Create API endpoints: /api/calendar/status, /api/calendar/events
- [ ] 4. Set up Vercel KV storage for caching
- [ ] 5. Add admin endpoints for time override
- [ ] 6. Implement health monitoring and error handling

**Dependencies I Need:**
- @backend-agent: TypeScript interfaces and calendar parsing logic

**Dependencies I Provide:**  
- API endpoints for Frontend Agent
- Automated data fetching via cron jobs
```

### Frontend Agent Tasks
```markdown
- [ ] 1. Wait for Functions APIs, then create Next.js app structure  
- [ ] 2. Build TV display layout with time and event information
- [ ] 3. Implement age group themes and visual indicators
- [ ] 4. Create admin panel for time override testing
- [ ] 5. Add responsive design and accessibility features
- [ ] 6. Implement real-time updates and error states

**Dependencies I Need:**
- @backend-agent: TypeScript interfaces  
- @functions-agent: API endpoints and data structure

**Dependencies I Provide:**
- Complete user interface for TV display
- Admin panel for testing and overrides
```

## 🚨 Critical Communication Rules

### 1. Always Read the Log First
Before starting any work:
```bash
# Read the latest updates from other agents
cat AGENT-LOGS.md | tail -20
```

### 2. Post Updates Frequently  
- After completing each major task
- When encountering blockers
- When creating new interfaces or APIs

### 3. Tag Dependencies Clearly
- Use @agent-name when you need something
- Be specific about what you need and when
- Provide context for why it's needed

### 4. Handle Conflicts Immediately
If two agents are modifying the same files:
- Post **[URGENT]** message in log
- Coordinate through log file  
- Resolve conflicts before continuing

### 5. Test Integration Points
When your work affects another agent:
- Test the integration
- Document any breaking changes
- Provide migration guidance

## 📊 Progress Tracking

### Daily Progress Reports
Each agent posts daily summary:
```markdown
## [AGENT] Daily Summary - YYYY-MM-DD

**Completed:**
- Task 1: Description and files affected
- Task 2: Description and files affected

**In Progress:**
- Current task with expected completion

**Tomorrow:**
- Next planned tasks

**Team Dependencies:**
- What I'm waiting for from other agents
- What I've provided for other agents
```

### Integration Checkpoints
Before each phase, all agents confirm:
- [ ] My tasks from previous phase are complete
- [ ] Integration with other agents is working  
- [ ] No breaking changes introduced
- [ ] Ready to proceed to next phase

## 🔧 Development Environment Setup

### All Agents Share These Tools:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run type-check

# Linting
npm run lint
```

### Shared Environment Variables:
```env
# Calendar Configuration
CALENDAR_ID=1155c68c0f34daaf8376a26a85082e0d1d1f7b2d7c91f9be70979b5b58ede7cf@group.calendar.google.com
NEXT_PUBLIC_TIME_ZONE=America/Chicago

# Vercel KV Storage (Functions Agent sets up)
KV_REST_API_URL=https://your-kv-store.vercel-storage.com  
KV_REST_API_TOKEN=your-token-here

# Admin Settings
ADMIN_PASSWORD=makerspace2024
```

## 🎯 Success Criteria

### Technical Requirements Met:
- [ ] Calendar data fetches automatically every 15 minutes
- [ ] Age groups detected and displayed with 95%+ accuracy
- [ ] TV display updates in real-time with current events
- [ ] Admin can override time for testing purposes  
- [ ] System recovers automatically from failures
- [ ] Production deployment works 24/7

### Agent Collaboration Success:
- [ ] All agents communicated regularly via logs
- [ ] No major integration conflicts occurred
- [ ] Dependencies were clearly defined and met
- [ ] Code quality maintained across all components
- [ ] Documentation complete for end users

---

## 🚀 Getting Started

**For AI Agents Beginning This Project:**

1. **Read your specialized guide** (`README-BACKEND.md`, `README-VERCEL-FUNCTIONS.md`, or `README-FRONTEND.md`)

2. **Check the communication log**: `cat AGENT-LOGS.md`

3. **Post your first message** indicating you're starting work

4. **Begin with Phase 1 tasks** assigned to your agent type

5. **Communicate early and often** through the log file

Good luck building an amazing Maker Space display system! 🎨🔧📺
