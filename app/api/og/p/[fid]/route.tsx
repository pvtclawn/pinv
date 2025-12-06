import { ImageResponse } from 'next/og';
import { blockchainService } from '@/lib/blockchain-service';

export const runtime = 'edge';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ fid: string }> }
) {
    const { searchParams } = new URL(request.url);
    const hasPreviewParams = searchParams.has('title') || searchParams.has('handle');

    const { fid: fidStr } = await params;
    const fid = parseInt(fidStr);

    // Default pin data
    let pin = await blockchainService.getPin(fid) || {
        title: 'Pin Not Found',
        tagline: '',
        handle: 'unknown',
        accentColor: '#000000',
        stats: { githubRepos: 0, githubStars: 0, followerCount: 0 },
        widgets: [],
        widget: undefined,
        lastUpdated: new Date().toISOString()
    };

    // Override with Query Params for Preview
    if (hasPreviewParams) {
        pin = {
            ...pin,
            title: searchParams.get('title') || pin.title,
            tagline: searchParams.get('tagline') || pin.tagline,
            handle: searchParams.get('handle') || pin.handle,
            accentColor: searchParams.get('accentColor') ? `#${searchParams.get('accentColor')}` : pin.accentColor,
            stats: {
                githubRepos: parseInt(searchParams.get('repos') ?? '0') || pin.stats.githubRepos || 0,
                githubStars: parseInt(searchParams.get('stars') ?? '0') || pin.stats.githubStars || 0,
                followerCount: parseInt(searchParams.get('followers') ?? '0') || pin.stats.followerCount || 0,
            }
        };
    } else if (pin.handle === 'guy-do-or-die' && !pin.stats.githubStars) {
        // FETCH REAL DATA only if not previewing and it's our demo user
        try {
            const res = await fetch('https://api.github.com/users/guy-do-or-die', {
                headers: { 'User-Agent': 'PinV' }
            });
            if (res.ok) {
                const githubUser = await res.json();
                pin.stats = {
                    githubRepos: githubUser.public_repos,
                    githubStars: 120,
                    followerCount: githubUser.followers,
                };
                pin.handle = githubUser.login;
                pin.tagline = githubUser.bio || pin.tagline;
            }
        } catch (e) {
            console.error('Failed to fetch GitHub data for OG image', e);
        }
    }

    // 4. Render Dynamic Widget (if available)
    if (pin.widget && pin.widget.reactCode) {
        try {
            // Merge defaults (previewData) -> Saved Config -> Query Params
            const widgetProps = {
                ...(pin.widget.previewData || {}),
                ...(pin.widget.userConfig || {}),
            };

            // Override with query params if they match widget parameters
            if (pin.widget.parameters) {
                pin.widget.parameters.forEach((param: any) => {
                    const queryValue = searchParams.get(param.name);
                    if (queryValue) {
                        widgetProps[param.name] = queryValue;
                    }
                });
            }

            // Add standard context
            widgetProps.viewer_fid = 'preview'; // In real app, this comes from signed message

            const { renderWidget } = await import('@/lib/widget-renderer');
            // @ts-ignore
            return await renderWidget(pin.widget.reactCode, widgetProps);
        } catch (e) {
            console.error("Failed to render dynamic widget in OG:", e);
            // Fallback to default card
        }
    }

    return new ImageResponse(
        (
            <div
                style={{
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#1a1a1a',
                    backgroundImage: `linear-gradient(to bottom right, #1a1a1a, ${pin.accentColor}80)`,
                    color: 'white',
                    padding: '80px',
                    fontFamily: 'sans-serif',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ display: 'flex', fontSize: 32, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '4px' }}>
                        PinV
                    </div>
                    <div style={{ display: 'flex', fontSize: 80, fontWeight: 900, marginTop: 20 }}>
                        {pin.handle}
                    </div>
                </div>

                {/* Card */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '40px',
                        padding: '40px 80px',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        width: '80%',
                    }}
                >
                    <div style={{ display: 'flex', fontSize: 48, textAlign: 'center', marginBottom: 40 }}>
                        {pin.tagline}
                    </div>

                    <div style={{ display: 'flex', width: '100%', justifyContent: 'space-around' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold' }}>{pin.stats.githubRepos || 0}</div>
                            <div style={{ display: 'flex', fontSize: 24, opacity: 0.6, textTransform: 'uppercase' }}>Repos</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold' }}>{pin.stats.githubStars || 0}</div>
                            <div style={{ display: 'flex', fontSize: 24, opacity: 0.6, textTransform: 'uppercase' }}>Stars</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ display: 'flex', fontSize: 64, fontWeight: 'bold' }}>{pin.stats.followerCount || 0}</div>
                            <div style={{ display: 'flex', fontSize: 24, opacity: 0.6, textTransform: 'uppercase' }}>Followers</div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', fontSize: 24, opacity: 0.5 }}>
                    pinv.app
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 800,
            headers: {
                'Cache-Control': 'public, immutable, no-transform, max-age=300',
            },
        }
    );
}
