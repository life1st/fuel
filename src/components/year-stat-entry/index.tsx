import { FC } from 'react';
import { RightOutline } from 'antd-mobile-icons';
import './style.scss';

interface Props {
  year: number;
  onClick?: () => void;
}

const YearStatEntry: FC<Props> = ({ year, onClick }) => {
  return (
    <div className="year-stat-entry" onClick={onClick}>
      <div className="year-stat-content">
        {/* <div className="icon">📊</div> */}
        <div className="info">
          <div className="title"><span className="year-num">{year}</span>年度用车报告</div>
        </div>
        <RightOutline />
      </div>
    </div>
  );
};

export default YearStatEntry;
