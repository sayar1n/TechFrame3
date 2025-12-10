program LegacyCSV;

{$mode objfpc}{$H+}

uses
  SysUtils, DateUtils, Unix;

function GetEnvDef(const name, def: string): string;
var v: string;
begin
  v := GetEnvironmentVariable(name);
  if v = '' then Exit(def) else Exit(v);
end;

function RandFloat(minV, maxV: Double): Double;
begin
  Result := minV + Random * (maxV - minV);
end;

// ДОБАВЛЕНО: Функция форматирования значения для CSV
function FormatCSVValue(const value: string; isString: Boolean = False): string;
var
  needsQuotes: Boolean;
  i: Integer;
begin
  if not isString then
  begin
    // Для чисел и других не-строк просто возвращаем значение
    Result := value;
    Exit;
  end;
  
  // Для строк проверяем, нужны ли кавычки
  needsQuotes := False;
  for i := 1 to Length(value) do
  begin
    if (value[i] = ',') or (value[i] = '"') or (value[i] = #10) or (value[i] = #13) then
    begin
      needsQuotes := True;
      Break;
    end;
  end;
  
  if needsQuotes then
  begin
    // Экранируем кавычки удвоением
    Result := '"' + StringReplace(value, '"', '""', [rfReplaceAll]) + '"';
  end
  else
    Result := value;
end;

// ДОБАВЛЕНО: Функция форматирования timestamp в ISO 8601 формат
// PostgreSQL понимает ISO 8601 формат, но для надежности используем стандартный формат PostgreSQL
function FormatTimestamp(dt: TDateTime): string;
begin
  // Формат ISO 8601: YYYY-MM-DDTHH:MM:SS (PostgreSQL автоматически распознает как TIMESTAMPTZ)
  // Используем формат с T для ISO 8601 совместимости
  Result := FormatDateTime('yyyy-mm-dd"T"hh:nn:ss', dt);
end;

// ДОБАВЛЕНО: Функция форматирования булевого значения
function FormatBoolean(b: Boolean): string;
begin
  if b then
    Result := 'ИСТИНА'
  else
    Result := 'ЛОЖЬ';
end;

// ДОБАВЛЕНО: Функция форматирования числа для CSV (без лишних нулей, если возможно)
function FormatNumber(num: Double; decimals: Integer = 2): string;
begin
  Result := FormatFloat('0.' + StringOfChar('0', decimals), num);
  // Убираем лишние нули в конце (опционально, для читаемости)
  // Но для NUMERIC(6,2) лучше оставить фиксированное количество знаков
end;

procedure GenerateAndCopy();
var
  outDir, fn, fullpath, pghost, pgport, pguser, pgpass, pgdb, copyCmd: string;
  f: TextFile;
  ts: string;
  voltageVal, tempVal: Double;
  timestampStr, voltageStr, tempStr, sourceFileStr: string;
begin
  outDir := GetEnvDef('CSV_OUT_DIR', '/data/csv');
  ts := FormatDateTime('yyyymmdd_hhnnss', Now);
  fn := 'telemetry_' + ts + '.csv';
  fullpath := IncludeTrailingPathDelimiter(outDir) + fn;

  // ДОБАВЛЕНО: Генерация значений с правильным форматированием для CSV
  voltageVal := RandFloat(3.2, 12.6);
  tempVal := RandFloat(-50.0, 80.0);
  
  // 1. Время и даты - timestamp (ISO 8601 формат: YYYY-MM-DDTHH:MM:SS)
  timestampStr := FormatTimestamp(Now);
  
  // 2. Логические блоки: ИСТИНА и ЛОЖЬ (функция FormatBoolean добавлена для будущего использования)
  // В текущей таблице telemetry_legacy нет булевых полей, но функция готова к использованию
  
  // 3. Числа - числовой формат (без кавычек, точка как десятичный разделитель)
  voltageStr := FormatNumber(voltageVal, 2);
  tempStr := FormatNumber(tempVal, 2);
  
  // 4. Строки - текст (в кавычках только если содержат запятые, кавычки или переносы строк)
  sourceFileStr := FormatCSVValue(fn, True);

  // ДОБАВЛЕНО: Запись CSV с правильным форматированием
  AssignFile(f, fullpath);
  Rewrite(f);
  Writeln(f, 'recorded_at,voltage,temp,source_file');
  Writeln(f, timestampStr + ',' + voltageStr + ',' + tempStr + ',' + sourceFileStr);
  CloseFile(f);

  // COPY into Postgres
  pghost := GetEnvDef('PGHOST', 'db');
  pgport := GetEnvDef('PGPORT', '5432');
  pguser := GetEnvDef('PGUSER', 'monouser');
  pgpass := GetEnvDef('PGPASSWORD', 'monopass');
  pgdb   := GetEnvDef('PGDATABASE', 'monolith');

  // Use psql with COPY FROM PROGRAM for simplicity
  // Here we call psql reading from file
  // Устанавливаем PGPASSWORD через shell перед вызовом psql
  copyCmd := 'PGPASSWORD=' + pgpass + ' psql "host=' + pghost + ' port=' + pgport + ' user=' + pguser + ' dbname=' + pgdb + '" ' +
             '-c "\copy telemetry_legacy(recorded_at, voltage, temp, source_file) FROM ''' + fullpath + ''' WITH (FORMAT csv, HEADER true)"';
  // Execute using fpSystem from Unix unit
  fpSystem(copyCmd);
end;

var period: Integer;
begin
  Randomize;
  period := StrToIntDef(GetEnvDef('GEN_PERIOD_SEC', '300'), 300);
  while True do
  begin
    try
      GenerateAndCopy();
    except
      on E: Exception do
        WriteLn('Legacy error: ', E.Message);
    end;
    Sleep(period * 1000);
  end;
end.

