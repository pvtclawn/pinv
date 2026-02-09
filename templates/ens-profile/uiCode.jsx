// Widget 3: ENS Profile Card
// uiCode — React component rendered via Satori

export default function Widget(props) {
  const { name, avatar, description, twitter, github, url, address, displayAddr, error, errorMsg } = props;

  const RecordRow = ({ icon, label, value }) => {
    if (!value) return null;
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '14px 20px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
      }}>
        <span style={{ fontSize: '20px', width: '28px', textAlign: 'center' }}>{icon}</span>
        <span style={{ fontSize: '14px', color: '#64748b', width: '80px', textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</span>
        <span style={{ fontSize: '18px', color: '#e2e8f0', flex: 1 }}>{value}</span>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '1200px', height: '800px',
      background: 'linear-gradient(150deg, #0f172a 0%, #172554 40%, #1e1b4b 70%, #0f172a 100%)',
      padding: '48px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f1f5f9',
    }}>
      {/* Header chip */}
      <div style={{ display: 'flex', marginBottom: '24px' }}>
        <span style={{
          fontSize: '13px', fontWeight: 600, color: '#60a5fa',
          textTransform: 'uppercase', letterSpacing: '3px',
          background: 'rgba(96,165,250,0.12)', padding: '6px 16px',
          borderRadius: '8px',
        }}>🔵 ENS PROFILE</span>
      </div>

      {/* Main card */}
      <div style={{
        display: 'flex', flex: 1,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '24px', border: '1px solid rgba(96,165,250,0.15)',
        overflow: 'hidden',
      }}>
        {/* Left: Avatar + Name */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          width: '400px',
          padding: '40px',
          background: 'rgba(96,165,250,0.06)',
          borderRight: '1px solid rgba(96,165,250,0.1)',
          gap: '24px',
        }}>
          {/* Avatar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '160px', height: '160px',
            borderRadius: '80px',
            background: avatar
              ? 'transparent'
              : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            border: '4px solid rgba(96,165,250,0.3)',
            overflow: 'hidden',
          }}>
            {avatar ? (
              <img src={avatar} style={{ width: '160px', height: '160px', borderRadius: '80px' }} />
            ) : (
              <span style={{ fontSize: '64px' }}>🔵</span>
            )}
          </div>

          {/* Name */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          }}>
            <span style={{
              fontSize: '36px', fontWeight: 800, color: '#f1f5f9',
              textAlign: 'center',
            }}>{name}</span>
            {displayAddr && (
              <span style={{
                fontSize: '15px', color: '#64748b',
                fontFamily: 'monospace',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px 12px', borderRadius: '6px',
              }}>{displayAddr}</span>
            )}
          </div>
        </div>

        {/* Right: Records */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          flex: 1, padding: '32px',
          gap: '10px', justifyContent: 'center',
        }}>
          {error ? (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flex: 1, fontSize: '22px', color: '#ef4444',
            }}>
              {errorMsg || 'Unable to load ENS profile'}
            </div>
          ) : (
            <>
              {description && (
                <div style={{
                  display: 'flex',
                  padding: '16px 20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '12px',
                  fontSize: '18px', color: '#cbd5e1',
                  lineHeight: '1.5',
                  marginBottom: '8px',
                }}>
                  {description}
                </div>
              )}
              <RecordRow icon="🐦" label="Twitter" value={twitter ? `@${twitter}` : ''} />
              <RecordRow icon="🐙" label="GitHub" value={github} />
              <RecordRow icon="🌐" label="Website" value={url} />
              <RecordRow icon="⛓️" label="Address" value={displayAddr} />
              {!description && !twitter && !github && !url && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flex: 1, fontSize: '20px', color: '#475569',
                }}>
                  No records set
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '16px',
        fontSize: '13px', color: '#334155',
      }}>
        <span>Made with PinV</span>
        <span>ENS · Ethereum Name Service</span>
      </div>
    </div>
  );
}
