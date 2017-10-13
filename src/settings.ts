/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    "use strict";
    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    export class VisualSettings extends DataViewObjectsParser {
      public dataPoint: dataPointSettings = new dataPointSettings();
      public axes: axesSettings = new axesSettings();
    }

    export class dataPointSettings {
      public showHexbins: boolean = true;
      public showHexbinLabels: boolean = true;
      public binColor: string = "#01B8AA";
      public binRadius: string = "30";
      public binOutline: string = "#FFFFFF";
      public showDots: boolean = true;
      public dotColor: string = "#374649";
      
      //public fillRule: string = "";
      //public fontSize: number = 12;
    }

    export class axesSettings {
       public showXAxis: boolean = true;
       public showXTitle: boolean = true;
       public showYAxis: boolean = true;
       public showYTitle: boolean = true;
       public originZeroZero: boolean = false;
    }

}
