import { buildFullDatabaseExport } from '../services/databaseExportService.js';

export async function downloadFullDatabaseExport(req, res) {
  try {
    const secret = process.env.DATA_EXPORT_SECRET?.trim();
    if (secret && req.get('X-Export-Secret') !== secret) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing X-Export-Secret header',
      });
    }

    const data = await buildFullDatabaseExport();
    const safeName = data.exportedAt.replace(/[:.]/g, '-');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="searchlyst-full-export-${safeName}.json"`,
    );
    return res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Database export error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to export database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
