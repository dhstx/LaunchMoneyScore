import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  label: string;
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
}

export function ScoreGauge({ score, maxScore, label, size = 'md', delay = 0 }: ScoreGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const percentage = Math.min((score / maxScore) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      const duration = 1500;
      const steps = 60;
      const increment = score / steps;
      let current = 0;
      
      const interval = setInterval(() => {
        current += increment;
        if (current >= score) {
          setDisplayScore(score);
          clearInterval(interval);
        } else {
          setDisplayScore(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [score, delay]);

  const sizeClasses = {
    sm: { container: 'w-24 h-24', text: 'text-2xl', label: 'text-xs' },
    md: { container: 'w-32 h-32', text: 'text-3xl', label: 'text-sm' },
    lg: { container: 'w-40 h-40', text: 'text-4xl', label: 'text-base' },
  };

  const getColor = () => {
    if (percentage >= 85) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStrokeColor = () => {
    if (percentage >= 85) return '#16a34a';
    if (percentage >= 70) return '#ca8a04';
    return '#dc2626';
  };

  const radius = size === 'sm' ? 40 : size === 'md' ? 54 : 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative ${sizeClasses[size].container}`}>
        <svg className="transform -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted"
            opacity="0.2"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke={getStrokeColor()}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, delay, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold ${sizeClasses[size].text} ${getColor()}`}>
            {displayScore}
          </span>
          <span className="text-xs text-muted-foreground">/ {maxScore}</span>
        </div>
      </div>
      <span className={`font-medium text-center ${sizeClasses[size].label}`}>{label}</span>
    </div>
  );
}

