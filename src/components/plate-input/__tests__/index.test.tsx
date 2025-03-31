import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import PlateInput from '../index'

describe('车牌号输入组件', () => {
  it('应该渲染输入框', () => {
    render(<PlateInput value="" onChange={() => {}} />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('输入变化时应该调用 onChange 函数', () => {
    const handleChange = vi.fn()
    render(<PlateInput value="" onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '京A12345' } })
    
    expect(handleChange).toHaveBeenCalledWith('京A12345')
  })

  it('应该显示占位符文本', () => {
    render(<PlateInput value="" onChange={() => {}} placeholder="请输入车牌号" />)
    const input = screen.getByPlaceholderText('请输入车牌号')
    expect(input).toBeInTheDocument()
  })

  it('禁用状态下应该禁用输入框', () => {
    render(<PlateInput value="" onChange={() => {}} disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('disabled')
  })
}) 