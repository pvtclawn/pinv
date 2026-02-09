// Widget 2: Wallet Portfolio Summary
// uiCode — React component rendered via Satori

export default function Widget(props) {
  const { address, displayAddr, totalValueUsd, ethBalance, ethValueUsd, ethPrice, tokens, chain, error, errorMsg } = props;

  const barColor = (pct) => {
    if (pct > 60) return '#818cf8';
    if (pct > 30) return '#34d399';
    return '#fbbf24';
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '1200px', height: '800px',
      background: 'linear-gradient(145deg, #0c0a1a 0%, #1a103d 40%, #0f172a 100%)',
      padding: '48px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f1f5f9',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '13px', fontWeight: 600, color: '#a78bfa',
            textTransform: 'uppercase', letterSpacing: '3px',
            background: 'rgba(167,139,250,0.12)', padding: '6px 16px',
            borderRadius: '8px',
          }}>💼 PORTFOLIO · {chain || 'BASE'}</span>
        </div>
        <span style={{
          fontSize: '16px', color: '#64748b',
          fontFamily: 'monospace',
        }}>{displayAddr}</span>
      </div>

      {/* Total Value */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        padding: '32px 40px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '20px', border: '1px solid rgba(167,139,250,0.2)',
        marginBottom: '24px',
      }}>
        <span style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Total Value
        </span>
        <span style={{
          fontSize: '80px', fontWeight: 800, color: '#f1f5f9',
          letterSpacing: '-3px', lineHeight: '1',
        }}>
          {error ? '—' : totalValueUsd}
        </span>
      </div>

      {/* Token List */}
      <div style={{
        display: 'flex', flexDirection: 'column', flex: 1,
        gap: '12px',
      }}>
        {error ? (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flex: 1, fontSize: '24px', color: '#ef4444',
          }}>
            {errorMsg || 'Unable to load portfolio'}
          </div>
        ) : (
          (tokens || []).map((token, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center',
              padding: '20px 28px',
              background: 'rgba(255,255,255,0.03)',
              borderRadius: '16px', border: '1px solid rgba(148,163,184,0.1)',
              gap: '20px',
            }}>
              {/* Symbol */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '52px', height: '52px',
                background: 'rgba(129,140,248,0.15)',
                borderRadius: '12px',
                fontSize: '22px', fontWeight: 700, color: '#818cf8',
              }}>
                {token.symbol === 'ETH' ? '⟠' : token.symbol?.slice(0, 2)}
              </div>

              {/* Name + Balance */}
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '4px' }}>
                <span style={{ fontSize: '22px', fontWeight: 600 }}>{token.symbol}</span>
                <span style={{ fontSize: '16px', color: '#64748b' }}>{token.balance}</span>
              </div>

              {/* Allocation Bar */}
              <div style={{
                display: 'flex', flexDirection: 'column', width: '200px', gap: '6px',
              }}>
                <div style={{
                  display: 'flex', width: '100%', height: '8px',
                  background: 'rgba(255,255,255,0.06)', borderRadius: '4px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${token.pct}%`, height: '100%',
                    background: barColor(token.pct), borderRadius: '4px',
                  }} />
                </div>
                <span style={{ fontSize: '13px', color: '#64748b', textAlign: 'right' }}>{token.pct}%</span>
              </div>

              {/* Value */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', minWidth: '120px' }}>
                <span style={{ fontSize: '22px', fontWeight: 600 }}>{token.valueUsd}</span>
                {token.change24h && (
                  <span style={{
                    fontSize: '14px',
                    color: Number(token.change24h) >= 0 ? '#22c55e' : '#ef4444',
                  }}>
                    {Number(token.change24h) >= 0 ? '+' : ''}{token.change24h}%
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '16px',
        fontSize: '13px', color: '#334155',
      }}>
        <span>Made with PinV</span>
        <span>ETH ${ethPrice ? `$${ethPrice.toLocaleString()}` : '—'}</span>
      </div>
    </div>
  );
}
