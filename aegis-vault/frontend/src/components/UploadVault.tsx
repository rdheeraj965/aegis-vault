import { useState } from "react";
import { supabase } from "../supabaseClient";
import { encryptFile } from "../utils/crypto";

export default function UploadVault() {
  const [file, setFile] = useState<File | null>(null);
  const [vaultPassword, setVaultPassword] = useState("");
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !vaultPassword) return;

    setUploading(true);
    setStatus("Encrypting file...");

    try {
      const encryptedBlob = await encryptFile(file, vaultPassword);
      
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not found");

      const filePath = `${user.id}/${Date.now()}_${file.name}.enc`;

      setStatus("Uploading to Cloud Storage...");

      const { error: uploadError } = await supabase.storage
        .from('vault')
        .upload(filePath, encryptedBlob);

      if (uploadError) throw uploadError;

      setStatus("Saving metadata...");

      const { error: dbError } = await supabase
        .from('files')
        .insert({
          file_name: file.name,
          file_type: file.type,
          original_size: file.size,
          storage_path: filePath,
          user_id: user.id
        });

      if (dbError) throw dbError;

      alert("✅ File Encrypted & Secured in Cloud!");
      setFile(null);
      setVaultPassword("");
      setStatus("");

    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
      setStatus("Failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #444", padding: "20px", marginTop: "20px", borderRadius: "8px" }}>
      <h3>Secure Upload</h3>
      <form onSubmit={handleUpload} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
          required 
        />
        
        <input 
          type="password" 
          placeholder="Set a Password for this file" 
          value={vaultPassword}
          onChange={(e) => setVaultPassword(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />

        {status && <p style={{ color: "blue", fontSize: "0.9em" }}>{status}</p>}

        <button 
          type="submit" 
          disabled={uploading} 
          style={{ 
            padding: "10px", 
            cursor: uploading ? "not-allowed" : "pointer", 
            background: uploading ? "#555" : "#3ECF8E", 
            color: "white",
            border: "none",
            borderRadius: "4px"
          }}
        >
          {uploading ? "Processing..." : "Encrypt & Upload"}
        </button>
      </form>
    </div>
  );
}