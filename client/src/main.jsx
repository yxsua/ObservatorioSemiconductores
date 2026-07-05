import React from 'react'
import ReactDOM from 'react-dom/client'

function App() {
  return (
    <div className="card">
      <h1>¡Frontend Funcionando Exitosamente!</h1>
      <p>¡La sincronización con Docker y el script de compilación están operando de forma correcta!</p>
      <p><small>Entorno de desarrollo con recarga rápida activo.</small></p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)