import { FC } from 'react';
import './styles.scss';

interface TopBannerProps {
  title?: string;
  visible?: boolean;
  onClose?: () => void;
}

export const TopBanner: FC<TopBannerProps> = ({ 
  title, 
  visible,
  onClose 
}) => {

  return (
    <div className={`top-banner ${visible ? 'visible' : 'hidden'}`}>
      <div className="top-banner-content">
        <span>{title}</span>
        {onClose && (
          <button className="top-banner-close" onClick={onClose}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}; 