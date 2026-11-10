/**
 * CSV Exporter Utility for JBP Dashboard
 * Converts array of objects into downloadable CSV file with proper UTF-8 BOM
 */
export function exportToCSV(filename, rows, headers) {
  if (!rows || !rows.length) return;

  // Include UTF-8 BOM for Excel compatibility in PT-BR
  let csvContent = "\uFEFF";

  if (headers && headers.length) {
    csvContent += headers.map(h => `"${h.label || h.key || ''}"`).join(";") + "\n";
  } else {
    csvContent += Object.keys(rows[0]).map(k => `"${k}"`).join(";") + "\n";
  }

  rows.forEach(row => {
    let rowStr = "";
    if (headers && headers.length) {
      rowStr = headers.map(h => {
        let val = row[h.key];
        if (val === undefined || val === null) val = "";
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(";");
    } else {
      rowStr = Object.values(row).map(val => {
        if (val === undefined || val === null) val = "";
        val = String(val).replace(/"/g, '""');
        return `"${val}"`;
      }).join(";");
    }
    csvContent += rowStr + "\n";
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  const safeFilename = (typeof filename === 'string' ? filename : String(filename || 'relatorio')).replace(/[^\w.-]/g, '_');
  link.setAttribute("download", `${safeFilename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
