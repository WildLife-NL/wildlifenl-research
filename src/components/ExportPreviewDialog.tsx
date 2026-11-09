// One preview dialog for every CSV export: first rows, humanised headers with a raw toggle, then Download
import { useCallback, useMemo, useRef, useState } from 'react';
import { buildTableData, downloadCSV } from '../utils/csv';
import { humanizeColumn } from '../utils/columnLabels';
import { formatCount, pluralize } from '../utils/format';
import Banner from './ui/Banner';
import Button from './ui/Button';
import Dialog from './ui/Dialog';
import { LoadingState } from './ui/Layout';
import '../styles/ExportPreview.css';

const PREVIEW_ROWS = 10;

export interface ExportRequest {
  title: string;
  fileName: string;
  emptyText: string;
  note?: string;
  load: () => Promise<any[]>;
}

interface PreviewState extends Omit<ExportRequest, 'load'> {
  data: any[] | null;
  loading: boolean;
  error: string | null;
}

// Opens the dialog at once with a loading state and fills it when the data arrives
export const useExportPreview = () => {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const requestId = useRef(0);

  const openPreview = useCallback(async (request: ExportRequest) => {
    const id = ++requestId.current;
    const { load, ...meta } = request;
    setPreview({ ...meta, data: null, loading: true, error: null });
    try {
      const data = (await load()) ?? [];
      if (id === requestId.current) setPreview((current) => (current ? { ...current, data, loading: false } : current));
    } catch (error) {
      console.error('Error loading export:', error);
      const message = error instanceof Error ? error.message : 'Please try again.';
      if (id === requestId.current) setPreview((current) => (current ? { ...current, loading: false, error: message } : current));
    }
  }, []);

  const closePreview = useCallback(() => {
    requestId.current += 1;
    setPreview(null);
  }, []);

  return { preview, openPreview, closePreview };
};

interface ExportPreviewDialogProps {
  preview: PreviewState | null;
  onClose: () => void;
}

const ExportPreviewDialog: React.FC<ExportPreviewDialogProps> = ({ preview, onClose }) => {
  const [rawHeaders, setRawHeaders] = useState(false);
  const table = useMemo(() => buildTableData(preview?.data ?? []), [preview?.data]);

  if (!preview) return null;

  const total = preview.data?.length ?? 0;
  const shown = Math.min(PREVIEW_ROWS, total);
  const ready = !preview.loading && !preview.error;

  const description = preview.loading
    ? 'Loading the data from the WildlifeNL API…'
    : ready && total > 0
    ? (
        <>
          Showing the first {shown} of {pluralize(total, 'row')} · {pluralize(table.headers.length, 'column')} ·{' '}
          <span className="rc-mono">{preview.fileName}</span>
        </>
      )
    : undefined;

  return (
    <Dialog
      open
      onClose={onClose}
      title={preview.title}
      description={description}
      size={ready && total > 0 ? 'xl' : 'sm'}
      flushBody={ready && total > 0}
      testId="export-preview-dialog"
      footer={
        <>
          {ready && total > 0 && (
            <p className="rc-dialog__footer-note">
              The file contains all {formatCount(total)} rows. Open it in Excel, R or Python, the first row holds the column names.
            </p>
          )}
          <div className="rc-dialog__footer-actions">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            {ready && total > 0 && (
              <Button variant="primary" icon="download" onClick={() => downloadCSV(preview.fileName, preview.data ?? [])} data-testid="download-csv-button">
                Download CSV
              </Button>
            )}
          </div>
        </>
      }
    >
      {preview.loading && <LoadingState label="Loading rows…" />}

      {preview.error && (
        <Banner tone="error" title="Couldn't load this export.">
          {preview.error}
        </Banner>
      )}

      {ready && total === 0 && <p className="rc-muted">{preview.emptyText}</p>}

      {ready && total > 0 && (
        <>
          <div className="rc-preview__bar">
            <span>{preview.note ?? 'One row per record the API returned. Times are shown as the API sends them (UTC).'}</span>
            <label className="rc-check rc-preview__toggle">
              <input type="checkbox" checked={rawHeaders} onChange={(event) => setRawHeaders(event.target.checked)} />
              Show raw column names
            </label>
          </div>
          <div className="rc-preview__scroll" tabIndex={0} role="region" aria-label={`First ${shown} rows of ${preview.title}`}>
            <table className="rc-preview__table">
              <thead>
                <tr>
                  {table.headers.map((header) => (
                    <th key={header} scope="col" title={rawHeaders ? undefined : header}>
                      {rawHeaders ? <span className="rc-mono">{header}</span> : humanizeColumn(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.slice(0, PREVIEW_ROWS).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className={cell === '' || cell === 'null' ? 'rc-muted' : undefined} title={cell.length > 32 ? cell : undefined}>
                        {cell === '' || cell === 'null' ? '—' : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Dialog>
  );
};

export default ExportPreviewDialog;
