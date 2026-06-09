import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearCache = () => {
    if (confirm('คุณต้องการล้างแคชการตั้งค่าทั้งหมดของโปรแกรมเพื่อรีเซ็ตใหม่หรือไม่? (ค่าคีย์ API และโฟลเดอร์ต่างๆ ที่บันทึกไว้จะถูกรีเซ็ต)')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, #0f172a, #020617)',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          color: '#f8fafc',
          padding: '24px',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '640px',
            width: '100%',
            background: 'rgba(30, 41, 59, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
            textAlign: 'center',
            boxSizing: 'border-box',
            animation: 'fadeIn 0.5s ease-out'
          }}>
            {/* Error Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px auto',
              color: '#ef4444',
              fontSize: '32px'
            }}>
              ⚠️
            </div>

            {/* Error Message */}
            <h1 style={{
              fontSize: '22px',
              fontWeight: 800,
              marginBottom: '12px',
              background: 'linear-gradient(to right, #f87171, #ef4444)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              ขออภัยด้วยครับบอส! ระบบพบข้อผิดพลาดรุนแรง
            </h1>
            
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              lineHeight: 1.6,
              marginBottom: '28px'
            }}>
              แอปพลิเคชัน React แครชจากการทำงานบางอย่าง (เช่น การโหลดข้อมูล/พิกัดพรีวิวที่ไม่สมบูรณ์) บอสสามารถกดรีโหลดหน้าเว็บเพื่อใช้งานต่อได้ทันทีครับ
            </p>

            {/* Technical Detail Card */}
            {this.state.error && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '16px 20px',
                textAlign: 'left',
                marginBottom: '32px',
                maxHeight: '200px',
                overflowY: 'auto',
                boxSizing: 'border-box'
              }}>
                <div style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  marginBottom: '6px'
                }}>
                  ข้อความข้อผิดพลาด (Error Details)
                </div>
                <div style={{
                  fontSize: '13px',
                  fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
                  color: '#f87171',
                  wordBreak: 'break-all',
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.5
                }}>
                  {this.state.error.name}: {this.state.error.message}
                </div>
                {this.state.error.stack && (
                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'SFMono-Regular, Consolas, Monaco, monospace',
                    color: '#475569',
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    paddingTop: '8px'
                  }}>
                    {this.state.error.stack.split('\n').slice(0, 3).join('\n')}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #4f46e5, #6366f1)',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                  transition: 'transform 0.2s, opacity 0.2s',
                  outline: 'none'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                🔄 รีเฟรชหน้าเว็บใหม่ (Reload Page)
              </button>

              <button
                onClick={this.handleClearCache}
                style={{
                  width: '100%',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s',
                  outline: 'none'
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.15)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.05)';
                  (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                }}
              >
                🗑️ ล้างข้อมูลแคชทั้งหมด (Reset & Clear LocalStorage)
              </button>
            </div>
          </div>
          
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.96); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
