import { Pin } from '@/types';

export const MOCK_PINS: Record<number, Pin> = {
  1: {
    fid: 1,
    handle: 'alice',
    title: 'Alice’s PinV',
    tagline: 'Building the future of decentralized social',
    stats: {
      githubRepos: 42,
      githubStars: 1337,
      followerCount: 5000,
    },
    accentColor: '#5B5FFF',
    lastUpdated: '2025-11-28T12:00:00Z',
    widgets: [
      {
        id: 'w1',
        type: 'programmable',
        title: 'Welcome',
        code: `
export default function Widget() {
  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-2">Welcome</h3>
      <p className="opacity-80 leading-relaxed">Welcome to my PinV! Check out my projects below.</p>
    </div>
  );
}
`,
        order: 0
      },
      {
        id: 'w2',
        type: 'programmable',
        title: 'My Stats',
        code: `
export default function Widget() {
  return (
    <div className="w-full bg-gradient-to-br from-[#24292e] to-[#1a1a1a] border border-white/10 rounded-2xl p-6 text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">My Stats</h3>
        <span className="opacity-50 text-sm">@alice</span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold">42</div>
          <div className="text-xs opacity-60 uppercase tracking-wider mt-1">Repos</div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold">1.3k</div>
          <div className="text-xs opacity-60 uppercase tracking-wider mt-1">Stars</div>
        </div>
        <div className="p-3 bg-white/5 rounded-xl">
          <div className="text-2xl font-bold">5k</div>
          <div className="text-xs opacity-60 uppercase tracking-wider mt-1">Followers</div>
        </div>
      </div>
    </div>
  );
}
`,
        order: 1
      },
      {
        id: 'w3',
        type: 'programmable',
        title: 'Important Links',
        code: `
export default function Widget() {
  const links = [
    { label: 'Website', url: 'https://alice.eth' },
    { label: 'Blog', url: 'https://mirror.xyz/alice.eth' }
  ];

  return (
    <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-4">Important Links</h3>
      <div className="flex flex-col gap-3">
        {links.map((link, idx) => (
          <a
            key={idx}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-center font-medium"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
`,
        order: 2
      }
    ]
  },
  2: {
    fid: 2,
    handle: 'bob',
    title: 'Bob’s Pin',
    tagline: 'Just shipping code',
    stats: {
      githubRepos: 10,
      githubStars: 50,
      followerCount: 100,
    },
    accentColor: '#FF5B5B',
    lastUpdated: '2025-11-27T10:00:00Z',
    widgets: [
      {
        id: 'w-bob-1',
        type: 'programmable',
        title: 'Guy-Do-Or-Die Activity',
        code: `
export default function GithubActivityWidget() {
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch('https://api.github.com/users/guy-do-or-die/events?per_page=5')
      .then(res => res.json())
      .then(data => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => setLoading(false));
  }, []);

  if (loading) return <div className="p-4 text-center opacity-50">Loading activity...</div>;

  return (
    <div className="w-full bg-[#0d1117] border border-white/10 rounded-2xl p-4 text-white font-sans">
      <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
        <img src="https://github.com/guy-do-or-die.png" className="w-10 h-10 rounded-full" />
        <div>
          <h3 className="font-bold text-sm">guy-do-or-die</h3>
          <div className="text-xs opacity-60">Recent Activity</div>
        </div>
      </div>
      
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="flex gap-2 text-sm">
            <span className="text-green-400">●</span>
            <div>
              <span className="font-bold">{event.type.replace('Event', '')}</span>
              <span className="opacity-60"> on </span>
              <span className="text-blue-400">{event.repo.name}</span>
            </div>
          </div>
        ))}
        {events.length === 0 && <div className="opacity-50">No recent public activity</div>}
      </div>
    </div>
  );
}
`,
        order: 0
      }
    ]
  },
  3: {
    fid: 3,
    handle: 'charlie',
    title: 'Charlie_Dev',
    tagline: 'Crypto & Coffee',
    stats: {
      githubRepos: 5,
      githubStars: 12,
      followerCount: 300,
    },
    accentColor: '#5BFF85',
    lastUpdated: '2025-11-26T15:30:00Z',
    widgets: []
  },
};

export async function getPin(fid: number): Promise<Pin | null> {
  // Simulate network delay
  // await new Promise((resolve) => setTimeout(resolve, 100));
  return MOCK_PINS[fid] || null;
}
