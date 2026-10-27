<?php
/**
 * Pure-PHP .xlsx Reader & Writer (Zero External Dependencies)
 * Uses built-in zlib (gzinflate/gzdeflate) + SimpleXML
 */

class SimpleXlsxHelper {

    /**
     * Extract all entries from a ZIP (.xlsx) file into an array: [filename => content]
     */
    public static function unzipEntries(string $filePath): array {
        if (!file_exists($filePath)) {
            throw new Exception("File does not exist: $filePath");
        }

        $data = file_get_contents($filePath);
        if ($data === false || strlen($data) < 22) {
            throw new Exception("Invalid or empty XLSX file.");
        }

        // Locate End of Central Directory (EOCD) signature: PK\x05\x06
        $eocdPos = strrpos($data, "PK\x05\x06");
        if ($eocdPos === false) {
            throw new Exception("Not a valid ZIP/XLSX archive (EOCD not found).");
        }

        $eocd = unpack('vdisk/vstartDisk/vdiskEntries/vtotalEntries/VcdSize/VcdOffset', substr($data, $eocdPos + 4, 16));
        $cdOffset = $eocd['cdOffset'];
        $totalEntries = $eocd['totalEntries'];

        $entries = [];
        $pos = $cdOffset;

        for ($i = 0; $i < $totalEntries; $i++) {
            if (substr($data, $pos, 4) !== "PK\x01\x02") {
                break;
            }
            $cd = unpack(
                'vverMade/vverNeed/vflags/vmethod/vmodTime/vmodDate/Vcrc/VcompSize/VuncompSize/vnameLen/vextraLen/vcommentLen/vdiskStart/vintAttr/VextAttr/VlocalOffset',
                substr($data, $pos + 4, 42)
            );
            $name = substr($data, $pos + 46, $cd['nameLen']);
            $pos += 46 + $cd['nameLen'] + $cd['extraLen'] + $cd['commentLen'];

            $localOffset = $cd['localOffset'];
            if (substr($data, $localOffset, 4) !== "PK\x03\x04") {
                continue;
            }
            $local = unpack('vver/vflags/vmethod/vmodTime/vmodDate/Vcrc/VcompSize/VuncompSize/vnameLen/vextraLen', substr($data, $localOffset + 4, 26));
            $dataStart = $localOffset + 30 + $local['nameLen'] + $local['extraLen'];
            $compData = substr($data, $dataStart, $cd['compSize']);

            if ($cd['method'] === 0) {
                $entries[$name] = $compData;
            } elseif ($cd['method'] === 8) {
                $inflated = @gzinflate($compData);
                if ($inflated !== false) {
                    $entries[$name] = $inflated;
                }
            }
        }

        return $entries;
    }

    /**
     * Convert Excel column letters (e.g. A, B, AA) to 0-based index
     */
    private static function colIndexFromRef(string $cellRef): int {
        if (preg_match('/^([A-Z]+)/i', $cellRef, $m)) {
            $letters = strtoupper($m[1]);
            $index = 0;
            for ($i = 0; $i < strlen($letters); $i++) {
                $index = $index * 26 + (ord($letters[$i]) - ord('A') + 1);
            }
            return $index - 1;
        }
        return 0;
    }

    /**
     * Convert 0-based column index to Excel column letters (e.g. 0 -> A)
     */
    private static function colLettersFromIndex(int $index): string {
        $letters = '';
        $n = $index + 1;
        while ($n > 0) {
            $rem = ($n - 1) % 26;
            $letters = chr(65 + $rem) . $letters;
            $n = intdiv($n - 1, 26);
        }
        return $letters;
    }

