import { describe, it, expect } from 'vitest'
import { screen, fireEvent, render } from '@testing-library/react'
import EnergyRecordItem from '../index'
import { withRouter } from '../../../test/test-utils'
import type { EnergyType } from '@/utils/types'

describe('能源记录项组件', () => {
  const mockRecord = {
    id: 1,
    type: 'charging' as EnergyType,
    electric: 50,
    oil: 0,
    cost: 100,
    date: Date.now(),
    kilometerOfDisplay: 1000
  }

  it('应该正确显示记录详情', () => {
    render(withRouter(<EnergyRecordItem {...mockRecord} />))
    
    expect(screen.getByText('50kWh')).toBeInTheDocument()
    expect(screen.getByText('¥100')).toBeInTheDocument()
    expect(screen.getByText('1000km')).toBeInTheDocument()
  })

  it('点击编辑按钮应该跳转到编辑页面', () => {
    const { container } = render(withRouter(<EnergyRecordItem {...mockRecord} />))
    
    const editButton = container.querySelector(".actions .antd-mobile-icon");
    fireEvent.click(editButton!)
    
    // 验证导航是否发生
    expect(window.location.pathname).toBe(`/record/${mockRecord.id}`)
  })

  it('应该显示正确的类型标签', () => {
    render(withRouter(<EnergyRecordItem {...mockRecord} />))
    expect(screen.getByText('充电')).toBeInTheDocument()
  })
  
  it('应该正确显示加油记录', () => {
    const mockRefuelingRecord = {
      ...mockRecord,
      type: 'refueling' as EnergyType,
      electric: 0,
      oil: 10,
      cost: 200,
      kilometerOfDisplay: 1200
    }
    render(withRouter(<EnergyRecordItem {...mockRefuelingRecord} />))
    
    expect(screen.getByText('加油')).toBeInTheDocument()
    expect(screen.getByText('10L')).toBeInTheDocument()
    expect(screen.getByText('¥200')).toBeInTheDocument()
    expect(screen.getByText('1200km')).toBeInTheDocument()
  })
})