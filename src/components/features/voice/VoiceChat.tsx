import { useRef, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff } from 'lucide-react';

interface Participant {
  id: string;
  name: string;
  muted: boolean;
  stream?: MediaStream;
}

interface Props {
  sessionId: string;
  userId: string;
  userName: string;
}

interface Signal {
  id: string;
  from_user: string;
  to_user: string;
  type: string;
  payload: any;
}

const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] };

export function VoiceChat({ sessionId, userId, userName }: Props) {
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const processedSignals = useRef<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const joinedAt = useRef<string>('');

  const cleanup = useCallback(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    peers.current.forEach(pc => pc.close());
    peers.current.clear();
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    audioRefs.current.forEach(a => { a.pause(); a.srcObject = null; });
    audioRefs.current.clear();
    processedSignals.current.clear();
    setParticipants([]);
  }, []);

  const sendSignal = useCallback(async (to: string, type: string, payload: any) => {
    await supabase.from('voice_signals').insert({ session_id: sessionId, from_user: userId, to_user: to, type, payload });
  }, [sessionId, userId]);

  const addAudioStream = useCallback((peerId: string, stream: MediaStream) => {
    let audio = audioRefs.current.get(peerId);
    if (!audio) {
      audio = document.createElement('audio');
      audio.autoplay = true;
      document.body.appendChild(audio);
      audioRefs.current.set(peerId, audio);
    }
    audio.srcObject = stream;
    audio.muted = deafened;
  }, [deafened]);

  const createPeer = useCallback((peerId: string, peerName: string, initiator: boolean) => {
    if (peers.current.has(peerId)) return;
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peers.current.set(peerId, pc);

    if (localStream.current) {
      localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current!));
    }

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      addAudioStream(peerId, stream);
      setParticipants(prev => prev.some(p => p.id === peerId) ? prev : [...prev, { id: peerId, name: peerName, muted: false, stream }]);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(peerId, 'ice', { candidate: e.candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        peers.current.delete(peerId);
        setParticipants(prev => prev.filter(p => p.id !== peerId));
      }
    };

    if (initiator) {
      pc.createOffer().then(offer => {
        pc.setLocalDescription(offer);
        sendSignal(peerId, 'offer', { sdp: offer, name: userName });
      });
    }

    return pc;
  }, [addAudioStream, sendSignal, userName]);

  const handleSignal = useCallback(async (sig: Signal) => {
    if (processedSignals.current.has(sig.id)) return;
    processedSignals.current.add(sig.id);
    const peerId = sig.from_user;
    const peerName = sig.payload?.name || peerId.slice(0, 8);

    if (sig.type === 'join') {
      createPeer(peerId, peerName, true);
    } else if (sig.type === 'offer') {
      let pc = peers.current.get(peerId);
      if (!pc) {
        pc = createPeer(peerId, peerName, false)!;
        if (!pc) return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sig.payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(peerId, 'answer', { sdp: answer, name: userName });
    } else if (sig.type === 'answer') {
      const pc = peers.current.get(peerId);
      if (pc && pc.signalingState !== 'stable') {
        await pc.setRemoteDescription(new RTCSessionDescription(sig.payload.sdp));
      }
    } else if (sig.type === 'ice') {
      const pc = peers.current.get(peerId);
      if (pc && sig.payload.candidate) {
        try { await pc.addIceCandidate(new RTCIceCandidate(sig.payload.candidate)); } catch {}
      }
    } else if (sig.type === 'leave') {
      const pc = peers.current.get(peerId);
      pc?.close();
      peers.current.delete(peerId);
      setParticipants(prev => prev.filter(p => p.id !== peerId));
    }
  }, [createPeer, sendSignal, userName]);

  const pollSignals = useCallback(async () => {
    const { data } = await supabase
      .from('voice_signals')
      .select('*')
      .eq('session_id', sessionId)
      .eq('to_user', userId)
      .gte('created_at', joinedAt.current)
      .order('created_at', { ascending: true });
    if (data) data.forEach(s => handleSignal(s as Signal));
  }, [sessionId, userId, handleSignal]);

  const join = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      joinedAt.current = new Date().toISOString();
      setJoined(true);
      setParticipants([{ id: userId, name: userName + ' (You)', muted: false }]);
      // Announce join to all participants
      await supabase.from('voice_signals').insert({ session_id: sessionId, from_user: userId, to_user: 'broadcast', type: 'join', payload: { name: userName } });
      // Also send to anyone already in the room by querying recent joins
      const { data: existing } = await supabase.from('voice_signals')
        .select('from_user, payload')
        .eq('session_id', sessionId)
        .eq('type', 'join')
        .neq('from_user', userId)
        .gte('created_at', new Date(Date.now() - 3600000).toISOString());
      const seen = new Set<string>();
      existing?.forEach(s => {
        if (!seen.has(s.from_user)) {
          seen.add(s.from_user);
          createPeer(s.from_user, s.payload?.name || s.from_user, true);
        }
      });
      pollRef.current = setInterval(pollSignals, 1000);
    } catch (e: any) {
      setError(e.message || 'Microphone access denied');
    }
  };

  const leave = async () => {
    await supabase.from('voice_signals').insert({ session_id: sessionId, from_user: userId, to_user: 'broadcast', type: 'leave', payload: {} });
    cleanup();
    setJoined(false);
  };

  const toggleMute = () => {
    if (localStream.current) {
      const track = localStream.current.getAudioTracks()[0];
      if (track) { track.enabled = muted; setMuted(!muted); }
    }
  };

  const toggleDeafen = () => {
    const next = !deafened;
    setDeafened(next);
    audioRefs.current.forEach(a => { a.muted = next; });
  };

  useEffect(() => () => { cleanup(); }, [cleanup]);

  // Listen for broadcast signals (join/leave)
  useEffect(() => {
    if (!joined) return;
    const id = setInterval(async () => {
      const { data } = await supabase.from('voice_signals')
        .select('*').eq('session_id', sessionId).eq('to_user', 'broadcast')
        .neq('from_user', userId).gte('created_at', joinedAt.current)
        .order('created_at', { ascending: true });
      if (data) data.forEach(s => handleSignal(s as Signal));
    }, 1500);
    return () => clearInterval(id);
  }, [joined, sessionId, userId, handleSignal]);

  return (
    <div className="border-t border-amber-900/30 bg-[#080c15]">
      {!joined ? (
        <div className="p-3 flex items-center gap-2">
          <button onClick={join} className="flex items-center gap-1.5 bg-green-900/40 hover:bg-green-800/50 border border-green-800/50 text-green-300 rounded px-3 py-1.5 text-[11px] font-semibold transition-colors">
            <Phone className="w-3 h-3"/> Join Voice
          </button>
          {error && <span className="text-red-400 text-[10px]">{error}</span>}
        </div>
      ) : (
        <div className="p-2.5 flex items-center gap-2 flex-wrap">
          {/* Participants */}
          <div className="flex items-center gap-1.5 flex-1 flex-wrap min-w-0">
            {participants.map(p => (
              <div key={p.id} className="flex items-center gap-1 bg-[#0d1525] border border-amber-900/20 rounded px-2 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"/>
                <span className="text-amber-400 text-[10px] max-w-16 truncate">{p.name}</span>
              </div>
            ))}
          </div>
          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={toggleMute} title={muted ? 'Unmute' : 'Mute'} className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${muted ? 'bg-red-900/50 border-red-800/60 text-red-400' : 'bg-[#0d1525] border-amber-900/30 text-amber-600 hover:text-amber-400'}`}>
              {muted ? <MicOff className="w-3.5 h-3.5"/> : <Mic className="w-3.5 h-3.5"/>}
            </button>
            <button onClick={toggleDeafen} title={deafened ? 'Undeafen' : 'Deafen'} className={`w-7 h-7 rounded flex items-center justify-center border transition-colors ${deafened ? 'bg-red-900/50 border-red-800/60 text-red-400' : 'bg-[#0d1525] border-amber-900/30 text-amber-600 hover:text-amber-400'}`}>
              {deafened ? <VolumeX className="w-3.5 h-3.5"/> : <Volume2 className="w-3.5 h-3.5"/>}
            </button>
            <button onClick={leave} title="Leave voice" className="w-7 h-7 rounded flex items-center justify-center bg-red-900/40 hover:bg-red-800/50 border border-red-900/50 text-red-400 transition-colors">
              <PhoneOff className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
