import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SelfieUploader } from '../SelfieUploader';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../ImageEditor', () => ({
  ImageEditor: () => <div data-testid="image-editor" />,
}));

vi.mock('@/utils/imageCompression', () => ({
  compressImage: vi.fn(),
  validateImageFile: vi.fn(() => ({ valid: true })),
}));

const defaultProps = {
  onUpload: vi.fn(),
  primaryColor: '#FF5C3A',
  textColor: '#ffffff',
  mutedColor: '#999999',
};

describe('SelfieUploader', () => {
  beforeEach(() => vi.resetAllMocks());

  it('renderiza los 4 chips de guia', () => {
    render(<SelfieUploader {...defaultProps} />);
    expect(screen.getByText('Cuerpo completo')).toBeInTheDocument();
    expect(screen.getByText('Buena iluminacion')).toBeInTheDocument();
    expect(screen.getByText('Solo tu')).toBeInTheDocument();
    expect(screen.getByText('Sin manos en los bolsillos')).toBeInTheDocument();
  });

  it('renderiza la imagen guia cuando no hay preview', () => {
    render(<SelfieUploader {...defaultProps} />);
    const img = screen.getByAltText('Ejemplo de pose');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/rebecca_probador.png');
  });

  it('renderiza el boton primario Subir foto', () => {
    render(<SelfieUploader {...defaultProps} />);
    expect(screen.getByRole('button', { name: /subir foto/i })).toBeInTheDocument();
  });

  it('no renderiza el link de camara cuando showCamera es false', () => {
    render(<SelfieUploader {...defaultProps} />);
    expect(screen.queryByText(/tomar foto con camara/i)).not.toBeInTheDocument();
  });

  it('renderiza el disclaimer con links correctos', () => {
    render(<SelfieUploader {...defaultProps} />);
    const linkUso = screen.getByRole('link', { name: /politica de uso/i });
    const linkPriv = screen.getByRole('link', { name: /politica de privacidad/i });
    expect(linkUso).toHaveAttribute('href', '/politica-de-uso');
    expect(linkPriv).toHaveAttribute('href', '/politicas-privacidad');
  });

  it('muestra la preview del usuario cuando currentPreview existe', () => {
    render(<SelfieUploader {...defaultProps} currentPreview="blob:test-url" />);
    const img = screen.getByAltText('Tu selfie');
    expect(img).toHaveAttribute('src', 'blob:test-url');
    expect(screen.queryByAltText('Ejemplo de pose')).not.toBeInTheDocument();
  });
});
