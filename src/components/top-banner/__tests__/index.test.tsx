import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopBanner } from '../index';

describe('TopBanner 组件', () => {
  it('当传入 title 和 visible=true 时应该正确渲染', () => {
    render(<TopBanner title="测试通知" visible={true} />);
    
    expect(screen.getByText('测试通知')).toBeInTheDocument();
    expect(screen.getByText('测试通知').closest('.top-banner')).toHaveClass('visible');
  });

  it('当 visible=false 时应该添加 hidden 类名', () => {
    render(<TopBanner title="测试通知" visible={false} />);
    
    expect(screen.getByText('测试通知').closest('.top-banner')).toHaveClass('hidden');
  });

  it('当提供 onClose 时应该显示关闭按钮并能正确触发回调', () => {
    const onClose = vi.fn();
    render(<TopBanner title="测试通知" visible={true} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('当没有提供 onClose 时不应该显示关闭按钮', () => {
    render(<TopBanner title="测试通知" visible={true} />);
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
}); 