import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { AppRoutes } from './routes/AppRoutes'
import { TooltipProvider } from './components/ui/tooltip'





function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