    /**
     * Read all sheets from an .xlsx file into associative array:
     * [
     *   'SheetName' => [
     *     'columns' => ['col1', 'col2', ...],
     *     'rows' => [ ['col1' => val1, 'col2' => val2], ... ]
     *   ]
     * ]
     */
    public static function readWorkbookWithMeta(string $filePath): array {
        $entries = self::unzipEntries($filePath);

        if (!isset($entries['xl/workbook.xml'])) {
            throw new Exception("Invalid Excel workbook: missing xl/workbook.xml");
        }

        // Parse sharedStrings.xml if present
        $sharedStrings = [];
        if (isset($entries['xl/sharedStrings.xml'])) {
            $ssXml = @simplexml_load_string($entries['xl/sharedStrings.xml']);
            if ($ssXml !== false) {
                $ssXml->registerXPathNamespace('s', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main');
                foreach ($ssXml->si as $si) {
                    if (isset($si->t)) {
                        $sharedStrings[] = (string)$si->t;
                    } elseif (isset($si->r)) {
                        $text = '';
                        foreach ($si->r as $run) {
                            $text .= (string)$run->t;
                        }
                        $sharedStrings[] = $text;
                    } else {
                        $sharedStrings[] = '';
                    }
                }
            }
        }

        // Map rId -> target path from xl/_rels/workbook.xml.rels
        $relsMap = [];
        if (isset($entries['xl/_rels/workbook.xml.rels'])) {
            $relsXml = @simplexml_load_string($entries['xl/_rels/workbook.xml.rels']);
            if ($relsXml !== false) {
                foreach ($relsXml->Relationship as $rel) {
                    $id = (string)$rel['Id'];
                    $target = ltrim((string)$rel['Target'], '/');
                    if (!str_starts_with($target, 'xl/')) {
                        $target = 'xl/' . $target;
                    }
                    $relsMap[$id] = $target;
                }
            }
        }

        $wbXml = @simplexml_load_string($entries['xl/workbook.xml']);
        if ($wbXml === false) {
            throw new Exception("Failed to parse xl/workbook.xml");
        }

        $result = [];
        $sheetIdx = 1;
        foreach ($wbXml->sheets->sheet as $sheetNode) {
            $sheetName = trim((string)$sheetNode['name']);
            $rAttrs = $sheetNode->attributes('http://schemas.openxmlformats.org/officeDocument/2006/relationships');
            $rId = isset($rAttrs['id']) ? (string)$rAttrs['id'] : '';

            $sheetPath = $relsMap[$rId] ?? ("xl/worksheets/sheet{$sheetIdx}.xml");
            $sheetIdx++;

            if (!isset($entries[$sheetPath])) {
                $result[$sheetName] = ['columns' => [], 'rows' => []];
                continue;
            }

            $wsXml = @simplexml_load_string($entries[$sheetPath]);
            if ($wsXml === false || !isset($wsXml->sheetData)) {
                $result[$sheetName] = ['columns' => [], 'rows' => []];
                continue;
            }

            $rawRows = [];
            foreach ($wsXml->sheetData->row as $rowNode) {
                $rowCells = [];
                $colCursor = 0;
                foreach ($rowNode->c as $c) {
                    $ref = (string)$c['r'];
                    $colIdx = $ref !== '' ? self::colIndexFromRef($ref) : $colCursor;
                    $colCursor = $colIdx + 1;

                    $type = (string)$c['t'];
                    $val = '';
                    if ($type === 's') {
                        $ssIdx = (int)((string)$c->v);
                        $val = $sharedStrings[$ssIdx] ?? '';
                    } elseif ($type === 'inlineStr') {
                        $val = isset($c->is->t) ? (string)$c->is->t : '';
                    } else {
                        $val = isset($c->v) ? (string)$c->v : '';
                    }
                    $rowCells[$colIdx] = trim($val);
                }
                $rawRows[] = $rowCells;
            }

            if (empty($rawRows)) {
                $result[$sheetName] = ['columns' => [], 'rows' => []];
                continue;
            }

            $headerRow = $rawRows[0];
            $maxCol = empty($headerRow) ? -1 : max(array_keys($headerRow));
            $columns = [];
            for ($cIdx = 0; $cIdx <= $maxCol; $cIdx++) {
                $colName = trim($headerRow[$cIdx] ?? '');
                if ($colName !== '') {
                    $columns[$cIdx] = $colName;
                }
            }

            $assocRows = [];
            for ($r = 1; $r < count($rawRows); $r++) {
                $rCells = $rawRows[$r];
                $item = [];
                $nonEmpty = false;
                foreach ($columns as $cIdx => $colName) {
                    $cellVal = $rCells[$cIdx] ?? '';
                    if ($cellVal !== '') {
                        $nonEmpty = true;
                    }
                    $item[$colName] = $cellVal;
                }
                if ($nonEmpty) {
                    $assocRows[] = $item;
                }
            }

            $result[$sheetName] = [
                'columns' => array_values($columns),
                'rows'    => $assocRows
            ];
        }

        return $result;
    }

    /**
     * Build a multi-sheet .xlsx binary string from an array of sheets:
     * [
     *   'SheetName' => [
     *     'headers' => ['col1', 'col2'],
     *     'rows' => [ ['val1', 'val2'], ... ]
     *   ]
     * ]
     */
    public static function buildWorkbookBinary(array $sheets): string {
        $zipFiles = [];

        // 1. _rels/.rels
        $zipFiles['_rels/.rels'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
            . '</Relationships>';

        // 2. xl/styles.xml (Header dark purple fill + white bold text, data borders)
        $zipFiles['xl/styles.xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            . '<fonts count="2">'
            . '<font><sz val="11"/><color rgb="FF000000"/><name val="Segoe UI"/></font>'
            . '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>'
            . '</fonts>'
            . '<fills count="3">'
            . '<fill><patternFill patternType="none"/></fill>'
            . '<fill><patternFill patternType="gray125"/></fill>'
            . '<fill><patternFill patternType="solid"><fgColor rgb="FF171F35"/><bgColor indexed="64"/></patternFill></fill>'
            . '</fills>'
            . '<borders count="2">'
            . '<border><left/><right/><top/><bottom/><diagonal/></border>'
            . '<border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>'
            . '</borders>'
            . '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            . '<cellXfs count="3">'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            . '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            . '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>'
            . '</cellXfs>'
            . '</styleSheet>';

        $sheetNodes = '';
        $relNodes = '<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
        $overrideNodes = '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            . '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';

        $idx = 1;
        foreach ($sheets as $sheetName => $sheetContent) {
            $safeSheetName = htmlspecialchars(substr($sheetName, 0, 31), ENT_XML1 | ENT_QUOTES, 'UTF-8');
            $sheetNodes .= '<sheet name="' . $safeSheetName . '" sheetId="' . $idx . '" r:id="rId' . $idx . '"/>';
            $relNodes .= '<Relationship Id="rId' . $idx . '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' . $idx . '.xml"/>';
            $overrideNodes .= '<Override PartName="/xl/worksheets/sheet' . $idx . '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';

            $headers = $sheetContent['headers'] ?? [];
            $rows = $sheetContent['rows'] ?? [];
            $allRows = array_merge([$headers], $rows);

            $sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                . '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                . '<sheetData>';

            foreach ($allRows as $rIdx => $rowVals) {
                $rowNum = $rIdx + 1;
                $styleId = ($rowNum === 1) ? 1 : 2;
                $sheetXml .= '<row r="' . $rowNum . '">';
                foreach (array_values($rowVals) as $cIdx => $cellVal) {
                    $colLet = self::colLettersFromIndex($cIdx);
                    $cellRef = $colLet . $rowNum;
                    $strVal = (string)($cellVal ?? '');
                    if ($rowNum > 1 && is_numeric($strVal) && !preg_match('/^0\d+$/', $strVal)) {
                        $sheetXml .= '<c r="' . $cellRef . '" s="' . $styleId . '"><v>' . $strVal . '</v></c>';
                    } else {
                        $escaped = htmlspecialchars($strVal, ENT_XML1 | ENT_QUOTES, 'UTF-8');
                        $sheetXml .= '<c r="' . $cellRef . '" s="' . $styleId . '" t="inlineStr"><is><t>' . $escaped . '</t></is></c>';
                    }
                }
                $sheetXml .= '</row>';
            }

            $sheetXml .= '</sheetData></worksheet>';
            $zipFiles["xl/worksheets/sheet{$idx}.xml"] = $sheetXml;
            $idx++;
        }

        $zipFiles['[Content_Types].xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            . '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            . '<Default Extension="xml" ContentType="application/xml"/>'
            . $overrideNodes
            . '</Types>';

        $zipFiles['xl/workbook.xml'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            . '<sheets>' . $sheetNodes . '</sheets>'
            . '</workbook>';

        $zipFiles['xl/_rels/workbook.xml.rels'] = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            . '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            . $relNodes
            . '</Relationships>';

        return self::packZip($zipFiles);
    }

    /**
     * Pack associative array [filename => content] into a standard ZIP binary
     */
    private static function packZip(array $files): string {
        $localParts = '';
        $centralParts = '';
        $offset = 0;
        $count = 0;

        foreach ($files as $name => $content) {
            $uncompSize = strlen($content);
            $crc = crc32($content);
            $compData = gzdeflate($content, 6);
            $compSize = strlen($compData);
            $nameLen = strlen($name);

            $localHeader = "PK\x03\x04"
                . pack('vvvvvVVVvv', 20, 0, 8, 0, 0, $crc, $compSize, $uncompSize, $nameLen, 0)
                . $name;

            $localParts .= $localHeader . $compData;

            $centralHeader = "PK\x01\x02"
                . pack('vvvvvvVVVvvvvvVV', 20, 20, 0, 8, 0, 0, $crc, $compSize, $uncompSize, $nameLen, 0, 0, 0, 0, 0, $offset)
                . $name;

            $centralParts .= $centralHeader;
            $offset += strlen($localHeader) + $compSize;
            $count++;
        }

        $cdSize = strlen($centralParts);
        $eocd = "PK\x05\x06" . pack('vvvvVVv', 0, 0, $count, $count, $cdSize, $offset, 0);

        return $localParts . $centralParts . $eocd;
    }
}
