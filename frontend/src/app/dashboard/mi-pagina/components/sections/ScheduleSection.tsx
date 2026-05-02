'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

interface ScheduleSectionProps {
  schedule: Record<string, string>;
  setSchedule: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
}

export function ScheduleSection({ schedule, setSchedule }: ScheduleSectionProps) {
  const sectionStyle = "p-6 md:p-8 xl:p-10 space-y-6 relative overflow-hidden group";
  const labelStyle = "text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-4 block leading-none opacity-80";
  const inputStyle = "w-full px-6 py-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] text-sm font-semibold text-[var(--text-primary)] focus:border-[#FF5C3A] hover:bg-[var(--bg-hover)] focus:ring-4 focus:ring-[#FF5C3A]/5 outline-none transition-all placeholder:text-[var(--text-muted)] shadow-sm";

  const scheduleDays = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];

  return (
    <motion.section variants={itemVariants} className={sectionStyle}>
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
        <Clock size={45} />
      </div>
      <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
        <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center shadow-inner">
          <Clock className="w-6 h-6 text-[#FF5C3A]" />
        </div>
        <div>
          <h3 className="text-lg font-black text-[var(--text-primary)] italic uppercase tracking-tighter leading-none">Horarios</h3>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest mt-1 opacity-60 italic">Disponibilidad por dia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {scheduleDays.map((day) => (
          <div key={day} className="space-y-3">
            <label className={labelStyle}>{day}</label>
            <input
              type="text"
              value={schedule[day] || schedule[day.toLowerCase()] || ''}
              onChange={(e) => setSchedule((prev) => ({ ...prev, [day]: e.target.value }))}
              placeholder="Ej: 9am - 6pm / Cerrado"
              className={inputStyle}
            />
          </div>
        ))}
      </div>
    </motion.section>
  );
}