import QRCode from "qrcode";

export type TestRequestReceiptData = {
  requestCode: string;
  barcodeToken: string;
  patientName: string;
  patientCode?: string;
  doctorName?: string | null;
  priority: string;
  sampleType: string;
  clinicalNotes?: string;
  requestedAt: string;
  totalAmount: number;
  tests: { name: string; amount: number }[];
  company: {
    name: string;
    logoUrl?: string | null;
    location?: string;
    phone?: string | null;
    contactEmail?: string;
  };
  resultsUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const currency = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

export async function printTestRequestReceipt(data: TestRequestReceiptData) {
  const testsMarkup = data.tests.length
    ? data.tests
        .map(
          (test) =>
            `<tr><td>${escapeHtml(test.name)}</td><td class="amount">${escapeHtml(currency.format(test.amount))}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="2">No tests listed.</td></tr>`;

  const field = (label: string, value: string) =>
    `<div class="field"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value.trim() || "—")}</dd></div>`;

  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(data.resultsUrl, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "M",
      color: {
        dark: "#14532d",
        light: "#ffffff",
      },
    });
  } catch {
    qrDataUrl = "";
  }

  const qrMarkup = qrDataUrl
    ? `<img id="receipt-qr" src="${qrDataUrl}" width="168" height="168" alt="Results QR code" />`
    : `<p class="hint">QR unavailable — use the link below.</p>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt ${escapeHtml(data.requestCode)}</title>
  <style>
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; box-sizing: border-box; }
    body {
      font-family: "Segoe UI", Arial, sans-serif;
      color: #18181b;
      margin: 28px;
      max-width: 720px;
    }
    .letterhead { text-align: center; }
    .letterhead img {
      display: inline-block;
      max-width: 100%;
      max-height: 96px;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    .letterhead h1 {
      margin: 10px 0 0;
      font-size: 26px;
      font-weight: 800;
      line-height: 1.15;
      color: #047857;
    }
    .meta {
      margin: 6px 0 0;
      font-size: 12px;
      color: #52525b;
    }
    .letterhead-rule {
      margin: 14px 0 18px;
      border: 0;
      border-top: 3px solid #059669;
      height: 0;
    }
    h2.doc-title {
      margin: 0 0 14px;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #047857;
    }
    dl {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px 24px;
      margin: 0;
    }
    dt {
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #71717a;
    }
    dd { margin: 2px 0 0; font-size: 14px; font-weight: 600; }
    h2.section {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 20px 0 8px;
      color: #047857;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td {
      border: 1px solid #a7f3d0;
      padding: 8px 10px;
      text-align: left;
      font-size: 13px;
    }
    th {
      background: #ecfdf5;
      color: #047857;
      font-size: 11px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    td.amount { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
    tfoot td {
      font-weight: 700;
      background: #f0fdf4;
    }
    .qr-block {
      margin-top: 24px;
      padding: 16px;
      border: 1px dashed #6ee7b7;
      border-radius: 12px;
      text-align: center;
      background: #f8fffb;
    }
    .qr-block > p.label {
      margin: 0 0 8px;
      font-size: 12px;
      color: #047857;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .qr-block img {
      display: inline-block;
      width: 168px;
      height: 168px;
      background: #fff;
      border-radius: 8px;
    }
    .qr-block .token {
      margin-top: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #14532d;
    }
    .qr-block .hint {
      margin-top: 10px;
      font-size: 12px;
      color: #52525b;
      font-weight: 500;
      letter-spacing: normal;
      text-transform: none;
    }
    .qr-block a {
      color: #047857;
      word-break: break-all;
    }
    .notes {
      margin-top: 14px;
      font-size: 13px;
      color: #3f3f46;
      white-space: pre-wrap;
    }
    @media print {
      body { margin: 12px; }
    }
  </style>
</head>
<body>
  <header class="letterhead">
    ${data.company.logoUrl ? `<img src="${escapeHtml(data.company.logoUrl)}" alt="" />` : ""}
    <h1>${escapeHtml(data.company.name || "Lab")}</h1>
    <p class="meta">
      ${escapeHtml([data.company.location, data.company.phone, data.company.contactEmail].filter(Boolean).join(" · "))}
    </p>
  </header>
  <hr class="letterhead-rule" />
  <h2 class="doc-title">Test Request Receipt</h2>
  <dl>
    ${field("Request ID", data.requestCode)}
    ${field("Date", data.requestedAt)}
    ${field("Patient", data.patientName)}
    ${field("Sample type", data.sampleType)}
    ${field("Priority", data.priority)}
    ${field("Ref. doctor", data.doctorName || "—")}
  </dl>
  ${
    data.clinicalNotes?.trim()
      ? `<h2 class="section">Clinical notes</h2><p class="notes">${escapeHtml(data.clinicalNotes.trim())}</p>`
      : ""
  }
  <h2 class="section">Tests ordered</h2>
  <table>
    <thead><tr><th>Test</th><th>Amount</th></tr></thead>
    <tbody>${testsMarkup}</tbody>
    <tfoot>
      <tr>
        <td>Total</td>
        <td class="amount">${escapeHtml(currency.format(data.totalAmount))}</td>
      </tr>
    </tfoot>
  </table>
  <div class="qr-block">
    <p class="label">Scan QR to check results</p>
    ${qrMarkup}
    <div class="token">${escapeHtml(data.barcodeToken)}</div>
    <p class="hint">
      Keep this receipt. Scan the QR code or open<br />
      <a href="${escapeHtml(data.resultsUrl)}">${escapeHtml(data.resultsUrl)}</a>
    </p>
  </div>
  <script>
    (function () {
      function printNow() {
        window.focus();
        window.print();
      }
      var img = document.getElementById("receipt-qr");
      if (img && !img.complete) {
        img.addEventListener("load", function () { setTimeout(printNow, 100); }, { once: true });
        img.addEventListener("error", function () { setTimeout(printNow, 100); }, { once: true });
        setTimeout(printNow, 1500);
        return;
      }
      setTimeout(printNow, 200);
    })();
  </script>
</body>
</html>`;

  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!doc || !win) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  window.setTimeout(() => frame.remove(), 60_000);
}
