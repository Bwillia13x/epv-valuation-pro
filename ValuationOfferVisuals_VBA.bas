Sub BuildValuationVisuals()
    ' Constants (all $000s except percentages/multiples)
    Const REV_2024 As Double = 3726.102
    Const EBITDA10 As Double = 687.626
    Const MULT As Double = 7#
    Const EV As Double = 4813.384
    Const INTEREST_2024 As Double = 194.812
    Const BLENDED_RATE As Double = 0.1
    Dim NET_DEBT As Double: NET_DEBT = INTEREST_2024 / BLENDED_RATE
    Dim EQUITY As Double: EQUITY = EV - NET_DEBT
    Const CASH_PCT As Double = 0.7
    Dim CASH_CLOSE As Double: CASH_CLOSE = EQUITY * CASH_PCT
    Dim ROLLOVER As Double: ROLLOVER = EQUITY * (1 - CASH_PCT)
    
    ' Sensitivities
    Dim MULTS As Variant: MULTS = Array(5.5, 6#, 6.5, 7#, 7.5)
    Dim MKT_PCTS As Variant: MKT_PCTS = Array(0.1, 0.11, 0.12, 0.13, 0.14)
    Dim RATES As Variant: RATES = Array(0.08, 0.09, 0.1, 0.11, 0.12)
    
    ' Create new workbook
    Dim wb As Workbook
    Set wb = Workbooks.Add
    
    ' Delete default sheets except first one
    Application.DisplayAlerts = False
    Do While wb.Worksheets.Count > 1
        wb.Worksheets(wb.Worksheets.Count).Delete
    Loop
    Application.DisplayAlerts = True
    
    ' Create and name worksheets
    Dim wsVal As Worksheet, wsVis As Worksheet
    Set wsVal = wb.Worksheets(1)
    wsVal.Name = "Valuation & Offer"
    Set wsVis = wb.Worksheets.Add(After:=wsVal)
    wsVis.Name = "Visuals"
    
    ' ===== POPULATE VALUATION & OFFER SHEET =====
    With wsVal
        .Cells(1, 1).Value = "Item"
        .Cells(1, 2).Value = "Value ($000s)"
        .Cells(1, 3).Value = "Notes"
        
        Dim row As Long: row = 3
        
        ' Valuation (EV basis)
        .Cells(row, 1).Value = "=== VALUATION (EV BASIS) ==="
        row = row + 1
        .Cells(row, 1).Value = "Enterprise Value"
        .Cells(row, 2).Value = EV
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "EV_Implied", .Cells(row, 2)
        row = row + 1
        
        .Cells(row, 1).Value = "Cash Percentage"
        .Cells(row, 2).Value = CASH_PCT
        .Cells(row, 2).NumberFormat = "0.0%"
        wb.Names.Add "CashPct", .Cells(row, 2)
        row = row + 1
        
        .Cells(row, 1).Value = "Implied Cash Paid at Close"
        .Cells(row, 2).Value = EV * CASH_PCT
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "Cash_EV", .Cells(row, 2)
        row = row + 1
        
        .Cells(row, 1).Value = "Implied Equity Paid at Close"
        .Cells(row, 2).Value = EV * (1 - CASH_PCT)
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "Equity_EV", .Cells(row, 2)
        row = row + 2
        
        ' Capital Bridge
        .Cells(row, 1).Value = "=== CAPITAL BRIDGE ==="
        row = row + 1
        .Cells(row, 1).Value = "Blended Rate"
        .Cells(row, 2).Value = BLENDED_RATE
        .Cells(row, 2).NumberFormat = "0.0%"
        row = row + 1
        
        .Cells(row, 1).Value = "Interest 2024"
        .Cells(row, 2).Value = INTEREST_2024
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "Interest2024", .Cells(row, 2)
        row = row + 1
        
        .Cells(row, 1).Value = "Implied Net Debt"
        .Cells(row, 2).Value = NET_DEBT
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "NetDebt", .Cells(row, 2)
        row = row + 1
        
        .Cells(row, 1).Value = "Equity Value (Proceeds Base)"
        .Cells(row, 2).Value = EQUITY
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "Equity_Base", .Cells(row, 2)
        row = row + 2
        
        ' Proceeds (Equity basis)
        .Cells(row, 1).Value = "=== PROCEEDS (EQUITY BASIS) ==="
        row = row + 1
        .Cells(row, 1).Value = "Cash at Close"
        .Cells(row, 2).Value = CASH_CLOSE
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "Cash_EQ", .Cells(row, 2)
        row = row + 1
        
        .Cells(row, 1).Value = "Rollover"
        .Cells(row, 2).Value = ROLLOVER
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "Rollover_EQ", .Cells(row, 2)
        row = row + 2
        
        ' Operational data
        .Cells(row, 1).Value = "=== OPERATIONAL DATA ==="
        row = row + 1
        .Cells(row, 1).Value = "Revenue 2024"
        .Cells(row, 2).Value = REV_2024
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "Revenue2024", .Cells(row, 2)
        row = row + 1
        
        .Cells(row, 1).Value = "EBITDA (10% Marketing)"
        .Cells(row, 2).Value = EBITDA10
        .Cells(row, 2).NumberFormat = "#,##0.00"
        wb.Names.Add "EBITDA10", .Cells(row, 2)
        
        .Columns.AutoFit
    End With
    
    ' ===== CREATE CHARTS ON VISUALS SHEET =====
    With wsVis
        ' 1. WATERFALL CHART: Bridge from EV to Equity Value
        .Cells(2, 1).Value = "Category"
        .Cells(2, 2).Value = "Value"
        .Cells(3, 1).Value = "Enterprise Value"
        .Cells(3, 2).Value = EV
        .Cells(4, 1).Value = "Net Debt"
        .Cells(4, 2).Value = -NET_DEBT
        .Cells(5, 1).Value = "Debt-like Items"
        .Cells(5, 2).Value = 0
        .Cells(6, 1).Value = "Cash-like Items"
        .Cells(6, 2).Value = 0
        .Cells(7, 1).Value = "NWC Adjustment"
        .Cells(7, 2).Value = 0
        .Cells(8, 1).Value = "Transaction Fees"
        .Cells(8, 2).Value = 0
        .Cells(9, 1).Value = "Equity Value"
        .Cells(9, 2).Value = EQUITY
        
        Dim waterfallChart As ChartObject
        Set waterfallChart = .ChartObjects.Add(Left:=.Range("D2").Left, Top:=.Range("D2").Top, Width:=400, Height:=250)
        With waterfallChart.Chart
            .SetSourceData .Range("A2:B9")
            .ChartType = xlWaterfall
            .HasTitle = True
            .ChartTitle.Text = "Bridge from EV to Equity Value ($000s)"
            .HasLegend = False
        End With
        
        ' 2. DOUGHNUT CHART: Proceeds at Close
        .Cells(12, 1).Value = "Component"
        .Cells(12, 2).Value = "Value"
        .Cells(13, 1).Value = "Cash at Close"
        .Cells(13, 2).Value = CASH_CLOSE
        .Cells(14, 1).Value = "Rollover"
        .Cells(14, 2).Value = ROLLOVER
        
        Dim proceedsChart As ChartObject
        Set proceedsChart = .ChartObjects.Add(Left:=.Range("D17").Left, Top:=.Range("D17").Top, Width:=200, Height:=200)
        With proceedsChart.Chart
            .SetSourceData .Range("A12:B14")
            .ChartType = xlDoughnut
            .HasTitle = True
            .ChartTitle.Text = "Proceeds at Close (Equity Value Basis)"
            .SeriesCollection(1).HasDataLabels = True
            .SeriesCollection(1).DataLabels.ShowValue = True
            .SeriesCollection(1).DataLabels.ShowPercentage = True
        End With
        
        ' 3. COLUMN CHART: EBITDA vs Marketing Spend
        .Cells(17, 9).Value = "Marketing %"
        .Cells(17, 10).Value = "EBITDA"
        .Cells(18, 9).Value = "10%"
        .Cells(18, 10).Value = EBITDA10
        .Cells(19, 9).Value = "12%"
        .Cells(19, 10).Value = EBITDA10 - (0.12 - 0.1) * REV_2024
        .Cells(20, 9).Value = "14%"
        .Cells(20, 10).Value = EBITDA10 - (0.14 - 0.1) * REV_2024
        
        Dim marketingChart As ChartObject
        Set marketingChart = .ChartObjects.Add(Left:=.Range("I17").Left, Top:=.Range("I17").Top, Width:=200, Height:=200)
        With marketingChart.Chart
            .SetSourceData .Range("I17:J20")
            .ChartType = xlColumnClustered
            .HasTitle = True
            .ChartTitle.Text = "EBITDA vs Marketing Spend"
        End With
        
        ' 4. HEATMAP: Equity Value (Multiple × Marketing%)
        Dim heatmapStartRow As Long: heatmapStartRow = 32
        .Cells(heatmapStartRow, 1).Value = "Multiple \ Marketing %"
        
        ' Headers
        Dim i As Long, j As Long
        For i = 0 To UBound(MKT_PCTS)
            .Cells(heatmapStartRow, i + 2).Value = MKT_PCTS(i)
            .Cells(heatmapStartRow, i + 2).NumberFormat = "0.0%"
        Next i
        
        ' Data
        For i = 0 To UBound(MULTS)
            .Cells(heatmapStartRow + 1 + i, 1).Value = MULTS(i)
            For j = 0 To UBound(MKT_PCTS)
                Dim ebitda As Double: ebitda = EBITDA10 - (MKT_PCTS(j) - 0.1) * REV_2024
                Dim ev_calc As Double: ev_calc = ebitda * MULTS(i)
                Dim equity_calc As Double: equity_calc = ev_calc - NET_DEBT
                .Cells(heatmapStartRow + 1 + i, j + 2).Value = equity_calc
                .Cells(heatmapStartRow + 1 + i, j + 2).NumberFormat = "#,##0"
            Next j
        Next i
        
        ' Apply conditional formatting to heatmap
        Dim heatmapRange As Range
        Set heatmapRange = .Range(.Cells(heatmapStartRow + 1, 2), .Cells(heatmapStartRow + UBound(MULTS) + 1, UBound(MKT_PCTS) + 2))
        heatmapRange.FormatConditions.AddColorScale(ColorScaleType:=3)
        With heatmapRange.FormatConditions(1).ColorScale
            .ColorScaleCriteria(1).Type = xlConditionValueLowestValue
            .ColorScaleCriteria(1).FormatColor.Color = RGB(255, 0, 0) ' Red
            .ColorScaleCriteria(2).Type = xlConditionValuePercentile
            .ColorScaleCriteria(2).Value = 50
            .ColorScaleCriteria(2).FormatColor.Color = RGB(255, 255, 0) ' Yellow
            .ColorScaleCriteria(3).Type = xlConditionValueHighestValue
            .ColorScaleCriteria(3).FormatColor.Color = RGB(0, 255, 0) ' Green
        End With
        
        ' 5. COMBO CHART: Debt Rate vs Net Debt & Equity Value
        .Cells(42, 1).Value = "Rate"
        .Cells(42, 2).Value = "Net Debt"
        .Cells(42, 3).Value = "Equity Value"
        
        For i = 0 To UBound(RATES)
            .Cells(43 + i, 1).Value = RATES(i)
            .Cells(43 + i, 1).NumberFormat = "0.0%"
            .Cells(43 + i, 2).Value = INTEREST_2024 / RATES(i)
            .Cells(43 + i, 3).Value = EV - (INTEREST_2024 / RATES(i))
        Next i
        
        Dim rateChart As ChartObject
        Set rateChart = .ChartObjects.Add(Left:=.Range("D42").Left, Top:=.Range("D42").Top, Width:=300, Height:=250)
        With rateChart.Chart
            .SetSourceData .Range("A42:C47")
            .ChartType = xlColumnClustered
            .HasTitle = True
            .ChartTitle.Text = "Debt Rate vs Net Debt & Equity Value (Method A)"
            ' Convert second series to line
            .SeriesCollection(2).ChartType = xlLine
            .SeriesCollection(2).AxisGroup = xlSecondary
        End With
        
        ' 6. SCATTER PLOT: Monte Carlo Simulation
        Dim mcStartRow As Long: mcStartRow = 60
        .Cells(mcStartRow, 1).Value = "EV"
        .Cells(mcStartRow, 2).Value = "Equity Value"
        
        ' Generate Monte Carlo data (limited to 500 points for VBA performance)
        Randomize
        For i = 1 To 500
            Dim mkt As Double: mkt = TriangularRandom(0.1, 0.1, 0.14)
            Dim mult As Double: mult = TriangularRandom(5.5, 7#, 7.5)
            Dim rate As Double: rate = TriangularRandom(0.08, 0.1, 0.12)
            
            Dim ebitda_mc As Double: ebitda_mc = EBITDA10 - (mkt - 0.1) * REV_2024
            Dim ev_draw As Double: ev_draw = ebitda_mc * mult
            Dim nd_mc As Double: nd_mc = INTEREST_2024 / rate
            Dim eq_mc As Double: eq_mc = ev_draw - nd_mc
            
            .Cells(mcStartRow + i, 1).Value = ev_draw
            .Cells(mcStartRow + i, 2).Value = eq_mc
        Next i
        
        Dim mcChart As ChartObject
        Set mcChart = .ChartObjects.Add(Left:=.Range("K42").Left, Top:=.Range("K42").Top, Width:=250, Height:=300)
        With mcChart.Chart
            .SetSourceData .Range("A60:B560")
            .ChartType = xlXYScatter
            .HasTitle = True
            .ChartTitle.Text = "Monte Carlo: EV vs Equity Value (500 sims)"
        End With
        
        ' ===== SUMMARY REPORT =====
        Dim reportStartRow As Long: reportStartRow = 65
        .Cells(reportStartRow, 1).Value = "=== VALUATION SUMMARY REPORT ==="
        .Cells(reportStartRow + 2, 1).Value = "Enterprise Value ($000s):"
        .Cells(reportStartRow + 2, 2).Value = Format(EV, "#,##0.00")
        
        .Cells(reportStartRow + 3, 1).Value = "Net Debt ($000s):"
        .Cells(reportStartRow + 3, 2).Value = Format(NET_DEBT, "#,##0.00")
        
        .Cells(reportStartRow + 4, 1).Value = "Equity Base ($000s):"
        .Cells(reportStartRow + 4, 2).Value = Format(EQUITY, "#,##0.00")
        
        .Cells(reportStartRow + 5, 1).Value = "Cash at Close ($000s):"
        .Cells(reportStartRow + 5, 2).Value = Format(CASH_CLOSE, "#,##0.00")
        
        .Cells(reportStartRow + 6, 1).Value = "Rollover ($000s):"
        .Cells(reportStartRow + 6, 2).Value = Format(ROLLOVER, "#,##0.00")
        
        ' Validation checks
        Dim cashPlusRollover As Double: cashPlusRollover = CASH_CLOSE + ROLLOVER
        Dim sumCheck As Boolean: sumCheck = Abs(cashPlusRollover - EQUITY) < 0.01
        Dim percentCheck As Boolean: percentCheck = Abs((CASH_CLOSE / EQUITY) + (ROLLOVER / EQUITY) - 1#) < 0.001
        
        .Cells(reportStartRow + 8, 1).Value = "VALIDATION CHECKS:"
        .Cells(reportStartRow + 9, 1).Value = "Cash + Rollover = Equity Base:"
        .Cells(reportStartRow + 9, 2).Value = IIf(sumCheck, "TRUE", "FALSE")
        
        .Cells(reportStartRow + 10, 1).Value = "Cash% + Rollover% = 100%:"
        .Cells(reportStartRow + 10, 2).Value = IIf(percentCheck, "TRUE", "FALSE")
        
        .Columns.AutoFit
    End With
    
    ' Save workbook
    wb.SaveAs ThisWorkbook.Path & "\Valuation_Offer_Visuals.xlsx"
    
    MsgBox "Valuation & Offer workbook created successfully!" & vbCrLf & _
           "Saved as: Valuation_Offer_Visuals.xlsx", vbInformation
End Sub

' Helper function for triangular distribution
Function TriangularRandom(low As Double, mode As Double, high As Double) As Double
    Dim u As Double: u = Rnd()
    Dim c As Double: c = (mode - low) / (high - low)
    
    If u < c Then
        TriangularRandom = low + Sqr(u * (high - low) * (mode - low))
    Else
        TriangularRandom = high - Sqr((1 - u) * (high - low) * (high - mode))
    End If
End Function 