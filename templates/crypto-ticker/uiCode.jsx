// Widget 1: Crypto Price Ticker (ETH + BTC)
// uiCode — React component rendered via Satori

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function Widget(props) {
  const { eth, btc, lastUpdated, error, errorMsg } = props;

  const TrendIcon = ({ trend, size }) => {
    const s = { width: size || '28px', height: size || '28px' };
    if (trend === 'up') return <TrendingUp style={s} />;
    if (trend === 'down') return <TrendingDown style={s} />;
    return <Minus style={s} />;
  };

  const trendColor = (trend) =>
    trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#94a3b8';

  const changeStr = (val) => {
    if (val == null) return '—';
    const sign = val >= 0 ? '+' : '';
    return `${sign}${val}%`;
  };

  const CoinCard = ({ symbol, emoji, data }) => (
    <div style={{
      display: 'flex', flexDirection: 'column',
      flex: 1, padding: '40px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '24px', border: '1px solid rgba(148,163,184,0.15)',
      gap: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '36px' }}>{emoji}</span>
        <span style={{
          fontSize: '22px', fontWeight: 600, color: '#cbd5e1',
          textTransform: 'uppercase', letterSpacing: '2px',
        }}>{symbol}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px' }}>
        <span style={{
          fontSize: '72px', fontWeight: 800, color: '#f1f5f9',
          letterSpacing: '-2px',
        }}>{data.price}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendIcon trend={data.trend} size="24px" />
        <span style={{
          fontSize: '28px', fontWeight: 600,
          color: trendColor(data.trend),
        }}>{changeStr(data.change24h)}</span>
        <span style={{ fontSize: '18px', color: '#64748b', marginLeft: '8px' }}>24h</span>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Mkt Cap</span>
          <span style={{ fontSize: '20px', color: '#94a3b8', fontWeight: 500 }}>{data.marketCap || '—'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '14px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Volume</span>
          <span style={{ fontSize: '20px', color: '#94a3b8', fontWeight: 500 }}>{data.volume24h || '—'}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      width: '1200px', height: '800px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
      padding: '40px',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#f1f5f9',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            fontSize: '14px', fontWeight: 600, color: '#818cf8',
            textTransform: 'uppercase', letterSpacing: '3px',
            background: 'rgba(99,102,241,0.15)', padding: '6px 16px',
            borderRadius: '8px',
          }}>LIVE · CRYPTO TRACKER</span>
        </div>
        <span style={{ fontSize: '14px', color: '#475569' }}>
          {error ? errorMsg || 'Data unavailable' : 'CoinGecko'}
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flex: 1, gap: '24px' }}>
        <CoinCard symbol="Bitcoin" emoji="₿" data={btc} />
        <CoinCard symbol="Ethereum" emoji="⟠" data={eth} />
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '20px',
        fontSize: '13px', color: '#334155',
      }}>
        <span>Made with PinV</span>
        <span>Updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '—'}</span>
      </div>
    </div>
  );
}
