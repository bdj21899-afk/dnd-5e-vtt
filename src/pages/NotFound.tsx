import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06090f] flex items-center justify-center text-amber-100">
      <div className="text-center">
        <div className="text-8xl mb-4">🐉</div>
        <h1 className="text-5xl font-bold text-amber-500 mb-2" style={{fontFamily:'Georgia,serif'}}>404</h1>
        <p className="text-amber-700 mb-6 tracking-widest text-sm">This path leads nowhere, adventurer.</p>
        <Link to="/" className="bg-amber-900/40 hover:bg-amber-800/50 border border-amber-800/60 text-amber-300 px-6 py-2.5 rounded text-sm transition-colors">
          Return to Lobby
        </Link>
      </div>
    </div>
  );
}
