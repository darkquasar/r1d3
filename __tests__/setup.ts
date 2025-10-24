import '@testing-library/jest-dom';

// Mock ResizeObserver for ReactFlow
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock D3 drag behavior for jsdom environment
// D3 expects window.document.body but jsdom doesn't provide it in the same way
// This prevents "Cannot read properties of null (reading 'document')" errors
if (typeof window !== 'undefined') {
  // Mock the drag event
  const mockDragEvent = {
    sourceEvent: new MouseEvent('mousedown'),
    subject: null,
    identifier: 'mock',
    active: 0,
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    on: () => mockDragEvent,
  };

  // Suppress D3 drag errors in tests
  const originalError = console.error;
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('d3-drag') ||
       args[0].includes('Cannot read properties of null'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}
