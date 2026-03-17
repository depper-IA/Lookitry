#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Patch MiniLanding.tsx: actualiza ActivationModal y templates para preview mode."""

import re

FILE = 'frontend/src/components/mini-landing/MiniLanding.tsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── 1. Reemplazar el JSX del modal (titulo hardcoded + countdown + CTA sin preview) ──
# Buscamos desde el inicio del div interno hasta el cierre del componente
OLD_MODAL_INNER = (
    '        <div className="px-6 py-6 text-center">\n'
    '          <h2\n'
    '            className="text-xl font-black text-white tracking-tight mb-1"\n'
    '            style={{ fontFamily: \'Syne, sans-serif\' }}\n'
    '          >\n'
    '            Activa tu pagina de marca\n'
    '          </h2>\n'
    '          <p className="text-xs text-gray-400 leading-relaxed mb-4">\n'
    '            Estas viendo una vista previa. Activa tu mini-landing para que tus clientes puedan verla.\n'
    '          </p>\n'
    '\n'
    '          {/* Countdown */}\n'
)

if OLD_MODAL_INNER in content:
    # Encontrar el bloque completo desde aqui hasta el cierre del componente
    start = content.index(OLD_MODAL_INNER)
    # Buscar el cierre del componente ActivationModal (el '}' que cierra la funcion)
    # despues del ultimo </div> del return
    end_marker = '          <p className="text-[10px] text-gray-600 mt-2">\n            Elige tu plan en el siguiente paso \xb7 Activacion inmediata\n          </p>\n        </div>\n      </div>\n    </div>\n  );\n}'
    if end_marker in content:
        end = content.index(end_marker) + len(end_marker)
        old_block = content[start:end]

        new_block = (
            '        <div className="px-6 py-6 text-center">\n'
            '          {/* Header con gradiente del color de la marca */}\n'
            '          <div\n'
            '            className="-mx-6 -mt-6 mb-5 px-6 pt-8 pb-6 text-center"\n'
            '            style={{ background: `linear-gradient(135deg, ${primaryColor}ee 0%, ${primaryColor}99 100%)` }}\n'
            '          >\n'
            '            <div\n'
            '              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"\n'
            '              style={{ backgroundColor: \'rgba(255,255,255,0.2)\', border: \'2px solid rgba(255,255,255,0.3)\' }}\n'
            '            >\n'
            '              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">\n'
            '                <path d="M12 2L2 7l10 5 10-5-10-5z" />\n'
            '                <path d="M2 17l10 5 10-5" />\n'
            '                <path d="M2 12l10 5 10-5" />\n'
            '              </svg>\n'
            '            </div>\n'
            '            <h2 className="text-xl font-black text-white tracking-tight mb-1" style={{ fontFamily: \'Syne, sans-serif\' }}>\n'
            '              {title}\n'
            '            </h2>\n'
            '            <p className="text-xs leading-relaxed" style={{ color: \'rgba(255,255,255,0.8)\' }}>\n'
            '              {description}\n'
            '            </p>\n'
            '          </div>\n'
            '\n'
            '          {/* Precio desglosado */}\n'
            '          <div\n'
            '            className="rounded-xl px-4 py-3 mb-4 text-left space-y-1.5"\n'
            '            style={{ backgroundColor: \'#1a1a1a\', border: \'1px solid #2a2a2a\' }}\n'
            '          >\n'
            '            <div className="flex items-center justify-between">\n'
            '              <span className="text-[11px] text-gray-500">Mini-landing (pago unico)</span>\n'
            '              <div className="flex items-center gap-1.5">\n'
            '                {discountPct > 0 && (\n'
            '                  <span className="text-[10px] text-gray-600 line-through">{formatCOP(landingOriginal)}</span>\n'
            '                )}\n'
            '                <span className="text-[13px] font-bold text-white">{formatCOP(landingPrice)}</span>\n'
            '                {discountPct > 0 && (\n'
            '                  <span\n'
            '                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"\n'
            '                    style={{ backgroundColor: primaryColor + \'25\', color: primaryColor }}\n'
            '                  >\n'
            '                    -{discountPct}%\n'
            '                  </span>\n'
            '                )}\n'
            '              </div>\n'
            '            </div>\n'
            '            <div className="flex items-center justify-between">\n'
            '              <span className="text-[11px] text-gray-500">Plan BASIC (desde)</span>\n'
            '              <span className="text-[13px] font-bold text-white">{formatCOP(BASIC_PRICE)}/mes</span>\n'
            '            </div>\n'
            '            <div className="border-t border-[#2a2a2a] pt-1.5 flex items-center justify-between">\n'
            '              <span className="text-[11px] font-semibold text-gray-400">Total desde</span>\n'
            '              <span className="text-[18px] font-black text-white" style={{ fontFamily: \'Syne, sans-serif\' }}>\n'
            '                {formatCOP(totalDesde)} COP\n'
            '              </span>\n'
            '            </div>\n'
            '          </div>\n'
            '\n'
            '          {/* Features */}\n'
            '          <ul className="text-left space-y-1.5 mb-5">\n'
            '            {features.map(f => (\n'
            '              <li key={f} className="flex items-center gap-2 text-xs text-gray-300">\n'
            '                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0">\n'
            '                  <circle cx="7" cy="7" r="7" fill={primaryColor + \'25\'} />\n'
            '                  <path d="M4 7l2 2 4-4" stroke={primaryColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />\n'
            '                </svg>\n'
            '                {f}\n'
            '              </li>\n'
            '            ))}\n'
            '          </ul>\n'
            '\n'
            '          {/* CTA principal */}\n'
            '          <a\n'
            '            href={CHECKOUT_URL}\n'
            '            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95 mb-3"\n'
            '            style={{ backgroundColor: primaryColor, boxShadow: `0 6px 20px ${primaryColor}40` }}\n'
            '          >\n'
            '            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">\n'
            '              <path d="M5 12h14M12 5l7 7-7 7" />\n'
            '            </svg>\n'
            '            Ver planes y activar\n'
            '          </a>\n'
            '\n'
            '          {/* Boton ver preview */}\n'
            '          {onPreview && (\n'
            '            <button\n'
            '              onClick={onPreview}\n'
            '              className="w-full py-2.5 rounded-2xl text-xs font-semibold transition-all hover:opacity-80 mb-2"\n'
            '              style={{ backgroundColor: \'#1a1a1a\', color: \'#888\', border: \'1px solid #2a2a2a\' }}\n'
            '            >\n'
            '              Ver como queda primero (3 min)\n'
            '            </button>\n'
            '          )}\n'
            '          <p className="text-[10px] text-gray-600 mt-2">\n'
            '            Elige tu plan en el siguiente paso \xb7 Activacion inmediata\n'
            '          </p>\n'
            '        </div>\n'
            '      </div>\n'
            '    </div>\n'
            '  );\n'
            '}'
        )
        content = content[:start] + new_block + content[end:]
        print('Modal JSX reemplazado OK')
    else:
        print('ERROR: end_marker no encontrado')
        idx = content.find('Elige tu plan en el siguiente paso')
        print(f'Posicion del texto: {idx}')
        if idx > 0:
            print(repr(content[idx-10:idx+120]))
else:
    print('ERROR: OLD_MODAL_INNER no encontrado')
    idx = content.find('Activa tu pagina de marca')
    print(f'Posicion: {idx}')
    if idx > 0:
        print(repr(content[idx-300:idx+50]))

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)
print('Archivo guardado')
