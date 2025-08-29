import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Notes header and search', () => {
  render(<App />);
  expect(screen.getByText(/Notes/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Search notes/i)).toBeInTheDocument();
});
