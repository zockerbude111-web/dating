import { CheckCircle } from 'lucide-react';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  verified?: boolean;
  className?: string;
}

export default function Avatar({ name, color, size = 40, verified, className = '' }: AvatarProps) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  
  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        className="rounded-full flex items-center justify-center text-white font-bold shadow-lg"
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          fontSize: size * 0.36,
        }}
      >
        {initials}
      </div>
      {verified && (
        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5">
          <CheckCircle size={size * 0.35} className="text-primary-600 fill-primary-100" />
        </div>
      )}
    </div>
  );
}
