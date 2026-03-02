// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { apiClient } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';

function parseFile(file) {
  return new Promise((resolve, reject) => {
    const ext = (file.name || '').toLowerCase();
    if (ext.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && !results.data?.length) {
            reject(new Error(results.errors[0]?.message || 'CSV parse error'));
          } else {
            resolve(results.data || []);
          }
        },
        error: (err) => reject(err),
      });
    } else if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result;
          if (!(result instanceof ArrayBuffer)) {
            reject(new Error('Failed to read file'));
            return;
          }
          const data = new Uint8Array(result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const mapped = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
          if (!mapped.length) {
            resolve([]);
            return;
          }
          resolve(mapped);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error('Unsupported format. Use CSV or XLSX.'));
    }
  });
}

const NAME_ALIASES = ['name', 'full name', 'full_name', 'fullname'];
const EMAIL_ALIASES = ['email', 'email id', 'email_id', 'emailid', 'e-mail', 'e_mail'];
const WEBSITE_ALIASES = ['website', 'website url', 'website_url', 'websiteurl', 'url', 'web'];

function normalizeKey(key) {
  return String(key ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ');
}

function findColumnValue(row, aliases) {
  const keys = Object.keys(row || {});
  for (const alias of aliases) {
    const n = normalizeKey(alias).replace(/\s/g, '_');
    for (const k of keys) {
      const nk = normalizeKey(k).replace(/\s/g, '_');
      if (nk === n || nk.replace(/_/g, '') === n.replace(/_/g, '')) {
        const val = row[k];
        return val != null ? String(val).trim() : '';
      }
    }
  }
  return '';
}

function rawToEntriesFromObjects(rawRows) {
  const entries = [];
  const errors = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const full_name = findColumnValue(row, NAME_ALIASES) || (row['Name'] ?? row.Name ?? row.name ?? '').toString().trim();
    const email = findColumnValue(row, EMAIL_ALIASES) || (row['Email id'] ?? row['Email Id'] ?? row['Email'] ?? row.email ?? '').toString().trim();
    const website_url = findColumnValue(row, WEBSITE_ALIASES) || (row['Website'] ?? row.Website ?? row.website ?? '').toString().trim() || null;

    if (!full_name || full_name.length < 2) {
      errors.push({ row: rowNum, message: 'Name is required (min 2 characters)' });
      return;
    }
    if (!email) {
      errors.push({ row: rowNum, message: 'Email is required' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push({ row: rowNum, message: 'Invalid email format' });
      return;
    }

    entries.push({
      full_name: full_name.substring(0, 255),
      email,
      website_url: website_url || null,
    });
  });

  return { entries, errors };
}

const POLL_INTERVAL_MS = 2000;

export default function BulkUploadPage() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const pollRef = useRef(null);

  const handleFileChange = useCallback((e) => {
    const f = e.target.files?.[0];
    setFile(f);
    setParsed(null);
    setParseError(null);
    setUploadResult(null);
    setJobId(null);
    setJobStatus(null);
    if (!f) return;

    parseFile(f)
      .then((data) => {
        if (!data.length) {
          setParseError('No rows found in file');
          setParsed(null);
          return;
        }
        const { entries, errors } = rawToEntriesFromObjects(data);
        const detectedColumns = data[0] ? Object.keys(data[0]) : [];
        setParsed({ entries, errors, raw: data, detectedColumns });
        setParseError(errors.length ? `${errors.length} row(s) have validation errors` : null);
      })
      .catch((err) => {
        setParseError(err.message || 'Failed to parse file');
        setParsed(null);
      });
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f && (f.name.toLowerCase().endsWith('.csv') || f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'))) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.csv,.xlsx,.xls';
        const dt = new DataTransfer();
        dt.items.add(f);
        input.files = dt.files;
        handleFileChange({ target: { files: [f] } });
      }
    },
    [handleFileChange]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSubmit = async () => {
    if (!parsed?.entries?.length) {
      toast.error('No valid entries to upload');
      return;
    }
    const entriesToUpload = parsed.entries.slice(0, 1000);
    if (parsed.entries.length > 1000) {
      toast.warning(`Only first 1000 entries will be uploaded (${parsed.entries.length} total)`);
    }
    setUploading(true);
    setUploadResult(null);
    setJobId(null);
    setJobStatus(null);
    try {
      const res = await apiClient.waitlist.bulkCreate(entriesToUpload);
      setUploadResult(res.data);
      queryClient.invalidateQueries({ queryKey: ['waitlist'] });
      toast.success(
        `Upload complete: ${res.data.created} created, ${res.data.skipped} skipped (duplicates), ${res.data.errors} errors`
      );
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setUploadResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSendWelcomeEmails = async () => {
    const created = uploadResult?.details?.created;
    if (!created?.length) return;
    const entryIds = created.map((e) => e.id);
    setSendingEmails(true);
    setJobStatus(null);
    try {
      const res = await apiClient.waitlist.sendWelcomeBulk(entryIds);
      setJobId(res.data.jobId);
      toast.success(`Welcome email job started for ${res.data.total} entries`);
    } catch (err) {
      toast.error(err.message || 'Failed to start welcome email job');
      setSendingEmails(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;
    setSendingEmails(true);
    const poll = async () => {
      try {
        const res = await apiClient.waitlist.getWelcomeJobStatus(jobId);
        setJobStatus(res.data);
        if (res.data.status === 'completed' || res.data.status === 'failed') {
          setSendingEmails(false);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          if (res.data.status === 'completed') {
            toast.success(`Welcome emails sent: ${res.data.sent} sent, ${res.data.failed} failed`);
          } else {
            toast.error(res.data.error || 'Job failed');
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    };
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]);

  const validCount = parsed?.entries?.length ?? 0;
  const invalidCount = parsed?.errors?.length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Bulk Upload Waitlist</h2>
        <p className="text-gray-400 text-sm mt-1">
          Upload a CSV or XLSX file with columns: Name, Email id, Website (Website is optional)
        </p>
      </div>

      <div
        className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center bg-gray-900/50 hover:border-gray-600 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
          id="bulk-upload-input"
        />
        <label htmlFor="bulk-upload-input" className="cursor-pointer block">
          <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-1">Drag and drop your file here, or click to browse</p>
          <p className="text-gray-500 text-sm">CSV or XLSX (max 1000 rows)</p>
        </label>
      </div>

      {parseError && (
        <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {parsed && (
        <>
          {parsed.detectedColumns?.length > 0 && (
            <p className="text-gray-500 text-xs">
              Detected columns: {parsed.detectedColumns.map((c) => `"${c}"`).join(', ')}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              <span className="text-green-400">{validCount} valid</span>
              {invalidCount > 0 && (
                <>
                  {' '}
                  · <span className="text-amber-400">{invalidCount} invalid</span>
                </>
              )}
            </p>
            <Button
              onClick={handleSubmit}
              disabled={uploading || validCount === 0}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Upload {validCount} entries
                </>
              )}
            </Button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="max-h-64 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-gray-800/50">
                    <TableHead className="text-gray-400 bg-gray-900 sticky top-0 z-10">Name</TableHead>
                    <TableHead className="text-gray-400 bg-gray-900 sticky top-0 z-10">Email</TableHead>
                    <TableHead className="text-gray-400 bg-gray-900 sticky top-0 z-10">Website</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.entries.map((entry, i) => (
                    <TableRow key={i} className="border-gray-800 hover:bg-gray-800/50">
                      <TableCell className="text-white">{entry.full_name}</TableCell>
                      <TableCell className="text-gray-300">{entry.email}</TableCell>
                      <TableCell className="text-gray-400">{entry.website_url || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {invalidCount > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-amber-400 text-sm font-medium mb-2">Rows with errors:</p>
              <ul className="text-gray-400 text-sm space-y-1">
                {parsed.errors.map((e, i) => (
                  <li key={i}>
                    Row {e.row}: {e.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {uploadResult && !uploadResult.error && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>
              {uploadResult.created} created, {uploadResult.skipped} skipped (duplicates), {uploadResult.errors} errors
            </span>
          </div>

          {uploadResult.details?.created?.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4">
              <p className="text-gray-400 text-sm">
                Send welcome emails to the {uploadResult.details.created.length} newly created entries?
              </p>
              <Button
                onClick={handleSendWelcomeEmails}
                disabled={sendingEmails || jobStatus?.status === 'completed'}
                variant="outline"
                className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 disabled:opacity-70"
              >
                {sendingEmails ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending emails...
                  </>
                ) : jobStatus?.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Emails sent
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send welcome emails to {uploadResult.details.created.length} entries
                  </>
                )}
              </Button>

              {jobStatus && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>
                      {jobStatus.status === 'running'
                        ? `Sending... ${(jobStatus.sent || 0) + (jobStatus.failed || 0)} of ${jobStatus.total}`
                        : jobStatus.status === 'completed'
                          ? `Done: ${jobStatus.sent || 0} sent, ${jobStatus.failed || 0} failed`
                          : jobStatus.status === 'failed'
                            ? 'Job failed'
                            : 'Pending...'}
                    </span>
                    {jobStatus.total > 0 && (
                      <span>{Math.round(((jobStatus.sent || 0) + (jobStatus.failed || 0)) / jobStatus.total * 100)}%</span>
                    )}
                  </div>
                  <Progress
                    value={jobStatus.total > 0 ? ((jobStatus.sent || 0) + (jobStatus.failed || 0)) / jobStatus.total * 100 : 0}
                    className="h-2"
                  />
                  {jobStatus.errors?.length > 0 && (
                    <ul className="text-amber-400 text-xs mt-2 space-y-1 max-h-24 overflow-auto">
                      {jobStatus.errors.slice(0, 5).map((e, i) => (
                        <li key={i}>{e.email}: {e.message}</li>
                      ))}
                      {jobStatus.errors.length > 5 && (
                        <li>...and {jobStatus.errors.length - 5} more</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
