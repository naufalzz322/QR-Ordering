import QRCode from 'qrcode'
import jsPDF from 'jspdf'

interface QRTableData {
  tableNumber: number
  qrToken: string
  outletName: string
  outletSlug: string
  address?: string
  phone?: string
}

/**
 * Generate QR code as data URL
 */
export async function generateQRDataUrl(url: string): Promise<string> {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  })
}

/**
 * Generate QR code as buffer
 */
export async function generateQRBuffer(url: string): Promise<Buffer> {
  const dataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  })

  // Convert base64 data URL to buffer
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

/**
 * Generate PDF with QR codes for tables
 */
export async function generateQRPdf(
  tables: QRTableData[],
  appUrl: string
): Promise<Buffer> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148 x 210 mm
  })

  const pageWidth = 148
  const pageHeight = 210
  const qrSize = 55
  const qrX = (pageWidth - qrSize) / 2

  for (let i = 0; i < tables.length; i++) {
    const table = tables[i]

    if (i > 0) {
      pdf.addPage()
    }

    const menuUrl = `${appUrl}/m/${table.outletSlug}?token=${table.qrToken}`
    const qrDataUrl = await generateQRDataUrl(menuUrl)

    // === HEADER SECTION ===
    // Outlet name
    pdf.setFontSize(16)
    pdf.setTextColor(30)
    pdf.setFont('helvetica', 'bold')
    pdf.text(table.outletName, pageWidth / 2, 20, { align: 'center' })

    // Address (if available)
    if (table.address) {
      pdf.setFontSize(8)
      pdf.setTextColor(100)
      pdf.setFont('helvetica', 'normal')
      pdf.text(table.address, pageWidth / 2, 26, { align: 'center' })
    }

    // === QR CODE SECTION ===
    // QR code background
    pdf.setFillColor(255, 255, 255)
    pdf.roundedRect(qrX - 5, 32, qrSize + 10, qrSize + 10, 3, 3, 'F')

    // QR code
    pdf.addImage(qrDataUrl, 'PNG', qrX, 37, qrSize, qrSize)

    // === TABLE INFO SECTION ===
    const infoY = 110

    // Table number (large)
    pdf.setFontSize(32)
    pdf.setTextColor(0)
    pdf.setFont('helvetica', 'bold')
    pdf.text(`MEJA ${table.tableNumber}`, pageWidth / 2, infoY, { align: 'center' })

    // Separator line
    pdf.setDrawColor(200)
    pdf.setLineWidth(0.5)
    pdf.line(30, infoY + 6, pageWidth - 30, infoY + 6)

    // === DETAILS SECTION ===
    const detailsY = infoY + 14

    // Token label
    pdf.setFontSize(7)
    pdf.setTextColor(120)
    pdf.setFont('helvetica', 'normal')
    pdf.text('KODE MEJA', pageWidth / 2, detailsY, { align: 'center' })

    // Token value (monospace style)
    pdf.setFontSize(12)
    pdf.setTextColor(0)
    pdf.setFont('courier', 'bold')
    pdf.text(table.qrToken, pageWidth / 2, detailsY + 6, { align: 'center' })

    // URL label
    pdf.setFontSize(7)
    pdf.setTextColor(120)
    pdf.setFont('helvetica', 'normal')
    pdf.text('URL', pageWidth / 2, detailsY + 16, { align: 'center' })

    // URL value
    pdf.setFontSize(8)
    pdf.setTextColor(60)
    pdf.setFont('helvetica', 'normal')
    pdf.text(menuUrl, pageWidth / 2, detailsY + 22, { align: 'center' })

    // === INSTRUCTIONS SECTION ===
    const instructionY = detailsY + 34

    // Instruction box background
    pdf.setFillColor(250, 250, 250)
    pdf.roundedRect(15, instructionY - 4, pageWidth - 30, 28, 2, 2, 'F')

    // Instructions
    pdf.setFontSize(8)
    pdf.setTextColor(50)
    pdf.setFont('helvetica', 'bold')
    pdf.text('CARA PEMESANAN', pageWidth / 2, instructionY + 2, { align: 'center' })

    pdf.setFontSize(7)
    pdf.setTextColor(80)
    pdf.setFont('helvetica', 'normal')
    const instructions = [
      '1. Scan QR code di atas',
      '2. Pilih menu favorit Anda',
      '3. Checkout & pilih meja ini',
      '4. Bayar dan tunggu pesanan',
    ]
    instructions.forEach((text, idx) => {
      pdf.text(text, pageWidth / 2, instructionY + 10 + (idx * 5), { align: 'center' })
    })

    // === FOOTER ===
    // Phone (if available)
    if (table.phone) {
      pdf.setFontSize(7)
      pdf.setTextColor(120)
      pdf.text(`Telp: ${table.phone}`, pageWidth / 2, pageHeight - 12, { align: 'center' })
    }

    // Border
    pdf.setDrawColor(220)
    pdf.setLineWidth(0.3)
    pdf.rect(4, 4, pageWidth - 8, pageHeight - 8)

    // Corner marks
    const cornerSize = 8
    pdf.setLineWidth(0.5)
    // Top-left
    pdf.line(4, 4 + cornerSize, 4, 4)
    pdf.line(4, 4, 4 + cornerSize, 4)
    // Top-right
    pdf.line(pageWidth - 4 - cornerSize, 4, pageWidth - 4, 4)
    pdf.line(pageWidth - 4, 4, pageWidth - 4, 4 + cornerSize)
    // Bottom-left
    pdf.line(4, pageHeight - 4 - cornerSize, 4, pageHeight - 4)
    pdf.line(4, pageHeight - 4, 4 + cornerSize, pageHeight - 4)
    // Bottom-right
    pdf.line(pageWidth - 4 - cornerSize, pageHeight - 4, pageWidth - 4, pageHeight - 4)
    pdf.line(pageWidth - 4, pageHeight - 4 - cornerSize, pageWidth - 4, pageHeight - 4)
  }

  return Buffer.from(pdf.output('arraybuffer'))
}

/**
 * Generate single QR code image for download
 */
export async function generateSingleQRImage(
  table: QRTableData,
  appUrl: string
): Promise<{ dataUrl: string; pdf: Buffer }> {
  const menuUrl = `${appUrl}/m/${table.outletSlug}?token=${table.qrToken}`
  const dataUrl = await generateQRDataUrl(menuUrl)

  // Generate PDF for single table
  const pdf = await generateQRPdf([table], appUrl)

  return { dataUrl, pdf }
}
