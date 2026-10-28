import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import { LeftOutline } from 'antd-mobile-icons'
import SyncIndicator from '@/components/sync-indicator'
import './style.scss'

interface NavigateProps {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}

const Navigate: FC<NavigateProps> = ({ 
  title, 
  onBack,
  right
}) => {
  const navigate = useNavigate()
  
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      void navigate(-1);
    }
  }

  return (
    <div className="navigate-header">
      <button className="back-button" onClick={handleBack}>
        <LeftOutline />
      </button>
      <div className="navigate-title-wrap">
        <h1>{title}</h1>
        <SyncIndicator />
      </div>
      {right && <div className="right-content">{right}</div>}
    </div>
  )
}

export default Navigate 