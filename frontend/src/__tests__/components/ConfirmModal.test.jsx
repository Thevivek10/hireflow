import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmModal from '../../components/ConfirmModal';

describe('ConfirmModal Component', () => {
  const defaultProps = {
    open: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn()
  };

  describe('Rendering', () => {
    it('should render modal when open is true', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    });

    it('should not render modal when open is false', () => {
      render(<ConfirmModal {...defaultProps} open={false} />);
      expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
    });

    it('should render title correctly', () => {
      render(<ConfirmModal {...defaultProps} title="Delete Item" />);
      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('should render message correctly', () => {
      render(<ConfirmModal {...defaultProps} message="This action cannot be undone" />);
      expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
    });

    it('should render with default confirm label', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should render with custom confirm label', () => {
      render(<ConfirmModal {...defaultProps} confirmLabel="Delete" />);
      expect(screen.getByText('Delete')).toBeInTheDocument();
    });

    it('should render with default cancel label', () => {
      render(<ConfirmModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render with custom cancel label', () => {
      render(<ConfirmModal {...defaultProps} cancelLabel="Go Back" />);
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when backdrop is clicked', () => {
      const onCancel = vi.fn();
      render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

      const backdrop = screen.getByText('Confirm Action').closest('.modal-backdrop');
      fireEvent.click(backdrop!);

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel when modal card is clicked', () => {
      const onCancel = vi.fn();
      render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

      const modalCard = screen.getByText('Confirm Action').closest('.modal-card');
      fireEvent.click(modalCard!);

      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should stop propagation when clicking inside modal', () => {
      const onCancel = vi.fn();
      render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

      const modalCard = screen.getByText('Confirm Action').closest('.modal-card');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      const stopPropagationSpy = vi.spyOn(clickEvent, 'stopPropagation');

      modalCard!.dispatchEvent(clickEvent);

      expect(stopPropagationSpy).toHaveBeenCalled();
    });
  });

  describe('Button Styling', () => {
    it('should apply btn-secondary class to cancel button', () => {
      render(<ConfirmModal {...defaultProps} />);
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toHaveClass('btn-secondary');
    });

    it('should apply btn-danger class to confirm button', () => {
      render(<ConfirmModal {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('btn-danger');
    });
  });

  describe('Modal Structure', () => {
    it('should have modal-backdrop class', () => {
      render(<ConfirmModal {...defaultProps} />);
      const backdrop = screen.getByText('Confirm Action').closest('.modal-backdrop');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have modal-card class', () => {
      render(<ConfirmModal {...defaultProps} />);
      const card = screen.getByText('Confirm Action').closest('.modal-card');
      expect(card).toBeInTheDocument();
    });

    it('should have modal-header class', () => {
      render(<ConfirmModal {...defaultProps} />);
      const header = screen.getByText('Confirm Action').parentElement;
      expect(header).toHaveClass('modal-header');
    });

    it('should have modal-body class', () => {
      render(<ConfirmModal {...defaultProps} />);
      const body = screen.getByText('Are you sure you want to proceed?').parentElement;
      expect(body).toHaveClass('modal-body');
    });

    it('should have modal-footer class', () => {
      render(<ConfirmModal {...defaultProps} />);
      const footer = screen.getByText('Confirm').parentElement;
      expect(footer).toHaveClass('modal-footer');
    });

    it('should have modal-title class on title', () => {
      render(<ConfirmModal {...defaultProps} />);
      const title = screen.getByText('Confirm Action');
      expect(title).toHaveClass('modal-title');
    });
  });

  describe('Accessibility', () => {
    it('should render buttons with type="button"', () => {
      render(<ConfirmModal {...defaultProps} />);
      const confirmButton = screen.getByText('Confirm');
      const cancelButton = screen.getByText('Cancel');

      expect(confirmButton).toHaveAttribute('type', 'button');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty title', () => {
      render(<ConfirmModal {...defaultProps} title="" />);
      const titleElement = document.querySelector('.modal-title');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe('');
    });

    it('should handle empty message', () => {
      render(<ConfirmModal {...defaultProps} message="" />);
      const body = document.querySelector('.modal-body p');
      expect(body).toBeInTheDocument();
      expect(body?.textContent).toBe('');
    });

    it('should handle long title', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines';
      render(<ConfirmModal {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long message', () => {
      const longMessage = 'This is a very long message that contains a lot of text and might wrap to multiple lines in the modal body';
      render(<ConfirmModal {...defaultProps} message={longMessage} />);
      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });

  describe('Custom Labels', () => {
    it('should handle custom confirm and cancel labels together', () => {
      render(
        <ConfirmModal
          {...defaultProps}
          confirmLabel="Yes, Delete"
          cancelLabel="No, Keep It"
        />
      );

      expect(screen.getByText('Yes, Delete')).toBeInTheDocument();
      expect(screen.getByText('No, Keep It')).toBeInTheDocument();
    });
  });

  describe('Callback Behavior', () => {
    it('should not call callbacks on mount', () => {
      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} onCancel={onCancel} />);

      expect(onConfirm).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onConfirm only once per click', () => {
      const onConfirm = vi.fn();
      render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(2);
    });
  });
});
