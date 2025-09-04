import { describe, it, expect } from 'vitest'
import { screen, fireEvent, render } from '@testing-library/react'
import TabBar from '../index'
import { withRouter } from '@/test/test-utils'
import { MemoryRouter } from 'react-router-dom'

describe('标签栏组件', () => {
  it('应该渲染所有标签项', () => {
    render(withRouter(<TabBar />))
    
    expect(screen.getByText('历史')).toBeInTheDocument()
    expect(screen.getByText('统计')).toBeInTheDocument()
    expect(screen.getByText('设置')).toBeInTheDocument()
  })

  it('点击标签应该跳转到对应路由', () => {
    render(withRouter(<TabBar />))
    
    const chartTab = screen.getByText('统计')
    fireEvent.click(chartTab)
    
    // 由于我们使用了 BrowserRouter，这里可以检查 URL 是否改变
    expect(window.location.pathname).toBe('/chart')
  })

  it('当前标签应该应用激活样式', () => {
    // 使用 MemoryRouter 模拟路由
    render(
      <MemoryRouter initialEntries={['/']}>
        <TabBar />
      </MemoryRouter>
    )

    const homeTab = screen.getByText('历史').parentNode
    
    expect(homeTab).toHaveClass('active')

    // 测试其他标签的激活状态
    // 例如，模拟导航到统计页面
    fireEvent.click(screen.getByText('统计'))

    const chartTab = screen.getByText('统计').parentNode
    expect(chartTab).toHaveClass('active')
    expect(homeTab).not.toHaveClass('active')
  })
}) 