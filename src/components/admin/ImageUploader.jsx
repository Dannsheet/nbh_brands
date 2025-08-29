import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ImageUploader({ onUpload }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    setError(null);
  };

  const uploadFiles = async () => {
    setUploading(true);
    setError(null);
    const urls = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage.from('productos').upload(fileName, file);
      if (uploadError) {
        setError('Error al subir imagen: ' + uploadError.message);
        setUploading(false);
        return;
      }
      // Obtén la URL pública
      const { data: publicUrlData } = supabase.storage.from('productos').getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        urls.push(publicUrlData.publicUrl);
      }
    }
    setUploading(false);
    onUpload(urls);
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Imágenes</label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
      />
      {files.length > 0 && (
        <button
          type="button"
          onClick={uploadFiles}
          disabled={uploading}
          className="mt-2 px-3 py-1 bg-yellow-400 text-black rounded-md shadow disabled:opacity-50"
        >
          {uploading ? 'Subiendo...' : 'Subir Imágenes'}
        </button>
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
