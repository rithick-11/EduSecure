import { HiOutlineTrash } from 'react-icons/hi';

export default function FileTable({ files, onDelete }) {
  if (!files.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
        No encrypted files yet. Upload your first file to get started.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Type</th>
            <th>Rows</th>
            <th>Columns</th>
            <th>Size</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id}>
              <td style={{ fontWeight: 500 }}>{f.filename}</td>
              <td><span className="badge badge-teal">{f.data_type}</span></td>
              <td>{f.row_count}</td>
              <td>{(f.column_names || []).join(', ')}</td>
              <td>{(f.encrypted_size / 1024).toFixed(1)} KB</td>
              <td>{new Date(f.created_at).toLocaleDateString()}</td>
              <td>
                {onDelete && (
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(f.id)}>
                    <HiOutlineTrash />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
