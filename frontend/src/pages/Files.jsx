import { useEffect, useState } from 'react';
import API from '../api/axios';
import FileTable from '../components/FileTable';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function Files() {
  useDocumentTitle('My Files');
  const [files, setFiles] = useState([]);

  const load = async () => {
    try {
      const { data } = await API.get('/files/');
      setFiles(data);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this encrypted file permanently?')) return;
    try {
      await API.delete(`/files/${id}`);
      load();
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="page-header">
        <h2>My Files</h2>
        <p>Manage your encrypted data files</p>
      </div>
      <FileTable files={files} onDelete={handleDelete} />
    </>
  );
}
