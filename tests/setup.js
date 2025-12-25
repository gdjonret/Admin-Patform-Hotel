// Mock browser globals that might be needed in tests
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost/',
    pathname: '/',
    search: '',
    hash: '',
    assign: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
  },
  writable: true,
});

// Mock fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
  })
);

// Mock Intl for consistent date formatting in tests
const mockIntl = {
  DateTimeFormat: jest.fn().mockImplementation(() => ({
    format: jest.fn().mockReturnValue('01/01/2025'),
    formatToParts: jest.fn().mockReturnValue([
      { type: 'year', value: '2025' },
      { type: 'literal', value: '-' },
      { type: 'month', value: '01' },
      { type: 'literal', value: '-' },
      { type: 'day', value: '01' },
    ]),
  })),
};

global.Intl = mockIntl;

// Clean up mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
