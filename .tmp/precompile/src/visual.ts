/*
 *  Power BI Visual CLI
 *
 *  Copyright (c) David Eldersveld
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

module powerbi.extensibility.visual.hexbinScatter70A7F14565444FAA99F786FAD6EA5AE1  {
    "use strict";

    declare let d3: any;

    import DataViewValueColumnGroup = powerbi.DataViewValueColumnGroup;
    import DataRoleHelper = powerbi.extensibility.utils.dataview.DataRoleHelper;

    // powerbi.extensibility.utils.tooltip
    import tooltip = powerbi.extensibility.utils.tooltip;
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;

    // powerbi.extensibility.utils.chartutils
    import axisHelper = powerbi.extensibility.utils.chart.axis;

    // powerbi.extensibility.utils.formatting
    import ValueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
    import IValueFormatter = powerbi.extensibility.utils.formatting.IValueFormatter;

    interface ScatterDataPoint {
        category: string;
        xValue: number;
        yValue: number;
        measureValue: number;
        tooltips: VisualTooltipDataItem[];
        selectionId: powerbi.visuals.ISelectionId;
    }

    interface ScatterMetaData {
        xAxisLabel: string;
        yAxisLabel: string;
        measureIndex: number;
    }

    interface ScatterViewModel {
        scatterDataPoints: ScatterDataPoint[];
        scatterMetaData: ScatterMetaData[];
    }

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): any {
        let dataViews = options.dataViews;
        // console.log('visualTransform', dataViews);

        let viewModel: ScatterViewModel = {
            scatterDataPoints: [],
            scatterMetaData: []
        };

        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].categorical
            || !dataViews[0].categorical.categories
            || !dataViews[0].categorical.categories[0].source
            || !dataViews[0].categorical.values)
            return viewModel;

        let categorical = dataViews[0].categorical;
        let category = categorical.categories[0];
        let dataValue = categorical.values != null ? categorical.values[0] : [];
        let dataValues: DataViewValueColumns = categorical.values != null ? categorical.values : null;
        let grouped: DataViewValueColumnGroup[] = dataValues != null ? dataValues.grouped() : null;

        let categoryIndex = DataRoleHelper.getCategoryIndexOfRole(dataViews[0].categorical.categories, "category");
        let xIndex = DataRoleHelper.getMeasureIndexOfRole(grouped, "xAxis");
        let yIndex = DataRoleHelper.getMeasureIndexOfRole(grouped, "yAxis");
        let measureIndex = DataRoleHelper.getMeasureIndexOfRole(grouped, "measure");

        // console.log(categoryIndex, xIndex, yIndex, measureIndex);

        let metadata = dataViews[0].metadata;
        let categoryColumnName = metadata.columns.filter(c => c.roles["category"])[0].displayName;
        let xColumnName = xIndex === -1 ? "" : metadata.columns.filter(c => c.roles["xAxis"])[0].displayName;
        let yColumnName = yIndex === -1 ? "" : metadata.columns.filter(c => c.roles["yAxis"])[0].displayName;
        let valueColumnName = measureIndex === -1 ? "" : metadata.columns.filter(c => c.roles["measure"])[0].displayName;

        // console.log(categoryColumnName, xColumnName, yColumnName, valueColumnName);
        // console.log(metadata);

        let sDataPoints: ScatterDataPoint[] = [];
        let sMetaData: ScatterMetaData[] = [];

        let valueFormatterForCategories: IValueFormatter;
        let valueFormatterForX: IValueFormatter;
        let valueFormatterForY: IValueFormatter;
        let valueFormatterForMeasure: IValueFormatter;

        let xValues = [];
        let yValues = [];
        let measureValues = [];

        valueFormatterForCategories = ValueFormatter.create({
            format: ValueFormatter.getFormatStringByColumn(metadata.columns.filter(c => c.roles["category"])[0]),
            value: categorical.categories[categoryIndex]
        });

        // validate X, nulls to 0
        if (xIndex !== -1) {
            xValues = categorical.values[xIndex].values.map(function(x) {
                if (x == null) {
                    return 0;
                }
                return x;
            });

            valueFormatterForX = ValueFormatter.create({
                format: ValueFormatter.getFormatStringByColumn(metadata.columns.filter(c => c.roles["xAxis"])[0]),
                value: categorical.values[xIndex]
            });
        }

        // validate Y, nulls to 0
        if (yIndex !== -1) {
            yValues = categorical.values[yIndex].values.map(function(x) {
                if (x == null) {
                    return 0;
                }
                return x;
            });

            valueFormatterForY = ValueFormatter.create({
                format: ValueFormatter.getFormatStringByColumn(metadata.columns.filter(c => c.roles["yAxis"])[0]),
                value: categorical.values[yIndex]
            });
        }

        // validate Measure, nulls to 0
        if (measureIndex !== -1) {
            measureValues = categorical.values[measureIndex].values.map(function(x) {
                if (x == null) {
                    return 0;
                }
                return x;
            });

            valueFormatterForMeasure = ValueFormatter.create({
                format: ValueFormatter.getFormatStringByColumn(metadata.columns.filter(c => c.roles["measure"])[0]),
                value: categorical.values[measureIndex]
            });
        }

        for (let i = 0, len = category.values.length; i < len; i++) {

            let cat = <string>categorical.categories[0].values[i];

            sDataPoints.push({
                category: cat,
                xValue: xIndex === -1 ? 0 : xValues[i],
                yValue: yIndex === -1 ? 0 : yValues[i],
                measureValue: measureIndex === -1 ? 0 : measureValues[i],
                tooltips: [{
                        displayName: categoryColumnName,
                        value: cat != null ? valueFormatterForCategories.format(cat).toString() : "(BLANK)",
                        header: "Point Values"
                    },
                    {
                        displayName: xColumnName,
                        value: xIndex === -1 ? "" : valueFormatterForX.format(xValues[i]).toString()
                    },
                    {
                        displayName: yColumnName,
                        value: yIndex === -1 ? "" : valueFormatterForY.format(yValues[i]).toString()
                    },
                    {
                        displayName: valueColumnName,
                        value: measureIndex === -1 ? "" : valueFormatterForMeasure.format(measureValues[i]).toString()
                    }],
                selectionId: host.createSelectionIdBuilder().withCategory(category, i).createSelectionId()
            });

        }

        sMetaData.push({
            xAxisLabel: xColumnName,
            yAxisLabel: yColumnName,
            measureIndex: measureIndex
        });

        return {
            scatterDataPoints: sDataPoints,
            scatterMetaData: sMetaData
        };
    }

    export class Visual implements IVisual {
        private target: HTMLElement;
        private host: IVisualHost;
        private settings: VisualSettings;
        private svg: d3.Selection<SVGAElement>;
        private g: d3.Selection<SVGAElement>;
        private clip: d3.Selection<SVGAElement>;
        private hexagonGroup: d3.Selection<SVGAElement>;
        private dotGroup: d3.Selection<SVGAElement>;
        private selectionManager: ISelectionManager;

        constructor(options: VisualConstructorOptions) {
            // console.log('Visual constructor', options);
            this.target = options.element;
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();

            let svg = this.svg = d3.select(this.target).append("svg")
                .attr("class", "container");

            let g = this.g = svg.append("g");

            let clip = this.clip = g.append("clipPath")
                .attr("id", "clip")
                .append("rect")
                    .attr("class", "clip-rect");

            // let hexagonGroup = this.hexagonGroup = g.append("g")
            //    .attr("class", "hexagons")
            //    .attr("clip-path", "url(#clip)");

            // let dotGroup = this.dotGroup = g.append("g")
            //    .attr("class", "dots");

        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            // console.log('Visual update', options);

            if (options.viewport.width < 160 || options.viewport.height < 100) {
                this.hideAll();
            }
            else {
                this.showAll();
            }

            let selectionManager = this.selectionManager;
            let host = this.host;

            let optionBinColor = this.settings.dataPoint.binColor;
            let optionBinRadius = this.settings.dataPoint.binRadius;
            let optionBinOutline = this.settings.dataPoint.binOutline;
            let optionShowBins = this.settings.dataPoint.showHexbins;
            let optionShowBinLabels = this.settings.dataPoint.showHexbinLabels;
            let optionDotColor = this.settings.dataPoint.dotColor;
            let optionDotSize = this.settings.dataPoint.dotSize;
            let optionShowDots = this.settings.dataPoint.showDots;
            let optionShowXAxis = this.settings.axes.showXAxis;
            let optionShowYAxis = this.settings.axes.showYAxis;
            let optionShowXTitle = this.settings.axes.showXTitle;
            let optionShowYTitle = this.settings.axes.showYTitle;
            let optionOriginZeroZero = this.settings.axes.originZeroZero;

            let viewModel: ScatterViewModel = visualTransform(options, this.host);
            // console.log('ViewModel', viewModel);

            let margin = {
                left: optionShowYAxis ? 100 : 25,
                right: 10,
                top: 10,
                bottom: optionShowXAxis ? 50 : 15
            };
            let height = options.viewport.height - margin.top - margin.bottom;
            let width = options.viewport.width - margin.left - margin.right;
			
			let binScale = width / (parseInt(optionBinRadius));

            let data = viewModel.scatterDataPoints;
            let xRange = d3.extent(data, function(d){ return d.xValue; });
            let yRange = d3.extent(data, function(d){ return d.yValue; });
            let measureRange = d3.extent(data, function(d){ return d.measureValue; });
            // console.log("xRange: ", xRange);
            // console.log("yRange: ", yRange);
            // console.log("measureRange: ", measureRange);
            let xTicks = axisHelper.getRecommendedNumberOfTicksForXAxis(width);
            let yTicks = axisHelper.getRecommendedNumberOfTicksForYAxis(height);

            let xTickFormat = d3.format(".2s"); // .1f
            let yTickFormat = d3.format(".2s");
            if (options.viewport.width < 240) {
                xTickFormat = "...";
            }

            let xScale = d3.scale.linear()
                .domain(optionOriginZeroZero ? [0, xRange[1] + 1] : [xRange[0] - 1, xRange[1] + 1])
                .range([margin.left, width + margin.left - margin.right]);

            let xAxis = d3.svg.axis()
                .scale(xScale)
                .ticks(xTicks)
                .tickFormat(xTickFormat)
                .orient("bottom");

            let yScale = d3.scale.linear()
                .domain(optionOriginZeroZero ? [0, yRange[1] + 1] : [yRange[0] - 1, yRange[1] + 1])
                .range([height, margin.top]);

            let yAxis = d3.svg.axis()
                .scale(yScale)
                .ticks(yTicks)
                .tickFormat(yTickFormat)
                .orient("left");

            // console.log(points);

            let hexbin = d3.hexbin()
                .size([width, height])
                .radius(binScale)
                .extent([[0, 0], [width, height]]);

            // console.log(hexbin(points));

            let svg = this.svg;

            svg
                .attr("width", options.viewport.width)
                .attr("height", options.viewport.height);

            try {
                svg.select(".hexagons").remove();
                svg.select(".dots").remove();

                svg.select(".hexbinLabels").remove();
                svg.selectAll(".axis").remove();
                svg.select(".x-axis-label").remove();
                svg.select(".y-axis-label").remove();

                let g = this.g;
                let clip = this.clip;

                clip
                    .attr("width", width > 0 ? width : 0)
                    .attr("height", height > 0 ? height : 0)
                    .attr("transform", "translate(" + margin.left + ",0)");

                // let hexagonGroup = this.hexagonGroup;
                let hexagonGroup = g.append("g")
                    .attr("class", "hexagons")
                    .attr("clip-path", "url(#clip)");
                if (!optionShowBins) {
                    hexagonGroup.attr("visibility", "hidden");
                }
                else {
                    hexagonGroup.attr("visibility", "visible");
                }

                let hexagonLabels = g.append("g")
                    .attr("class", "hexbinLabels");

                // Axes - over hexagons but under dots
                if (optionShowXAxis) {
                    g.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(0, " + height + ")")
                        .call(xAxis);
                }

                if (optionShowXTitle) {
                    svg.append("text")
                        .attr("class", "x-axis-label")
                        .attr("transform", "translate(" + (width / 2 + margin.left) + " ," + (height + margin.bottom) + ")")
                        .style("text-anchor", "middle")
                        .text(viewModel.scatterMetaData[0].xAxisLabel);
                }

                if (optionShowYAxis) {
                    g.append("g")
                        .attr("class", "axis")
                        .attr("transform", "translate(" + margin.left + ", 0)")
                        .call(yAxis);
                }

                if (optionShowYTitle) {
                    svg.append("text")
                        .attr("class", "y-axis-label")
                        .attr("transform", "rotate(-90)")
                        .attr("y", 5)
                        .attr("x", 0 - (height / 2))
                        .attr("dy", "1em")
                        .style("text-anchor", "middle")
                        .text(viewModel.scatterMetaData[0].yAxisLabel);
                }

                // let dotGroup = this.dotGroup;
                let dotGroup = g.append("g")
                    .attr("class", "dots");
                if (!optionShowDots) {
                    dotGroup.attr("visibility", "hidden");
                }
                else {
                    dotGroup.attr("visibility", "visible");
                }

                // Hexagons
                if (optionShowBins) {
                    let hexagonData = hexbin(data.map(function(d){return [xScale(d.xValue), yScale(d.yValue)]; }));

                    let hexagons = hexagonGroup.selectAll(".hexagon")
                        .data(hexagonData);

                    // console.log("hexagonData: ", hexagonData);

                    let maxDotsInBin = d3.max(hexagonData.map(function(d){return d.length; }));
                    // console.log("maxDotsInBin", maxDotsInBin);

                    let colorNoMeasureScale = d3.scale.linear()
                        .domain([0, maxDotsInBin])
                        .range(["#DDDDDD", optionBinColor])
                        .interpolate(d3.interpolateLab);

                    hexagons.enter().append("path")
                        .attr("class", "hexagon")
                        .attr("d", hexbin.hexagon())
                        .attr("transform", function(d) { return "translate(" + (d as any).x + "," + (d as any).y + ")"; })
                        .style("fill", function(d) { return colorNoMeasureScale((d as any).length); })
                        .style("stroke", optionBinOutline);

                    hexagons.transition()
                        .attr("transform", function(d) { return "translate(" + (d as any).x + "," + (d as any).y + ")"; })
                        .style("fill", function(d) { return colorNoMeasureScale((d as any).length); })
                        .style("stroke", optionBinOutline)
                        .duration(1000);

                    hexagons.exit().remove();

                    if (optionShowBinLabels) {
                        hexagons.on('mouseover', function(d) {
                            let mouse = d3.mouse(svg.node());
                            let x = mouse[0];
                            let y = mouse[1];

                            host.tooltipService.show({
                                dataItems: [
                                    {displayName: "Density", value: (d as any).length.toString(), header: "Bin Stats" }
                                ],
                                identities: [],
                                coordinates: [x, y],
                                isTouchEvent: false
                            });
                        });

                        hexagons.on('mouseout', function(d) {
                            d3.select(this).attr({
                                'r': 4,
                            });

                            host.tooltipService.hide({
                                immediately: true,
                                isTouchEvent: false
                            });
                        });

                        hexagons.on("mousemove", (d) => {
                            let mouse = d3.mouse(svg.node());
                            let x = mouse[0];
                            let y = mouse[1];

                            host.tooltipService.move({
                                dataItems: [
                                    {displayName: "Density", value: (d as any).length.toString(), header: "Bin Stats"}
                                ],
                                identities: [],
                                coordinates: [x, y],
                                isTouchEvent: false
                            });
                        });
                    }
                }

                // Dots
                if (optionShowDots) {
                    let dots = dotGroup.selectAll('circle')
                        .data(data);

                    let colorMeasureScale = d3.scale.linear()
                        .domain([measureRange[0], measureRange[1]])
                        .range(["#DDDDDD", optionDotColor])
                        .interpolate(d3.interpolateLab);

                    dots.enter().append('circle')
                        .attr("cx", function(d) {return xScale(d.xValue); })
                        .attr("cy", function(d) {return yScale(d.yValue); })
                        .attr("transform", function(d) {
                            if (d.xValue == null && d.yValue == null) { return "translate(" + margin.left + "," + (height - margin.top) + ")"; }
                            else if (d.xValue == null) { return "translate(" + margin.left + ",0)"; }
                            else if (d.yValue == null) { return "translate(0," + height + ")"; }
                            else { return "translate(0,0)"; }
                        })
                        .attr('r', optionDotSize)
                        .style('fill', function(d) {return viewModel.scatterMetaData[0].measureIndex > -1 ? colorMeasureScale(d.measureValue) : optionDotColor; })
                        .style('border-radius', 1)
                        .style('stroke', '#444444');

                    dots.transition()
                        .attr("cx", function(d) {return xScale(d.xValue); })
                        .attr("cy", function(d) {return yScale(d.yValue); })
                        .attr('r', optionDotSize)
                        .style('fill', function(d) {return viewModel.scatterMetaData[0].measureIndex > -1 ? colorMeasureScale(d.measureValue) : optionDotColor; })
                        .duration(1500);

                    dots.exit().remove();

                    dots.on('click', function(d) {
                        selectionManager.select(d.selectionId).then((ids: ISelectionId[]) => {
                            dots.attr({
                                'opacity': ids.length > 0 ? 0.2 : 1,
                            });

                            d3.select(this).attr({
                                'opacity': 1,
                            });
                        });

                        (<Event>d3.event).stopPropagation();
                    });

                    dots.on('mouseover', function(d) {
                        let mouse = d3.mouse(svg.node());
                        let x = mouse[0];
                        let y = mouse[1];

                        d3.select(this).attr({
                            'r': 8,
                        });

                        host.tooltipService.show({
                            dataItems: d.tooltips,
                            identities: [d.selectionId],
                            coordinates: [x, y],
                            isTouchEvent: false
                        });
                    });

                    dots.on('mouseout', function(d) {
                        d3.select(this).attr({
                            'r': optionDotSize,
                        });

                        host.tooltipService.hide({
                            immediately: true,
                            isTouchEvent: false
                        });
                    });

                    dots.on("mousemove", (d) => {
                        let mouse = d3.mouse(svg.node());
                        let x = mouse[0];
                        let y = mouse[1];

                        host.tooltipService.move({
                            dataItems: d.tooltips,
                            identities: [d.selectionId],
                            coordinates: [x, y],
                            isTouchEvent: false
                        });
                    });
                }
            }
            catch (e) {
                console.log("Failed to render hexbin scatterplot", e);
            }

        }

        public hideAll() {
            d3.selectAll(".container").selectAll("g").attr("visibility", "hidden");
        }

        public showAll() {
            d3.selectAll(".container").selectAll("g").attr("visibility", "visible");
        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        /**
         * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
         * objects and properties you want to expose to the users in the property pane.
         *
         */
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}