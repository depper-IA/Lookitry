import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GenerationLoader } from '../GenerationLoader';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('GenerationLoader', () => {
  it('renderiza el orb con gradiente del primaryColor', () => {
    const { container } = render(
      <GenerationLoader productName="Vestido rojo" primaryColor="#FF5C3A" />
    );
    const orb = container.querySelector('.orb-animated');
    expect(orb).toBeInTheDocument();
    expect(orb?.getAttribute('style')).toContain('#FF5C3A');
  });

  it('muestra el primer mensaje por defecto', () => {
    render(<GenerationLoader productName="Vestido rojo" />);
    expect(screen.getByText('Creando tu look...')).toBeInTheDocument();
  });

  it('muestra el disclaimer estatico', () => {
    render(<GenerationLoader productName="Vestido rojo" />);
    expect(
      screen.getByText(/Las imagenes generadas por IA pueden incluir errores/i)
    ).toBeInTheDocument();
  });

  it('acepta mensajes personalizados', () => {
    render(
      <GenerationLoader
        productName="Vestido rojo"
        messages={['Procesando...', 'Un momento...']}
      />
    );
    expect(screen.getByText('Procesando...')).toBeInTheDocument();
  });
});
