import { BrowserRouter } from 'react-router-dom'

export function withRouter(ui: React.ReactElement) {
  return (
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  )
} 