import { render, screen } from '@testing-library/react';
import App from './App';

test('renders MyToken DApp', () => {
  render(<App />);
  const titleElement = screen.getByText(/MyToken DApp/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders connect wallet button', () => {
  render(<App />);
  const buttonElement = screen.getByText(/Connect Wallet/i);
  expect(buttonElement).toBeInTheDocument();
});
