import * as XLSX from 'xlsx'

export function formatValueForExport(value: any, type: 'timestamp' | 'boolean' | 'number' | 'string'): any {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  switch (type) {
    case 'timestamp':
      if (value instanceof Date) {
        return value.toISOString()
      }
      if (typeof value === 'string') {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date.toISOString()
        }
      }
      return String(value)
    
    case 'boolean':
      if (typeof value === 'boolean') {
        return value ? 'ИСТИНА' : 'ЛОЖЬ'
      }
      if (value === 'true' || value === 'да' || value === 'yes' || value === 1) {
        return 'ИСТИНА'
      }
      if (value === 'false' || value === 'нет' || value === 'no' || value === 0) {
        return 'ЛОЖЬ'
      }
      return String(value)
    
    case 'number':
      const num = typeof value === 'number' ? value : parseFloat(String(value))
      return isNaN(num) ? String(value) : num
    
    case 'string':
    default:
      return String(value)
  }
}

/**
 * ДОБАВЛЕНО: Экспорт данных в CSV формат
 * Генерирует CSV файл с правильным форматированием значений
 */
export function exportToCSV(data: any[], headers: string[], filename: string) {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] ?? ''
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value
    }).join(',')
  })
  
  const csvContent = [csvHeaders, ...csvRows].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * ДОБАВЛЕНО: Экспорт данных в Excel формат (.xlsx)
 * Реализует алгоритм экспорта с подстановкой значений (дата и время)
 * Создает файл с правильными типами данных для каждого столбца
 */
