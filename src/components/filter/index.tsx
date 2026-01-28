import { FC, ReactNode, useState } from 'react';
import { Selector, DatePicker, Button, Mask, Switch } from 'antd-mobile';
import dayjs from 'dayjs';
import useFilterStore from '@/store/filterStore';
import type { EnergyType } from '@/utils/types';
import './style.scss';

interface FilterProps {
  trigger?: ReactNode;
}

const Filter: FC<FilterProps> = ({ trigger }) => {
  const { energyType, month, onlySummary, setEnergyType, setMonth, setOnlySummary, resetFilters } = useFilterStore();
  const [dateVisible, setDateVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  
  const handleEnergyTypeChange = (arr: string[]) => {
    const type = arr[0] as EnergyType | 'all';
    setEnergyType(type);
    setFilterVisible(false);
  };

  const handleMonthChange = (date: Date) => {
    const monthStr = dayjs(date).format('YYYY-MM');
    setMonth(monthStr);
    setDateVisible(false);
    setFilterVisible(false);
  };

  const handleReset = () => {
    resetFilters();
    setFilterVisible(false);
  };

  const handleClearMonth = () => {
    setMonth(null);
    setFilterVisible(false);
  };

  const toggleFilter = () => {
    setFilterVisible(!filterVisible);
  };

  // 判断是否有筛选条件
  const hasFilters = energyType !== 'all' || month !== null || onlySummary;
  
  // 默认触发器
  const defaultTrigger = (
    <div className="filter-trigger-container">
      <button 
        className={`filter-toggle ${filterVisible ? 'active' : ''} ${hasFilters ? 'has-filters' : ''}`} 
        onClick={toggleFilter}
      >
        筛选
        {hasFilters && <span className="filter-badge"></span>}
      </button>
      
      {hasFilters && (
        <button 
          className="filter-reset-button" 
          onClick={(e) => {
            e.stopPropagation();
            resetFilters();
          }}
        >
          重置
        </button>
      )}
    </div>
  );

  return (
    <>
      {trigger ? (
        <div onClick={toggleFilter}>{trigger}</div>
      ) : (
        defaultTrigger
      )}

      {filterVisible && (
        <Mask visible={filterVisible} onMaskClick={() => setFilterVisible(false)}>
          <div className="filter-container">
            <div className="filter-section">
              <div className="filter-label">补能类型</div>
              <Selector
                options={[
                  { label: '全部', value: 'all' },
                  { label: '充电', value: 'charging' },
                  { label: '加油', value: 'refueling' }
                ]}
                value={[energyType]}
                onChange={handleEnergyTypeChange}
                multiple={false}
                className={`filter-selector ${energyType}`}
              />
            </div>
            
            <div className="filter-section">
              <div className="filter-label">月份筛选</div>
              <div className="month-filter">
                <Button
                  className="month-button"
                  onClick={() => setDateVisible(true)}
                  fill="outline"
                  size="small"
                >
                  {month ? dayjs(month).format('YYYY年MM月') : '选择月份'}
                </Button>
                
                {month && (
                  <Button
                    className="clear-button"
                    onClick={handleClearMonth}
                    fill="none"
                    size="small"
                  >
                    清除
                  </Button>
                )}
              </div>
              
              <DatePicker
                visible={dateVisible}
                onClose={() => setDateVisible(false)}
                precision="month"
                onConfirm={handleMonthChange}
                max={new Date()}
                value={month ? dayjs(month).toDate() : new Date()}
              />
            </div>
            
            <div className="filter-section switch-section">
              <div className="filter-label">只看汇总</div>
              <Switch
                checked={onlySummary}
                onChange={(checked) => {
                  setOnlySummary(checked);
                  setFilterVisible(false);
                }}
                className="filter-switch"
                style={{
                  '--checked-color': '#ff9500',
                  '--height': '24px',
                  '--width': '44px',
                }}
              />
            </div>

            <div className="filter-actions">
              <Button 
                size="small" 
                onClick={handleReset}
                color="danger"
              >
                重置筛选
              </Button>
            </div>
          </div>
        </Mask>
      )}
    </>
  );
};

export default Filter;
