import { FC } from 'react';
import useRecordStore from '@/store/recordStore';
import './style.scss';
import { useLocation } from 'react-router-dom';

const DemoModeIndicator: FC = () => {
  const { demoMode } = useRecordStore();
  const location = useLocation();

  const isYearStat = location.pathname.startsWith('/year-stat');

  if (isYearStat) return null;
  if (!demoMode) return null;

  return (
    <div className="demo-mode-indicator-placeholder">
      <div className="demo-mode-indicator-fixed">
        DEMO MODE
      </div>
    </div>
  );
};

export default DemoModeIndicator;
