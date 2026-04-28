'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const words = [
  { text: '❤️', color: '#161616ff', isEmoji: true },
  { text: 'AMOR', color: '#161616ff', isEmoji: false },
  { text: 'PASION', color: '#161616ff', isEmoji: false },
  { text: 'AI', color: '#161616ff', isEmoji: false },
  { text: 'CODE', color: '#161616ff', isEmoji: false },
  { text: 'PIZZA', color: '#161616ff', isEmoji: false },
  { text: 'CAFE', color: '#161616ff', isEmoji: false },
];

export default function DynamicLoveAnimation() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % words.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center mx-1.5 h-6 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index].text}
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -24, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 200,
            damping: 20,
            mass: 1
          }}
          className={`font-bold tracking-wider inline-block ${words[index].isEmoji ? 'text-base' : 'text-[11px] sm:text-xs'}`}
          style={{ color: words[index].color }}
        >
          {words[index].text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
