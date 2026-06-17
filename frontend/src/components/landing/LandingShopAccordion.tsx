'use client';

import React, { useState } from 'react';
import Image from 'next/image';

const items = [
  {
    id: 1,
    title: 'Tu catálogo',
    src: '/assets/tryon/showcase/model-1.webp',
  },
  {
    id: 2,
    title: 'Prueba virtual',
    src: '/assets/tryon/showcase/model-2.webp',
  },
  {
    id: 3,
    title: 'Vende más',
    src: '/assets/tryon/showcase/model-3.webp',
  },
  {
    id: 4,
    title: 'Lista hoy',
    src: '/assets/tryon/showcase/model-4.webp',
  },
];

interface PanelProps {
  item: (typeof items)[0];
  isActive: boolean;
  onEnter: () => void;
  index: number;
}

function Panel({ item, isActive, onEnter, index }: PanelProps) {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-700 ease-in-out h-full ${
        isActive ? 'flex-[5]' : 'flex-[0.65]'
      }`}
      onMouseEnter={onEnter}
      role="button"
      tabIndex={0}
      onFocus={onEnter}
      aria-label={item.title}
    >
      <Image
        src={item.src}
        alt={item.title}
        fill
        priority={index === 1}
        className="object-cover object-top transition-transform duration-700 ease-in-out"
        style={{ transform: isActive ? 'scale(1.03)' : 'scale(1)' }}
        sizes="(max-width: 1024px) 100vw, 30vw"
      />

      {/* Gradient: stronger at bottom, light at top */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isActive
            ? 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.15) 50%, transparent 100%)'
            : 'linear-gradient(to top, rgba(0,0,0,0.70) 0%, rgba(0,0,0,0.30) 60%, rgba(0,0,0,0.10) 100%)',
        }}
      />

      {/* Active indicator dot */}
      <span
        className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-[#FF5C3A] transition-opacity duration-300 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* Label */}
      <span
        className={`absolute text-white font-semibold whitespace-nowrap transition-all duration-500 ease-in-out ${
          isActive
            ? 'bottom-5 left-4 text-[13px] rotate-0 opacity-100'
            : 'bottom-20 left-1/2 -translate-x-1/2 text-[12px] rotate-90 origin-center opacity-60'
        }`}
      >
        {item.title}
      </span>
    </div>
  );
}

export function LandingShopAccordion() {
  const [activeIndex, setActiveIndex] = useState(1);

  return (
    <div className="flex flex-row gap-2.5 h-[460px]">
      {items.map((item, i) => (
        <Panel
          key={item.id}
          item={item}
          index={i}
          isActive={i === activeIndex}
          onEnter={() => setActiveIndex(i)}
        />
      ))}
    </div>
  );
}
