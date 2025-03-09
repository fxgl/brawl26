/**
 * @jest-environment node
 */
// Setup file for Jest - not an actual test file

// Mock the server.listen function to prevent actual server start during tests
jest.mock('http', () => {
  const mockedListen = jest.fn();
  const mockedServer = {
    listen: mockedListen,
    on: jest.fn()
  };

  return {
    ...jest.requireActual('http'),
    createServer: jest.fn(() => mockedServer)
  };
});

// Also mock express application to prevent it from listening on ports
jest.mock('express', () => {
  const app = {
    use: jest.fn(),
    get: jest.fn(),
    post: jest.fn(),
    listen: jest.fn()
  };
  // Return a function that has methods attached 
  const mockExpress: any = function() { return app; };
  mockExpress.json = jest.fn(() => jest.fn());
  mockExpress.urlencoded = jest.fn(() => jest.fn());
  mockExpress.static = jest.fn(() => jest.fn());
  return mockExpress;
});

// Mock the PeerServer to prevent it from listening on ports
jest.mock('peer', () => {
  // Define the type for our mock server
  type MockedPeerServer = {
    on: jest.Mock;
    emit: jest.Mock;
    _eventHandlers: Record<string, Function>;
  };
  
  // Create the server with proper typing
  const mockedPeerServer: MockedPeerServer = {
    on: jest.fn().mockImplementation((event: string, handler: Function) => {
      // Store the handlers so we can simulate events in tests
      mockedPeerServer._eventHandlers[event] = handler;
      return mockedPeerServer;
    }),
    emit: jest.fn(),
    _eventHandlers: {}
  };

  return {
    ...jest.requireActual('peer'),
    PeerServer: jest.fn(() => mockedPeerServer)
  };
});

// Mock global functions
const mockSetTimeout = jest.fn().mockReturnValue(123 as unknown as NodeJS.Timeout);
const mockClearTimeout = jest.fn();

(global.setTimeout as any) = mockSetTimeout;
(global.clearTimeout as any) = mockClearTimeout;

// Add these mocks to the global object so tests can access them
(global as any).mockSetTimeout = mockSetTimeout;
(global as any).mockClearTimeout = mockClearTimeout;

// No tests in this file - it's setup only