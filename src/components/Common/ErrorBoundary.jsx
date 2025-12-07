import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-xl max-w-2xl w-full border border-red-100">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal 😢</h1>
            <p className="text-slate-600 mb-4">Se ha producido un error inesperado en la aplicación.</p>
            
            <div className="bg-slate-900 text-slate-50 p-4 rounded-lg overflow-auto max-h-64 text-xs font-mono mb-6">
              <p className="text-red-300 font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
              <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
            </div>
            
            <button 
              onClick={() => window.location.reload()} 
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold transition-colors"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
