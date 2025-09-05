import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MonthlyStatisticsItem from '../index'

describe('MonthlyStatisticsItem', () => {
  const defaultProps = {
    month: '2024-01',
    mileage: 1250,
    refuelingRecords: [
      { amount: 15.2, cost: 78.56 },
      { amount: 18.4, cost: 95.20 },
      { amount: 12.0, cost: 60.80 }
    ],
    chargingRecords: [
      { amount: 120.8, cost: 222.22 }
    ],
    onClick: vi.fn(),
  }

  it('renders correctly with all props', () => {
    render(<MonthlyStatisticsItem {...defaultProps} />)
    
    expect(screen.getByText('2024年01月')).toBeInTheDocument()
    expect(screen.getByText('总计')).toBeInTheDocument()
    expect(screen.getByText('平均')).toBeInTheDocument()
    expect(screen.getByText('1250km')).toBeInTheDocument()
    expect(screen.getByText('234.56')).toBeInTheDocument()
    expect(screen.getByText('222.22')).toBeInTheDocument()
    expect(screen.getByText('456.78')).toBeInTheDocument() // 自动计算得出：234.56 + 222.22
    expect(screen.getByText('45.6')).toBeInTheDocument()
    expect(screen.getByText('120.8')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('formats month correctly', () => {
    render(<MonthlyStatisticsItem {...defaultProps} month="2024-12" />)
    expect(screen.getByText('2024年12月')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const mockOnClick = vi.fn()
    render(<MonthlyStatisticsItem {...defaultProps} onClick={mockOnClick} />)
    
    const item = screen.getByText('2024年01月').closest('.monthly-statistics-item')
    if (item) {
      (item as HTMLElement).click()
    }
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('displays "- km" when mileage is undefined', () => {
    render(<MonthlyStatisticsItem {...defaultProps} mileage={undefined} />)
    expect(screen.getByText('- km')).toBeInTheDocument()
  })

  it('displays "- km" when mileage is 0', () => {
    render(<MonthlyStatisticsItem {...defaultProps} mileage={0} />)
    expect(screen.getByText('- km')).toBeInTheDocument()
  })
})
