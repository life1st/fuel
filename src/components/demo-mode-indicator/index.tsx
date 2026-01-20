import { FC } from 'react';
import useRecordStore from '@/store/recordStore';
import './style.scss';

const DemoModeIndicator: FC = () => {
  const { demoMode } = useRecordStore();

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
