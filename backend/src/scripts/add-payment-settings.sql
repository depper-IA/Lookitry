-- Migración: Crear tabla payment_settings
-- Tabla singleton (id=1) para configuración de medios de pago del sistema

CREATE TABLE IF NOT EXISTS payment_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,

  -- Wompi
  wompi_enabled BOOLEAN DEFAULT false NOT NULL,
  wompi_public_key TEXT DEFAULT '' NOT NULL,
  wompi_private_key TEXT DEFAULT '' NOT NULL,
  wompi_events_secret TEXT DEFAULT '' NOT NULL,
  wompi_integrity_secret TEXT DEFAULT '' NOT NULL,
  wompi_test_mode BOOLEAN DEFAULT true NOT NULL,

  -- PayPal
  paypal_enabled BOOLEAN DEFAULT false NOT NULL,
  paypal_email TEXT DEFAULT '' NOT NULL,
  paypal_client_id TEXT DEFAULT '' NOT NULL,
  paypal_client_secret TEXT DEFAULT '' NOT NULL,
  paypal_sandbox BOOLEAN DEFAULT true NOT NULL,

  -- Pago manual (instrucciones libres)
  manual_enabled BOOLEAN DEFAULT true NOT NULL,
  manual_instructions TEXT DEFAULT 'Realiza el pago y envía el comprobante por WhatsApp o email.' NOT NULL,
  manual_bank_name TEXT DEFAULT '' NOT NULL,
  manual_account_number TEXT DEFAULT '' NOT NULL,
  manual_account_holder TEXT DEFAULT '' NOT NULL,
  manual_whatsapp TEXT DEFAULT '' NOT NULL,
  manual_email TEXT DEFAULT '' NOT NULL,

  -- Transferencia bancaria
  transfer_enabled BOOLEAN DEFAULT false NOT NULL,
  transfer_bank_name TEXT DEFAULT '' NOT NULL,
  transfer_account_number TEXT DEFAULT '' NOT NULL,
  transfer_account_type TEXT DEFAULT 'Ahorros' NOT NULL,
  transfer_account_holder TEXT DEFAULT '' NOT NULL,
  transfer_nit TEXT DEFAULT '' NOT NULL,

  -- General
  currency TEXT DEFAULT 'COP' NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Garantizar que solo exista una fila
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar fila inicial si no existe
INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
