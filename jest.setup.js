// jest.setup.js
// Optional: configure or set up a testing framework before each test.

// Mock console methods by default to keep test output clean
global.console = {
  ...console,
  // Uncomment to ignore logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}

// Mock fetch globally for tests that need it
global.fetch = jest.fn()

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks()
})

// Set up timezone for consistent date testing
process.env.TZ = 'UTC'
