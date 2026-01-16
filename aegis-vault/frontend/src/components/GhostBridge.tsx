import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { encryptText, decryptText } from "../utils/crypto";

export default function GhostBridge() {
    const [clips, setClips] = useState<any[]>([]);
    const [inputText, setInputText] = useState("");
    const [bridgePassword, setBridgePassword] = useState("");
    const [decryptedCache, setDecryptedCache] = useState<{[key:string]: string}>({});

    useEffect(() => {
        fetchClips();

        const channel = supabase
            .channel('realtime-clips')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'clips' },
                (payload) => {
                setClips((current) => [payload.new, ...current]);
                }
            )
            .subscribe();

        return () => {
        supabase.removeChannel(channel);
        };
    }, []);

    const fetchClips = async () => {
        const { data } = await supabase
        .from('clips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
        if (data) setClips(data);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText || !bridgePassword) return;

        try {
        const encryptedContent = await encryptText(inputText, bridgePassword);

        await supabase.from('clips').insert({
            content: encryptedContent,
            device_name: navigator.platform
        });

        setInputText("");
        } catch (err) {
        alert("Encryption Failed");
        }
    };

    const handleDecrypt = async (clipId: string, content: string) => {
        const password = prompt("Enter Bridge Password to decrypt:");
        if (!password) return;

        try {
        const plainText = await decryptText(content, password);
        setDecryptedCache((prev) => ({ ...prev, [clipId]: plainText }));

        const isOTP = /^\d{4,8}$/.test(plainText.trim());
        const isURL = /^(http|https):\/\/[^ "]+$/.test(plainText.trim());

        if (isOTP) {
            await navigator.clipboard.writeText(plainText);
            alert("AI Agent: I detected an OTP. I have auto-copied it to your clipboard!");
        } 
        else if (isURL) {
            if(confirm("AI Agent: I detected a Link. Open it?")) {
            window.open(plainText, '_blank');
            }
        }

        } catch (err) {
        alert("Wrong password!");
        }
    };

    return (
    <div className="tab-content">
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <h3 style={{ color: "#7c4dff", margin: 0 }}>GHOST_BRIDGE</h3>
        <p style={{ fontSize: "0.8rem", color: "#666" }}>ENCRYPTED WEBSOCKET STREAM :: ACTIVE</p>
        </div>

        <div className="bridge-grid">
            <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '4px', border: '1px solid #333' }}>
                <h4 style={{ marginTop: 0, color: '#aaa' }}>TRANSMITTER</h4>
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>PAYLOAD</label>
                    <textarea 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter secret data..."
                    rows={4}
                    style={{ width: '100%', background: '#0d0d0d', border: '1px solid #444', color: 'white', padding: '10px', resize: 'none' }}
                    />
                </div>
                <div>
                    <label style={{ fontSize: '0.8rem', color: '#666' }}>ENCRYPTION KEY</label>
                    <input 
                    type="password" 
                    value={bridgePassword}
                    onChange={(e) => setBridgePassword(e.target.value)}
                    placeholder="Shared Pass"
                    style={{ width: '100%', padding: '8px', background: '#0d0d0d' }}
                    />
                </div>
                <button type="submit" style={{ background: '#7c4dff', border: 'none', padding: '10px', color: 'white', cursor: 'pointer' }}>
                    INITIATE UPLINK
                </button>
                </form>
            </div>

            <div style={{ background: '#0d0d0d', padding: '20px', borderRadius: '4px', border: '1px solid #333', maxHeight: '400px', overflowY: 'auto' }}>
                <h4 style={{ marginTop: 0, color: '#aaa' }}>INCOMING STREAM</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {clips.length === 0 && <span style={{color:'#444'}}>Waiting for signal...</span>}
                    
                    {clips.map((clip) => (
                        <div key={clip.id} style={{ borderLeft: '3px solid #7c4dff', paddingLeft: '10px', marginBottom: '10px' }}>
                            <div style={{ fontSize: "0.7rem", color: "#555", marginBottom: '4px' }}>
                                {new Date(clip.created_at).toLocaleTimeString()} :: {clip.device_name}
                            </div>
                        
                            {decryptedCache[clip.id] ? (
                                <div style={{ color: "#00e676", wordBreak: 'break-all', fontFamily: 'monospace' }}>
                                {decryptedCache[clip.id]}
                                </div>
                            ) : (
                                <button 
                                onClick={() => handleDecrypt(clip.id, clip.content)}
                                style={{ fontSize: "0.7rem", background: "transparent", border: "1px solid #444", color: "#888", cursor: "pointer", padding: "2px 8px" }}
                                >
                                [LOCKED] DECRYPT
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
    );
}