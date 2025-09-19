import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockApiResponses, mockFetch, mockGeolocation, createMockFile } from '../../utils/testUtils';
import ReportForm from '../citizen/ReportForm';

// Mock the API client
jest.mock('../../services/api', () => ({
  reportsAPI: {
    create: jest.fn(),
  },
}));

describe('ReportForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGeolocation();
    
    // Mock successful API responses
    mockFetch({
      'POST /api/reports': mockApiResponses.reports.create,
      'POST /api/ml/validate': {
        success: true,
        isValid: true,
        wasteType: 'organic',
        confidence: 0.95,
      },
    });
  });

  it('renders form with all required fields', () => {
    renderWithProviders(<ReportForm />);
    
    expect(screen.getByText('Submit Waste Report')).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/waste type/i)).toBeInTheDocument();
    expect(screen.getByText(/upload images/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit report/i })).toBeInTheDocument();
  });

  it('displays current location when geolocation is available', async () => {
    renderWithProviders(<ReportForm />);
    
    await waitFor(() => {
      expect(screen.getByText(/current location/i)).toBeInTheDocument();
    });
  });

  it('validates required fields before submission', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/description is required/i)).toBeInTheDocument();
    expect(screen.getByText(/waste type is required/i)).toBeInTheDocument();
  });

  it('allows user to fill out and submit form', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    // Fill out form
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Illegal dumping of construction waste');
    
    const wasteTypeSelect = screen.getByLabelText(/waste type/i);
    await user.selectOptions(wasteTypeSelect, 'construction');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/report submitted successfully/i)).toBeInTheDocument();
    });
  });

  it('handles image upload', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const file = createMockFile('test-image.jpg', 'image/jpeg');
    const fileInput = screen.getByLabelText(/upload images/i);
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });
  });

  it('validates image files', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const invalidFile = createMockFile('test.txt', 'text/plain');
    const fileInput = screen.getByLabelText(/upload images/i);
    
    await user.upload(fileInput, invalidFile);
    
    expect(screen.getByText(/please select valid image files/i)).toBeInTheDocument();
  });

  it('limits number of uploaded images', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const files = Array.from({ length: 6 }, (_, i) => 
      createMockFile(`image${i + 1}.jpg`, 'image/jpeg')
    );
    
    const fileInput = screen.getByLabelText(/upload images/i);
    await user.upload(fileInput, files);
    
    expect(screen.getByText(/maximum 5 images allowed/i)).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    // Mock delayed API response
    global.fetch = jest.fn(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponses.reports.create),
        } as Response), 1000)
      )
    );

    const { user } = renderWithProviders(<ReportForm />);
    
    // Fill out form
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test report');
    
    const wasteTypeSelect = screen.getByLabelText(/waste type/i);
    await user.selectOptions(wasteTypeSelect, 'organic');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/submitting/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it('handles submission error', async () => {
    // Mock API error
    mockFetch({
      'POST /api/reports': {
        ok: false,
        status: 400,
        message: 'Validation error',
      },
    });

    const { user } = renderWithProviders(<ReportForm />);
    
    // Fill out form
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test report');
    
    const wasteTypeSelect = screen.getByLabelText(/waste type/i);
    await user.selectOptions(wasteTypeSelect, 'organic');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/failed to submit report/i)).toBeInTheDocument();
    });
  });

  it('resets form after successful submission', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    // Fill out form
    const descriptionInput = screen.getByLabelText(/description/i);
    await user.type(descriptionInput, 'Test report');
    
    const wasteTypeSelect = screen.getByLabelText(/waste type/i);
    await user.selectOptions(wasteTypeSelect, 'organic');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/report submitted successfully/i)).toBeInTheDocument();
    });
    
    // Form should be reset
    expect(descriptionInput).toHaveValue('');
    expect(wasteTypeSelect).toHaveValue('');
  });

  it('displays image previews', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const file = createMockFile('test-image.jpg', 'image/jpeg');
    const fileInput = screen.getByLabelText(/upload images/i);
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      const preview = screen.getByAltText('Preview 0');
      expect(preview).toBeInTheDocument();
    });
  });

  it('allows removing uploaded images', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const file = createMockFile('test-image.jpg', 'image/jpeg');
    const fileInput = screen.getByLabelText(/upload images/i);
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    });
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    expect(screen.queryByText('test-image.jpg')).not.toBeInTheDocument();
  });

  it('validates image with ML service', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const file = createMockFile('test-image.jpg', 'image/jpeg');
    const fileInput = screen.getByLabelText(/upload images/i);
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText(/validating image/i)).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText(/image validated/i)).toBeInTheDocument();
    });
  });

  it('handles ML validation error', async () => {
    // Mock ML validation error
    mockFetch({
      'POST /api/ml/validate': {
        ok: false,
        status: 400,
        message: 'Invalid image',
      },
    });

    const { user } = renderWithProviders(<ReportForm />);
    
    const file = createMockFile('test-image.jpg', 'image/jpeg');
    const fileInput = screen.getByLabelText(/upload images/i);
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText(/image validation failed/i)).toBeInTheDocument();
    });
  });

  it('suggests waste type based on ML classification', async () => {
    const { user } = renderWithProviders(<ReportForm />);
    
    const file = createMockFile('test-image.jpg', 'image/jpeg');
    const fileInput = screen.getByLabelText(/upload images/i);
    
    await user.upload(fileInput, file);
    
    await waitFor(() => {
      expect(screen.getByText(/suggested: organic/i)).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    renderWithProviders(<ReportForm />);
    
    // Check for proper form labels
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/waste type/i)).toBeInTheDocument();
    
    // Check for proper button attributes
    const submitButton = screen.getByRole('button', { name: /submit report/i });
    expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Check for proper form structure
    const form = screen.getByRole('form');
    expect(form).toBeInTheDocument();
  });

  it('handles geolocation error gracefully', async () => {
    // Mock geolocation error
    const mockGeolocationError = {
      getCurrentPosition: jest.fn((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      }),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocationError,
      writable: true,
    });

    renderWithProviders(<ReportForm />);
    
    await waitFor(() => {
      expect(screen.getByText(/location access denied/i)).toBeInTheDocument();
    });
  });

  it('allows manual location entry when geolocation fails', async () => {
    // Mock geolocation error
    const mockGeolocationError = {
      getCurrentPosition: jest.fn((success, error) => {
        error({ code: 1, message: 'Permission denied' });
      }),
    };

    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocationError,
      writable: true,
    });

    const { user } = renderWithProviders(<ReportForm />);
    
    await waitFor(() => {
      expect(screen.getByText(/enter location manually/i)).toBeInTheDocument();
    });
    
    const manualLocationButton = screen.getByText(/enter location manually/i);
    await user.click(manualLocationButton);
    
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
  });
});