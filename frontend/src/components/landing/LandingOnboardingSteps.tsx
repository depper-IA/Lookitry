'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, UploadCloud, ShoppingBag, ArrowRight } from 'lucide-react';
import { LANDING_COPY } from './LandingCopy';

const icons = {
  CreditCard: CreditCard,
  UploadCloud: UploadCloud,
  ShoppingBag: ShoppingBag,
};

const LandingOnboardingSteps = () => {
  const { steps, title } = LANDING_COPY.onboarding;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };

  return (
    <section className="py-24 bg-black dark:bg-white overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-white dark:text-gray-900 mb-6 font-jakarta tracking-tight">
            {title}
          </h2>
          <div className="w-24 h-1.5 bg-[#FF5C3A] mx-auto rounded-full" />
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
        >
          {steps.map((step, index) => {
            const IconComponent = icons[step.icon as keyof typeof icons];

            return (
              <motion.div
                key={step.id}
                variants={itemVariants}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-8">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-24 h-24 rounded-3xl bg-white/10 dark:bg-gray-100 border border-white/20 dark:border-gray-200 flex items-center justify-center relative z-10 shadow-lg transition-colors group-hover:border-[#FF5C3A]/50"
                  >
                    <IconComponent className="w-10 h-10 text-[#FF5C3A]" strokeWidth={1.5} />

                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#FF5C3A] text-white flex items-center justify-center font-bold text-sm border-4 border-black dark:border-white">
                      {step.id}
                    </div>
                  </motion.div>

                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[120%] w-full z-0 opacity-20">
                       <ArrowRight className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white dark:text-gray-900 mb-4 font-jakarta">
                  {step.title}
                </h3>
                <p className="text-white/60 dark:text-gray-500 leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default LandingOnboardingSteps;
