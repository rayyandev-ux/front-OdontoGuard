import fs from 'fs'
import path from 'path'
import Tesseract, { createWorker } from 'tesseract.js'
import sharp from 'sharp'
import process from 'node:process'

function toDataUri(buf, ext) {
  return 'data:image/' + (ext || 'jpeg') + ';base64,' + buf.toString('base64')
}

function extractData(rawText) {
  const text = String(rawText || '').replace(/\r/g, '')
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean)
  const pick = re => { const m = text.match(re); return m && m[1] ? String(m[1]).trim() : '' }

  let nombres = pick(/Nombres\s*[-:]?\s*(.+)/i)
  let apellidos = pick(/Apellidos\s*[-:]?\s*(.+)/i)
  const bothIdx = lines.findIndex(l => /nombres?.{0,40}apellid/i.test(l))
  if (bothIdx >= 0) {
    let both = lines[bothIdx].replace(/^.*apellid\s*(?:o|os)?\s*[-:]?\s*/i, '').trim()
    if (!both || both.length < 3) {
      for (let j = bothIdx + 1; j < Math.min(lines.length, bothIdx + 3); j++) {
        if (/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(lines[j])) { both = lines[j].trim(); break }
      }
    }
    const parts = both.split(/\s+/).filter(Boolean)
    if (parts.length >= 3) { apellidos = parts.slice(-2).join(' '); nombres = parts.slice(0, -2).join(' ') }
    else if (parts.length === 2) { nombres = parts[0]; apellidos = parts[1] }
    else if (parts.length === 1) { nombres = parts[0] }
  }
  if (!apellidos) {
    const both = pick(/Nombres\s*y\s*Apellid[oa]s?\s*[-:]?\s*(.+)/i)
    if (both) {
      const parts = both.split(/\s+/).filter(Boolean)
      if (parts.length >= 3) { apellidos = parts.slice(-2).join(' '); nombres = parts.slice(0, -2).join(' ') }
      else if (parts.length === 2) { nombres = parts[0]; apellidos = parts[1] }
    }
  }

  const dni = pick(/DNI\s*[-:]?\s*(\d{8})/i)
  const motivoConsulta = pick(/Motivo\s*de\s*consulta\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i)
  const enfermedadInicio = pick(/Inicio\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i)
  const enfermedadEvolucion = pick(/Evoluci[oó]n\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i)
  const estadoActual = pick(/Estado[_\s]*Actual\s*[-:]?\s*([\s\S]*?)(?:\n|$)/i)

  return {
    nombres,
    apellidos,
    dni,
    motivoConsulta,
    enfermedadActual: { inicio: enfermedadInicio, evolucion: enfermedadEvolucion, estadoActual },
    raw: text
  }
}

async function main() {
  const dir = process.argv[2]
  if (!dir) { console.error('Usage: node scripts/analyze-folder.js <directory>'); process.exit(1) }
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp)$/i.test(f)).map(f => path.join(dir, f))
  const results = []
  const worker = await createWorker('spa')
  await worker.setParameters({ tessedit_pageseg_mode: 6 })
  for (const file of files) {
    const buf = fs.readFileSync(file)
    const processed = await sharp(buf).rotate().greyscale().normalize().threshold(160).toFormat('png').toBuffer()
    const uri = toDataUri(processed, 'png')
    const rec = await worker.recognize(uri)
    const data = extractData(rec?.data?.text || '')
    results.push({ file: path.basename(file), ...data })
  }
  await worker.terminate()
  console.log(JSON.stringify(results, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })
