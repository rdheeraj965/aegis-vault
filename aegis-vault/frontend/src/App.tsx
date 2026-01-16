import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { type Session } from '@supabase/supabase-js'
import UploadVault from './components/UploadVault';
import FileGallery from './components/FileGallery';
import GhostBridge from './components/GhostBridge';

function App() {
    const [session, setSession] = useState<Session | null>(null)
    const [activeTab, setActiveTab] = useState<'bridge' | 'upload' | 'gallery'>('bridge'); // Default Tab
    
    const [panicMode, setPanicMode] = useState<boolean>(() => sessionStorage.getItem('aegis_panic') === 'true');
    
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
        return () => subscription.unsubscribe()
    }, [])

    const triggerPanic = () => {
        setPanicMode(true);
        sessionStorage.setItem('aegis_panic', 'true');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setPanicMode(false);
        sessionStorage.removeItem('aegis_panic');
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            const { error: signUpError } = await supabase.auth.signUp({ email, password })
            if (signUpError) alert(signUpError.message)
            else alert("Account created! Check email or try login.")
        }
        setLoading(false)
    }

    if (!session) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#050505' }}>
                <div style={{ padding: '40px', border: '1px solid #333', borderRadius: '8px', width: '100%', maxWidth: '350px', background: '#0d0d0d' }}>
                    <h2 style={{ color: '#00ff41', textAlign: 'center', marginBottom: '30px' }}>🛡️ AEGIS_GATEWAY</h2>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <input type="email" placeholder="IDENTITY (EMAIL)" value={email} onChange={(e) => setEmail(e.target.value)} style={{ padding: '12px', background: '#1a1a1a', border: '1px solid #333' }} />
                        <input type="password" placeholder="PASSPHRASE" value={password} onChange={(e) => setPassword(e.target.value)} style={{ padding: '12px', background: '#1a1a1a', border: '1px solid #333' }} />
                        <button disabled={loading} style={{ padding: '12px', background: '#00ff41', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                            {loading ? 'AUTHENTICATING...' : 'ACCESS MAINFRAME'}
                        </button>
                    </form>
                </div>
            </div>
        )
    }

    if (panicMode) {
        return (
            <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ borderBottom: '1px solid #eee', paddingBottom: '20px', marginBottom: '20px' }}>
                    <h1>My Personal Drive</h1>
                    <p style={{ color: '#888' }}>User: {session.user.email}</p>
                    <button onClick={handleLogout}>Logout</button>
                </header>
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#999' }}>
                    <h3>No files found.</h3>
                    <p>Your folder is empty.</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                <div>
                    <h1 style={{ color: '#00ff41', margin: 0, fontSize: '1.8rem', letterSpacing: '-1px' }}>🛡️ AEGIS_VAULT</h1>
                    <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '5px' }}>
                        SECURE CLOUD ENVIRONMENT // <span style={{color: '#00ff41'}}>CONNECTED</span>
                    </p>
                </div>
                <div>
                    <button onClick={triggerPanic} style={{ background: '#ff3333', color: 'white', border: 'none', padding: '8px 15px', marginRight: '10px', borderRadius: '2px', cursor: 'pointer' }}>
                        PANIC
                    </button>
                    <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #666', color: '#888', padding: '8px 15px', cursor: 'pointer' }}>
                        LOGOUT
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', marginBottom: '30px' }}>
                <button 
                    className={`tab-btn ${activeTab === 'bridge' ? 'active' : ''}`}
                    onClick={() => setActiveTab('bridge')}
                >
                    GHOST BRIDGE
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upload')}
                >
                    SECURE UPLOAD
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
                    onClick={() => setActiveTab('gallery')}
                >
                    ARCHIVE
                </button>
            </div>

            <div style={{ minHeight: '400px' }}>
                {activeTab === 'bridge' && <GhostBridge />}
              
                {activeTab === 'upload' && (
                    <div className="tab-content" style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: '100%', maxWidth: '500px' }}>
                            <UploadVault />
                        </div>
                    </div>
                )}
              
                {activeTab === 'gallery' && (
                    <div className="tab-content">
                        <FileGallery />
                    </div>
                )}
            </div>
        </div>
    )
}

export default App