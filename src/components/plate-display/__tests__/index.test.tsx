import { describe, it, expect } from 'vitest'
import { render, screen,  } from '@testing-library/react'
import PlateDisplay from '../index'

describe("车牌显示组件", () => {
  it("正确渲染燃油车牌", () => {
    render(<PlateDisplay plate="京A12345" />);

    const plate = screen.getByLabelText("京A-12345");
    expect(plate).toBeInTheDocument();
    expect(plate.closest(".plate-display")).not.toHaveClass("plate-display--new-energy");
  });

  it("正确渲染新能源车牌", () => {
    render(<PlateDisplay plate="京A123456" />);

    const plate = screen.getByLabelText("京A-123456");
    expect(plate).toBeInTheDocument();
    expect(plate.closest(".plate-display")).toHaveClass("plate-display--new-energy");
  });

  it("应用正确的大小类", () => {
    render(<PlateDisplay plate="京A12345" size="large" />);
    expect(screen.getByLabelText("京A-12345").closest(".plate-display")).toHaveClass(
      "plate-display--large"
    );
  });

  it("处理空的车牌号", () => {
    const { container } = render(<PlateDisplay plate="" />);
    expect(container.querySelector('.plate-display')).toBeInTheDocument()
  });
}); 