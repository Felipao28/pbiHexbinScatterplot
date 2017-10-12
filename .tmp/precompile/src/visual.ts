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
    import tooltip = powerbi.extensibility.utils.tooltip;
    import TooltipEnabledDataPoint = powerbi.extensibility.utils.tooltip.TooltipEnabledDataPoint;
    import TooltipEventArgs = powerbi.extensibility.utils.tooltip.TooltipEventArgs;
    import axisHelper = powerbi.extensibility.utils.chart.axis;

    interface ScatterDataPoint {
		category: string;
		xValue: number;
		yValue: number;
        measureValue: number;
		tooltips: VisualTooltipDataItem[];
		selectionId: powerbi.visuals.ISelectionId;
    };

    interface ScatterViewModel {
		scatterDataPoints: ScatterDataPoint[];
    }

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost): any {
        let dataViews = options.dataViews;
		//console.log('visualTransform', dataViews);
		
		let viewModel: ScatterViewModel = {
            scatterDataPoints: []
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

        console.log(categoryIndex, xIndex, yIndex, measureIndex);

        let metadata = dataViews[0].metadata;
        let categoryColumnName = metadata.columns.filter(c => c.roles["category"])[0].displayName;
        let xColumnName = xIndex == -1 ? "" : metadata.columns.filter(c => c.roles["xAxis"])[0].displayName;
        let yColumnName = yIndex == -1 ? "" : metadata.columns.filter(c => c.roles["yAxis"])[0].displayName;
        let valueColumnName = measureIndex == -1 ? "" : metadata.columns.filter(c => c.roles["measure"])[0].displayName;

        console.log(categoryColumnName, xColumnName, yColumnName, valueColumnName);

        let sDataPoints: ScatterDataPoint[] = [];

        for (let i = 0, len = category.values.length; i < len; i++) {
            
            let cat = <string>categorical.categories[0].values[i];

            //validate x
            let xCheck = 1;
            xIndex == -1 ? xCheck = null : xCheck = parseFloat(categorical.values[xIndex].values[i].toString());

            //validate y
            let yCheck = 1;
            yIndex == -1 ? yCheck = null : yCheck = parseFloat(categorical.values[yIndex].values[i].toString());

            //validate measure
            let measureCheck = 1;
            measureIndex == -1 ? measureCheck = null : measureCheck = parseFloat(categorical.values[measureIndex].values[i].toString());
            
            console.log(categorical.categories[categoryIndex]);

			sDataPoints.push({
				category: cat,
                xValue: xCheck,
                yValue: yCheck,
                measureValue: measureCheck,
                tooltips: [{
                        displayName: categoryColumnName,
                        value: cat != null ? cat.toString() : "(BLANK)"//,
                        //header: sequenceDisplay
                    },
                    {
                        displayName: xColumnName,
                        value: xCheck != null ? xCheck.toString() : ""
                    },
                    {
                        displayName: yColumnName,
                        value: yCheck != null ? yCheck.toString() : ""
                    },
                    {
                        displayName: valueColumnName,
                        value: measureCheck != null ? measureCheck.toString() : ""
                    }],
                selectionId: host.createSelectionIdBuilder().withCategory(category, i).createSelectionId()
			});
				
        }

        return {
            scatterDataPoints: sDataPoints
        };
    }

    export class Visual implements IVisual {
        private target: HTMLElement;
        private host: IVisualHost;
        private settings: VisualSettings;
        private svg: d3.Selection<SVGAElement>;
        private selectionManager: ISelectionManager;

        constructor(options: VisualConstructorOptions) {
            console.log('Visual constructor', options);
            this.target = options.element;
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            
            let svg = this.svg = d3.select(this.target).append("svg")
                .attr("class", "container");

        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
            console.log('Visual update', options);

            if(options.viewport.width < 160){
                this.hideAll();
            }
            else{
                this.showAll();
            }


            let selectionManager = this.selectionManager;
            let host = this.host;

            let optionBinColor = this.settings.dataPoint.binColor;
            let optionShowBins = this.settings.dataPoint.showHexbins;
            let optionShowBinLabels = this.settings.dataPoint.showHexbinLabels;
            let optionDotColor = this.settings.dataPoint.dotColor;
            let optionShowDots = this.settings.dataPoint.showDots;
            let optionShowXAxis = this.settings.axes.showXAxis;
            let optionShowYAxis = this.settings.axes.showYAxis;

            let viewModel: ScatterViewModel = visualTransform(options, this.host);
            console.log('ViewModel', viewModel);
            
            let margin = {left: 100, right: 10, top: 10, bottom: 50};
            let height = options.viewport.height - margin.top - margin.bottom;
            let width = options.viewport.width - margin.left - margin.right;

            let data = viewModel.scatterDataPoints;
            let xRange = d3.extent(data, function(d){ return d.xValue; });
            let yRange = d3.extent(data, function(d){ return d.yValue; });
            let measureRange = d3.extent(data, function(d){ return d.measureValue; });
            //console.log("xRange: ", xRange);
            //console.log("yRange: ", yRange);
            console.log("measureRange: ", measureRange);
            
            let xScale = d3.scale.linear()
                .domain([0, xRange[1]])
                .range([margin.left, width + margin.left - margin.right]);

            let xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom");
            
            let yScale = d3.scale.linear()
                .domain([0, yRange[1]])
                .range([height, margin.top]);

            let yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left");
            
            //console.log(points);

            let hexbin = d3.hexbin()
                .size([width, height])
                .radius(30);

            //console.log(hexbin(points));

            let svg = this.svg;

            svg.selectAll(".axis").remove();

            svg
                .attr("width", options.viewport.width)
                .attr("height", options.viewport.height);

            svg.select(".hexagons").remove();
            svg.select(".hexbinLabels").remove();
            svg.select(".dots").remove();

            let hexagonGroup = svg.append("g")
                .attr("class", "hexagons");

            let hexagonLabels = svg.append("g")
                .attr("class", "hexbinLabels");

            //Axes - over hexagons but under dots
            if(optionShowXAxis){
                svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + (height - margin.top) + ")")
                    .call(xAxis);
            }

            if(optionShowYAxis){
                svg.append("g")
                    .attr("class", "axis")
                    .attr("transform", "translate(" + margin.left + ", 0)")
                    .call(yAxis);
            }
            
            let dotGroup = svg.append("g")
                .attr("class", "dots")

            //Hexagons
            if(optionShowBins){
                let hexagonData = hexbin(data.map(function(d){return [xScale(d.xValue), yScale(d.yValue)]}));

                let hexagons = hexagonGroup.selectAll(".hexagon")
                    .data(hexagonData);

                console.log("hexagonData: ", hexagonData);

                let maxDotsInBin = d3.max(hexagonData.map(function(d){return d.length;}));
                console.log("maxDotsInBin", maxDotsInBin);

                let colorNoMeasureScale = d3.scale.linear()
                    .domain([0, maxDotsInBin])
                    .range(["#DDDDDD", optionBinColor])
                    .interpolate(d3.interpolateLab);

                hexagons.enter().append("path")
                    .attr("class", "hexagon")
                    .attr("d", hexbin.hexagon())
                    .attr("transform", function(d) { return "translate(" + (d as any).x + "," + (d as any).y + ")"; })
                    .style("fill", function(d) { return colorNoMeasureScale((d as any).length); });

                hexagons.transition()
                    .attr("transform", function(d) { return "translate(" + (d as any).x + "," + (d as any).y + ")"; })
                    .style("fill", function(d) { return colorNoMeasureScale((d as any).length); })
                    .duration(1000);
                
                hexagons.exit().remove();
            }

            //Dots
            if(optionShowDots){
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
                        if(d.xValue == null && d.yValue == null){return "translate(" + margin.left + "," + (height - margin.top) + ")";}
                        else if(d.xValue == null){return "translate(" + margin.left + ",0)";}
                        else if(d.yValue == null){return "translate(0," + (height - margin.top) + ")";}
                        else{return "translate(0,0)";}
                    })
                    .attr('r', 4)
                    .style('fill', function(d) {return d.measureValue != null ? colorMeasureScale(d.measureValue) : optionDotColor; })
                    .style('border-radius', 1)
                    .style('stroke', '#444444');
                
                dots.transition()
                    .attr("cx", function(d) {return xScale(d.xValue); })
                    .attr("cy", function(d) {return yScale(d.yValue); })
                    //.attr("transform", "translate(" + margin.right + ",0)")
                    .attr('r', 4)
                    .style('fill', function(d) {return d.measureValue != null ? colorMeasureScale(d.measureValue) : optionDotColor; })
                    .duration(2000);

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
                        'r': 4,
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
                })
            }

            //Hexagon labels
            if(optionShowBinLabels){
                let hexbinLabels = hexagonLabels.selectAll(".hexbinLabels")
                    .data(hexbin(data.map(function(d){return [xScale(d.xValue), yScale(d.yValue)]})));

                hexbinLabels.enter().append("text")
                    .attr("class", "hexbinLabels")
                    .attr("x", function(d) { return (d as any).x - 4*(d as any).length.toString().length; })
                    .attr("y", function(d) { return (d as any).y; })
                    .text(function(d) { return (d as any).length; });

                hexbinLabels.transition()
                    .attr("x", function(d) { return (d as any).x - 4*(d as any).length.toString().length; })
                    .attr("y", function(d) { return (d as any).y; })
                    .text(function(d) { return (d as any).length; })
                    .duration(2000);

                hexbinLabels.exit().remove();
            }
        
        }

        public hideAll(){
            d3.selectAll(".container").selectAll("g").attr("visibility", "hidden");
        }

        public showAll(){
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