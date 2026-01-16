import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { decryptFile } from "../utils/crypto";

interface FileMeta {
  id: string;
  file_name: string;
  storage_path: string;
  created_at: string;
}

export default function FileGallery() {
  const [files, setFiles] = useState<FileMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching files:', error);
    else setFiles(data || []);
    setLoading(false);
  };

  const handleDecryptDownload = async (fileMeta: FileMeta) => {
    const password = prompt(`Enter password to decrypt "${fileMeta.file_name}":`);
    if (!password) return;

    try {
      console.log("Downloading encrypted blob...");
      const { data, error } = await supabase.storage
        .from('vault')
        .download(fileMeta.storage_path);

      if (error) throw error;

      console.log("Decrypting...");
      const decryptedBuffer = await decryptFile(data, password);

      const blob = new Blob([decryptedBuffer]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileMeta.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      alert("✅ Decryption Successful! File downloaded.");
    } catch (err: any) {
      console.error(err);
      alert("❌ Decryption Failed: " + err.message);
    }
  };

  if (loading) return <p>Loading Vault...</p>;

  return (
    <div style={{ marginTop: '40px' }}>
      <h3>Your Secure Files</h3>
      {files.length === 0 ? (
        <p style={{ color: '#888' }}>Vault is empty.</p>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {files.map((file) => (
            <div 
              key={file.id} 
              style={{ 
                border: '1px solid #333', 
                padding: '15px', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#1a1a1a'
              }}
            >
              <div>
                <strong style={{ display: 'block' }}>{file.file_name}</strong>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                  {new Date(file.created_at).toLocaleDateString()}
                </span>
              </div>
              <button 
                onClick={() => handleDecryptDownload(file)}
                style={{
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid #3ECF8E',
                  color: '#3ECF8E',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                Decrypt
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}