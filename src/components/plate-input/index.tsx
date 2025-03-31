import { FC, useState, useEffect, useMemo } from "react";
import cls from "classnames";
import { Button } from "antd-mobile";
import { Input, Popup } from "antd-mobile";
import Keyboard from "./keyboard";
import "./style.scss";

interface PlateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  submitText?: string;
  disabled?: boolean;
}

const PlateInput: FC<PlateInputProps> = ({
  value = "",
  onChange,
  onSubmit,
  placeholder = "请输入车牌号",
  submitText = "提交",
  disabled = false,
}) => {
  const [plate, setPlate] = useState(value);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setPlate(value);
  }, [value]);

  const handleChange = (val: string) => {
    // 转换为大写
    val = val.toUpperCase();

    // 限制长度
    if (val.length > 8) return;

    setPlate(val);
    onChange?.(val);
  };

  const handleKeyPress = (key: string) => {
    handleChange(plate + key);
  };

  const handleClear = () => {
    setPlate("");
  };

  const handleDelete = () => {
    const newPlate = plate.slice(0, -1);
    handleChange(newPlate);

    // 如果删除到第一个字符，重新显示省份选择
    if (newPlate.length === 0) {
      setVisible(true);
    }
  };

  const handleDone = () => {
    setVisible(false);
  };

  const currentLength = plate.replace(/\s/g, "").length;
  const formatPlate = useMemo(() => {
    // 根据输入位置自动添加空格
    let formattedPlate = plate;
    if (plate.length > 2) {
      formattedPlate = plate.slice(0, 2) + "-" + plate.slice(2);
    }
    return formattedPlate;
  }, [plate]);

  return (
    <>
      <div
        className="plate-input"
        onClick={() => {
          if (disabled) return;
          setVisible(true);
        }}
      >
        <Input
          value={plate}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cls("plate-input-field", {
            empty: plate.length === 0,
          })}
        />
        <div className="plate-input-mask">
          {formatPlate.split("").map((char, index) => (
            <div
              key={index}
              className={`plate-input-char ${char === "-" ? "space" : ""}`}
            >
              {char}
            </div>
          ))}
        </div>
      </div>
      <Button
        className="plate-input-submit"
        onClick={() => {
          onSubmit?.(plate);
        }}
      >
        {submitText}
      </Button>
      <Popup
        visible={visible}
        onMaskClick={() => {
          setVisible(false);
        }}
        position="bottom"
        bodyStyle={{
          borderTopLeftRadius: "8px",
          borderTopRightRadius: "8px",
          minHeight: "40vh",
        }}
      >
        <div
          className="plate-input"
          onClick={() => {
            if (disabled) return;
            setVisible(true);
          }}
        >
          <Input
            value={plate}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={false}
            className={cls("plate-input-field", {
              empty: plate.length === 0,
            })}
          />
          <div className="plate-input-mask">
            {formatPlate.split("").map((char, index) => (
              <div
                key={index}
                className={`plate-input-char ${char === "-" ? "space" : ""}`}
              >
                {char}
              </div>
            ))}
          </div>
        </div>
        <Keyboard
          onKeyPress={handleKeyPress}
          onDelete={handleDelete}
          onDone={handleDone}
          onClear={handleClear}
          currentLength={currentLength}
        />
      </Popup>
    </>
  );
};

export default PlateInput;
