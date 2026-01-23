import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageBanner from '../app/MessageBanner.jsx';

describe('MessageBanner', () => {
  it('renders error message with red styling', () => {
    render(<MessageBanner type="error" text="Error occurred" />);
    
    const banner = screen.getByText('Error occurred').closest('div');
    expect(screen.getByText('Error occurred')).toBeInTheDocument();
    expect(screen.getByText('❌')).toBeInTheDocument();
    expect(banner).toHaveClass('bg-red-100');
    expect(banner).toHaveClass('border-red-300');
    expect(banner).toHaveClass('text-red-900');
  });

  it('renders success message with green styling', () => {
    render(<MessageBanner type="success" text="Success!" />);
    
    const banner = screen.getByText('Success!').closest('div');
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
    expect(banner).toHaveClass('bg-green-100');
    expect(banner).toHaveClass('border-green-300');
    expect(banner).toHaveClass('text-green-900');
  });

  it('renders info message by default', () => {
    render(<MessageBanner text="Information" />);
    
    const banner = screen.getByText('Information').closest('div');
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(banner).toHaveClass('bg-blue-100');
    expect(banner).toHaveClass('border-blue-300');
    expect(banner).toHaveClass('text-blue-900');
  });

  it('renders info message when type is explicitly set to info', () => {
    render(<MessageBanner type="info" text="Information" />);
    
    const banner = screen.getByText('Information').closest('div');
    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(banner).toHaveClass('bg-blue-100');
  });

  it('renders info message for unknown type', () => {
    render(<MessageBanner type="unknown" text="Unknown type" />);
    
    const banner = screen.getByText('Unknown type').closest('div');
    expect(screen.getByText('Unknown type')).toBeInTheDocument();
    expect(screen.getByText('ℹ️')).toBeInTheDocument();
    expect(banner).toHaveClass('bg-blue-100');
  });

  it('applies all required CSS classes', () => {
    render(<MessageBanner type="error" text="Test" />);
    
    const banner = screen.getByText('Test').closest('div');
    expect(banner).toHaveClass('my-5');
    expect(banner).toHaveClass('p-4');
    expect(banner).toHaveClass('rounded-md');
    expect(banner).toHaveClass('flex');
    expect(banner).toHaveClass('items-center');
    expect(banner).toHaveClass('gap-2');
  });

  it('applies correct font size to icon', () => {
    render(<MessageBanner type="error" text="Test" />);
    
    const icon = screen.getByText('❌');
    expect(icon).toHaveStyle({ fontSize: '20px' });
  });

  it('renders text in a strong tag', () => {
    render(<MessageBanner type="info" text="Important message" />);
    
    const strongElement = screen.getByText('Important message');
    expect(strongElement.tagName).toBe('STRONG');
  });
});
