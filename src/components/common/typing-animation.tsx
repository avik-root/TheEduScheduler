'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TypingAnimationProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}

export function TypingAnimation({ text, className, speed = 150, delay = 2000 }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [loopNum, setLoopNum] = React.useState(0);

  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleTyping = () => {
      if (!isDeleting && displayedText.length < text.length) {
        setDisplayedText(text.substring(0, displayedText.length + 1));
      } else if (isDeleting && displayedText.length > 0) {
        setDisplayedText(text.substring(0, displayedText.length - 1));
      } else if (!isDeleting && displayedText.length === text.length) {
        timeoutId = setTimeout(() => setIsDeleting(true), delay);
      } else if (isDeleting && displayedText.length === 0) {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
      }
    };

    const typingInterval = setInterval(handleTyping, isDeleting ? speed / 2 : speed);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(timeoutId);
    };
  }, [displayedText, isDeleting, text, speed, delay, loopNum]);

  return (
    <span className={cn('relative', className)}>
      {displayedText}
      <span className="animate-blink border-l-[1.5px] border-current absolute right-[-2px] top-[2px] bottom-[2px]"></span>
    </span>
  );
}
