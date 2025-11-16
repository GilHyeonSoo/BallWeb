import { useEffect, useState } from 'react';

interface AnimatedTextProps {
  text: string;
  className?: string;
}

export default function AnimatedText({ text, className = '' }: AnimatedTextProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className={`${className} ${visible ? 'animate-fade-in' : 'opacity-0'}`}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="inline-block animate-bounce-in"
          style={{
            animationDelay: `${index * 0.2}s`,
            animationFillMode: 'both'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </div>
  );
}
