import { Component } from '@angular/core';
import { NgxCsvParser, NgxCSVParserError } from 'ngx-csv-parser';
import {ActiveElement, Chart, ChartConfiguration, ChartEvent} from "chart.js";
import {PrimeNGConfig} from "primeng/api";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  public columnHeaders: string[] = [];
  public dropdownOptions: string[] = [];

  public selectedXAxis = '';
  public selectedYAxis = '';

  public scatterChartDatasets: ChartConfiguration<'scatter'>['data']['datasets'] = [
    {
      data: [],
      label: '',
      pointRadius: 10,
    },
  ];

  public scatterChartOptions: ChartConfiguration<'scatter'>['options'] = {
    responsive: true,
    onClick(event: ChartEvent, elements: ActiveElement[], chart: Chart) {
      if (elements.length > 0) {
        const element = elements[0];
        const rawElement = chart.data.datasets[0].data[element.index] as any;
        const url = rawElement['Url'];
        if (url)
          window.open(url, '_blank')?.focus();
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const xLabel = this.selectedXAxis;
            const yLabel = this.selectedYAxis;
            const title = context.raw['Title'];
            return `${title}\n${xLabel} ${context.parsed.x}; ${yLabel}: ${context.parsed.y}`;
          }
        }
      }
    }
  };

  constructor(private ngxCsvParser: NgxCsvParser, private primengConfig: PrimeNGConfig) {}

  ngOnInit() { this.primengConfig.ripple = true; }

  updateSelectedXAxis($event: any): void {
    this.selectedXAxis = $event.value;
    this.setScatterChartDataFromSelectedHeaders();
  }
  updateSelectedYAxis($event: any): void {
    this.selectedYAxis = $event.value;
    this.setScatterChartDataFromSelectedHeaders();
  }

  // read in .csv
  onFileSelected($event: Event): void {
    const file = ($event.target as HTMLInputElement).files?.[0];
    if (!file) { return; }

    this.ngxCsvParser.parse(file, { header: true, delimiter: ',' })
      .pipe().subscribe((result) => {
        if (result instanceof NgxCSVParserError) {
          alert('Error parsing .csv: ' + result.message);
        } else {
          if (result.length > 0) {
            if (this.validateHeaders(result[0])) {
              this.columnHeaders = Object.getOwnPropertyNames(result[0])
              this.columnHeaders.forEach((h: any) => {
                // only add headers that have numeric values to the dropdowns
                if (isFinite(result[0][h])) {
                  this.dropdownOptions.push(h);
                }
              });

              // this jank is necessary to get the dropdowns to update
              this.selectedXAxis = this.dropdownOptions[this.dropdownOptions.indexOf('Current # Watchers')];
              this.selectedYAxis = this.dropdownOptions[this.dropdownOptions.indexOf('Current Price')];

              this.scatterChartDatasets[0].data = result;
              this.setScatterChartDataFromSelectedHeaders();
            } else {
              alert('Error parsing .csv: Invalid headers');
            }
          }
          else {
            alert('Error parsing .csv: No data found');
          }
        }
      }, (error: NgxCSVParserError) => {
          alert('Error parsing .csv: ' + error.message);
      });
  }

  private setScatterChartDataFromSelectedHeaders(): void {
    this.scatterChartDatasets[0].data.forEach((element: any) => {
      element.x = element[this.selectedXAxis];
      element.y = element[this.selectedYAxis];
    });

    // force change detection to update chart
    this.scatterChartDatasets = [...this.scatterChartDatasets];
  }

  private validateHeaders(arrayElement: any) {
    return arrayElement.hasOwnProperty('Current # Watchers') && arrayElement.hasOwnProperty('Current Price') && arrayElement.hasOwnProperty('Title');
  }
}