export function exportToExcel(
  data: any[],
  headers: { key: string; label: string; type: 'timestamp' | 'boolean' | 'number' | 'string' }[],
  filename: string,
  sheetName: string = 'Данные'
) {
  const excelData = data.map(row => {
    const excelRow: any = {}
    headers.forEach(header => {
      excelRow[header.label] = formatValueForExport(row[header.key], header.type)
    })
    return excelRow
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(excelData, { header: headers.map(h => h.label) })

  const colWidths = headers.map(header => {
    const maxLength = Math.max(
      header.label.length,
      ...data.map(row => String(row[header.key] || '').length)
    )
    return { wch: Math.min(maxLength + 2, 50) }
  })
  ws['!cols'] = colWidths

  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

/**
 * ДОБАВЛЕНО: Экспорт астрономических событий в Excel
 * Для таблицы "Астрономические события (NeoWs)" на dashboard
 */
export function exportAstroEventsToExcel(events: any[], filename: string = `astro_events_${new Date().toISOString().split('T')[0]}.xlsx`) {
  const headers = [
    { key: 'number', label: '#', type: 'number' as const },
    { key: 'name', label: 'Тело', type: 'string' as const },
    { key: 'type', label: 'Событие', type: 'string' as const },
    { key: 'when', label: 'Когда (UTC)', type: 'timestamp' as const },
    { key: 'extra', label: 'Дополнительно', type: 'string' as const },
  ]

  exportToExcel(events, headers, filename, 'Астрономические события')
}

/**
 * ДОБАВЛЕНО: Экспорт астрономических событий в CSV
 * Для таблицы "Астрономические события (NeoWs)" на dashboard
 */
export function exportAstroEventsToCSV(events: any[], filename: string = `astro_events_${new Date().toISOString().split('T')[0]}.csv`) {
  const headers = ['#', 'Тело', 'Событие', 'Когда (UTC)', 'Дополнительно']
  const csvData = events.map((event, index) => ({
    '#': event.number || (index + 1),
    'Тело': event.name || '',
    'Событие': event.type || '',
    'Когда (UTC)': formatValueForExport(event.when, 'timestamp'),
    'Дополнительно': event.extra || '',
  }))

  exportToCSV(csvData, headers, filename)
}

/**
 * ДОБАВЛЕНО: Экспорт данных МКС в Excel
 * Для страницы ISS - возможность выкачать данные про МКС
 * Создает файл с двумя листами: "Последние данные" и "Тренд движения"
 */
export function exportIssDataToExcel(
  lastData: any,
  trendData: any,
  filename: string = `iss_data_${new Date().toISOString().split('T')[0]}.xlsx`
) {
  const wb = XLSX.utils.book_new()

  const lastHeaders = [
    { key: 'fetched_at', label: 'Время получения', type: 'timestamp' as const },
    { key: 'latitude', label: 'Широта', type: 'number' as const },
    { key: 'longitude', label: 'Долгота', type: 'number' as const },
    { key: 'altitude', label: 'Высота (км)', type: 'number' as const },
    { key: 'velocity', label: 'Скорость (км/ч)', type: 'number' as const },
  ]

  const lastDataRow = {
    fetched_at: lastData.fetched_at || new Date().toISOString(),
    latitude: lastData.payload?.latitude || '',
    longitude: lastData.payload?.longitude || '',
    altitude: lastData.payload?.altitude || '',
    velocity: lastData.payload?.velocity || '',
  }

  const lastExcelData = [lastDataRow].map(row => {
    const excelRow: any = {}
    lastHeaders.forEach(header => {
      excelRow[header.label] = formatValueForExport((row as any)[header.key], header.type)
    })
    return excelRow
  })

  const wsLast = XLSX.utils.json_to_sheet(lastExcelData, { header: lastHeaders.map(h => h.label) })
  wsLast['!cols'] = lastHeaders.map(() => ({ wch: 20 }))
  XLSX.utils.book_append_sheet(wb, wsLast, 'Последние данные')

  const trendHeaders = [
    { key: 'movement', label: 'Движение', type: 'boolean' as const },
    { key: 'delta_km', label: 'Смещение (км)', type: 'number' as const },
    { key: 'dt_sec', label: 'Интервал (сек)', type: 'number' as const },
    { key: 'velocity_kmh', label: 'Скорость (км/ч)', type: 'number' as const },
  ]

  const trendDataRow = {
    movement: trendData.movement,
    delta_km: trendData.delta_km || '',
    dt_sec: trendData.dt_sec || '',
    velocity_kmh: trendData.velocity_kmh || '',
  }

  const trendExcelData = [trendDataRow].map(row => {
    const excelRow: any = {}
    trendHeaders.forEach(header => {
      excelRow[header.label] = formatValueForExport((row as any)[header.key], header.type)
    })
    return excelRow
  })

  const wsTrend = XLSX.utils.json_to_sheet(trendExcelData, { header: trendHeaders.map(h => h.label) })
  wsTrend['!cols'] = trendHeaders.map(() => ({ wch: 20 }))
  XLSX.utils.book_append_sheet(wb, wsTrend, 'Тренд движения')
  XLSX.writeFile(wb, filename)
}

/**
 * ДОБАВЛЕНО: Экспорт данных МКС в CSV
 * Для страницы ISS - возможность выкачать данные про МКС
 */
export function exportIssDataToCSV(
  lastData: any,
  trendData: any,
  filename: string = `iss_data_${new Date().toISOString().split('T')[0]}.csv`
) {
  const headers = [
    'Время получения',
    'Широта',
    'Долгота',
    'Высота (км)',
    'Скорость (км/ч)',
    'Движение',
    'Смещение (км)',
    'Интервал (сек)',
    'Скорость тренда (км/ч)',
  ]

  const csvData = [{
    'Время получения': formatValueForExport(lastData.fetched_at, 'timestamp'),
    'Широта': formatValueForExport(lastData.payload?.latitude, 'number'),
    'Долгота': formatValueForExport(lastData.payload?.longitude, 'number'),
    'Высота (км)': formatValueForExport(lastData.payload?.altitude, 'number'),
    'Скорость (км/ч)': formatValueForExport(lastData.payload?.velocity, 'number'),
    'Движение': formatValueForExport(trendData.movement, 'boolean'),
    'Смещение (км)': formatValueForExport(trendData.delta_km, 'number'),
    'Интервал (сек)': formatValueForExport(trendData.dt_sec, 'number'),
    'Скорость тренда (км/ч)': formatValueForExport(trendData.velocity_kmh, 'number'),
  }]

  exportToCSV(csvData, headers, filename)
}

