import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { ConfigProvider } from 'antd-mobile'
import { EditSFill } from "antd-mobile-icons";
import type { EnergyType } from "@/utils/types";
import type { Record as IRecord } from "@/store/recordStore";
import "./style.scss";

interface EnergyRecordItemProps extends IRecord {
  amount?: number;
  onClick?: () => void;
}

const EnergyTypeLabel: Record<EnergyType, string> = {
  charging: "充电",
  refueling: "加油",
};

const EnergyUnit: Record<EnergyType, string> = {
  charging: "kWh",
  refueling: "L",
};

const EnergyRecordItem: FC<EnergyRecordItemProps> = (props) => {
  const navi = useNavigate();
  const {
    id,
    type = "charging",
    date = "2024-02-28",
    cost = 0,
    electric = 0,
    oil = 0,
    kilometerOfDisplay = 0,
    onClick,
  } = props;
  const amount = electric || oil;

  const goEdit = () => {
    navi(`/record/${String(id)}`);
  };

  return (
    <ConfigProvider>
      <div className={`energy-record-item ${type}`} onClick={onClick}>
        <div className="actions">
          <EditSFill onClick={goEdit} />
        </div>
        <div className="record-header">
          <span className="energy-type">{EnergyTypeLabel[type]}</span>
          <span className="record-date">
            {dayjs(date).format("YYYY.MM.DD")}
          </span>
        </div>
        <div className="record-details">
          <div className="detail-row">
            <span className="label">数量：</span>
            <span className="value">
              {amount}
              {EnergyUnit[type]}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">费用：</span>
            <span className="value">¥{cost}</span>
          </div>
          <div className="detail-row">
            <span className="label">单价：</span>
            <span className="value">
              ¥{(cost / amount).toFixed(2)}/{EnergyUnit[type]}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">行驶里程：</span>
            <span className="value">{kilometerOfDisplay}km</span>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default EnergyRecordItem 