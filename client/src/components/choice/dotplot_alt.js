import React, { useRef, useEffect } from "react";
// import { jStat } from "jstat";
import * as d3 from "d3";

/* Component */
const Dotplot = (props) => {
  const d3Container = useRef(null);
  const width = props.width || "100%";
  const height = props.height || "100%";

  // const numBins = props.numBins || 10;

  useEffect(
    () => {
      if (d3Container.current) {
        //svg returned by this component
        let data = [];
        const svg = d3.select(d3Container.current);
        //width of svg
        const width = svg.node().getBoundingClientRect().width;
        //height of svg
        const height = svg.node().getBoundingClientRect().height;
        const extent = props.extent || [0, 1];
        const nBins = props.nBins || 20;
        const leftMarginPct = 0.1;
        const rightMarginPct = 0.15;
        const topMarginPct = 0.2;
        const bottomMarginPct = 0.15;
        const maxCircles = props.maxCircles || 20;
        const binWidth = (extent[1] - extent[0]) / nBins;

        const margins = {
          left: width * leftMarginPct,
          right: width * rightMarginPct,
          top: height * topMarginPct,
          bottom: height * bottomMarginPct,
        };
        const w = width - margins.left - margins.right;
        const h = height - margins.top - margins.bottom;

        const circleRadius = (0.5 * h) / maxCircles;
        // const circleRadius = (binWidth * h) / 1.5;
        // const data = [];

        // console.log(props.data);

        if (props.title) {
          svg
            .append("text")
            .attr("x", margins.left)
            .attr("y", margins.top)
            .attr("fill", "teal")
            .attr("class", "charttitle")
            .text(`${props.title}`);
        }

        const dotplotContainer = svg
          .append("g")
          .attr("id", "dotplot-container")
          .attr(
            "transform",
            "translate(" + margins.left + "," + margins.top + ")"
          );

        let xScale = d3.scaleLinear().domain(extent).rangeRound([0, w]).nice();
        let yScale = d3.scaleBand().domain(d3.range(maxCircles)).range([h, 0]);
        // let circleScale = d3.scaleQuantize().domain(extent).range(nbins);
        // d3.range

        // console.log(circleScale(0.43));
        // console.log(circleScale(0.48));

        dotplotContainer
          .append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + h + ")")
          .call(d3.axisBottom(xScale).ticks(nBins));

        const focusRect = dotplotContainer
          .append("rect")
          .attr("width", w)
          .attr("height", h)
          .attr("fill-opacity", 0)
          .attr("stroke", "gray")
          .attr("stroke-opacity", 0.2);
        // .on("click", () => {
        //   bins = d3.range(nBins).map((d, i) => {
        //     return {
        //       idx: i,
        //       bin: [d * binWidth, (d + 1) * binWidth],
        //       countCircles: 0,
        //     };
        //   });
        //   update(bins);
        // })
        // .on("mouseover", () => {
        //   // console.log("rect");
        //   update(bins);
        // })
        // .on("mouseout", () => {
        //   // console.log("rect");
        //   // console.log(bins);
        //   update(bins);
        // });

        // initializing guides guides;
        let bins = d3.range(nBins).map((d, i) => {
          return {
            idx: i,
            bin: [d * binWidth, (d + 1) * binWidth],
            countCircles: 0,
            temp: false,
          };
        });

        let tempBins = d3.range(nBins).map((d, i) => {
          return {
            idx: i,
            bin: [d * binWidth, (d + 1) * binWidth],
            countCircles: 0,
            temp: true,
          };
        });

        const guideBinGs = dotplotContainer
          .append("g")
          .selectAll(".gBin")
          .data(bins)
          .join("g")
          .attr("transform", (d) => {
            //   console.log(d);
            return `translate(${xScale((d.bin[0] + d.bin[1]) / 2)}, ${h})`;
          })
          .on("mouseout", function (d) {
            // tempBins = bins;
            update(bins);
          });

        const binGs = dotplotContainer
          .append("g")
          .selectAll(".gBin")
          .data(bins)
          .join("g")
          .attr("transform", (d) => {
            //   console.log(d);
            return `translate(${xScale((d.bin[0] + d.bin[1]) / 2)}, ${h})`;
          })
          .style("pointer-events", "none");

        // const dots = binGs
        //   .selectAll("circle")
        //   .data(function (d) {
        //     return d3.range(d.countCircles);
        //   })
        //   .join("circle")
        //   .attr("fill", "orange")
        //   .attr("fill-opacity", 1)
        //   .attr("r", circleRadius)
        //   .attr("cy", (d) => {
        //     // return d * circleRadius + circleRadius;
        //     // console.log(yScale(d));
        //     return -d * 2 * circleRadius - circleRadius;
        //   });

        const dotGuides = guideBinGs
          .selectAll("circle")
          .data(function (d) {
            return d3.range(maxCircles - d.countCircles);
          })
          .join("circle")
          .attr("fill-opacity", 0.3)
          .attr("fill", "white")
          .attr("stroke", "grey")
          .attr("stroke-opacity", 0.5)
          .attr("r", circleRadius)
          .attr("cy", (d) => {
            // return d * circleRadius + circleRadius;
            // console.log(yScale(d));
            return -d * 2 * circleRadius - circleRadius;
          })
          .on("mouseenter", mouseover)
          .on("mouseout", mouseout)
          .on("click", click);

        // const focusRect = dotplotContainer
        //   .append("rect")
        //   .attr("width", w)
        //   .attr("height", h)
        //   .attr("fill-opacity", 0)
        //   .attr("stroke", "gray")
        //   .attr("stroke-opacity", 0.2)
        //   .on("click", click)
        //   .on("mousemove", mousemove)
        //   .on("mouseout", () => {});

        update(bins);

        function update(data) {
          // console.log(data);
          // console.log(tempBins);
          binGs.data(data);

          let dotsUpdate = binGs
            .selectAll("circle")
            .data(function (d) {
              //   console.log(d);
              return d3.range(d.countCircles);
            })
            .attr("fill", function (d, i) {
              let parentData = this.parentNode.__data__;
              // console.log(parentData.temp);
              // console.log(parentData);
              // if (parentData.temp) {
              //   return "orange";
              // } else {
              //   return "grey";
              // }
              if (i > bins[parentData.idx].countCircles - 1) {
                return "orange";
              } else {
                return "grey";
              }
            });

          let dotsEnter = dotsUpdate
            .enter()
            .append("circle")
            .attr("fill", function (d, i) {
              let parentData = this.parentNode.__data__;
              if (i > bins[parentData.idx].countCircles - 1) {
                return "orange";
              } else {
                return "lightgrey";
              }
              // if (parentData.temp) {
              //   return "orange";
              // } else {
              //   return "grey";
              // }
            })
            .attr("fill-opacity", 1)
            .attr("r", circleRadius)
            .attr("cy", (d) => {
              // return d * circleRadius + circleRadius;
              // console.log(yScale(d));
              return -d * 2 * circleRadius - circleRadius;
            })
            .style("pointer-events", "none");

          dotsUpdate.exit().remove();

          dotsEnter.merge(dotsUpdate);

          // dotGuides
          guideBinGs.data(data);

          let sumCircles = data.reduce((pv, cv) => {
            return pv + cv.countCircles;
          }, 0);

          let guideUpdate = guideBinGs
            .selectAll("circle")
            .data(function (d) {
              let circleIdxs = d3.range(
                maxCircles - sumCircles + d.countCircles
              );
              return circleIdxs;
            })
            .attr("fill", function (d, i) {
              let parentData = this.parentNode.__data__;
              console.log(parentData);
              if (i > bins[parentData.idx].countCircles - 1) {
                return "white";
              } else {
                return "grey";
              }
              // return "white";
            });

          let guideEnter = guideUpdate
            .enter()
            .append("circle")
            // .attr("fill-opacity", 0)
            .attr("fill-opacity", 0.3)
            .attr("fill", "white")
            .attr("stroke", "grey")
            .attr("stroke-opacity", 0.5)
            .attr("r", circleRadius)
            .attr("cy", (d) => {
              // return d * circleRadius + circleRadius;
              // console.log(yScale(d));
              return -d * 2 * circleRadius - circleRadius;
            })
            .on("mouseenter", mouseover)
            .on("mouseout", mouseout)
            .on("click", click);

          guideUpdate.exit().remove();

          guideEnter.merge(guideUpdate);
        }

        function mouseover(d) {
          let currentIndex = d;
          let parentData = this.parentNode.__data__;
          // tempBins = JSON.parse(JSON.stringify(bins));
          tempBins[parentData.idx].countCircles = currentIndex + 1;
          tempBins[parentData.idx].temp = true;
          // console.log(binsCopy);
          update(tempBins);
          //   line.attr("x1", coords[0]).attr("x2", coords[0]);
        }

        function mouseout(d) {
          console.log("out");
          let currentIndex = d;
          let parentData = this.parentNode.__data__;
          // let binsCopy = JSON.parse(JSON.stringify(bins));
          let oldNumber = bins[parentData.idx].countCircles;
          tempBins[parentData.idx].countCircles = oldNumber;
          tempBins[parentData.idx].temp = false;
          // console.log(binsCopy);
          update(tempBins);
        }

        function click(d) {
          let currentIndex = d;
          let parentData = this.parentNode.__data__;
          if (
            bins[parentData.idx].countCircles ===
            tempBins[parentData.idx].countCircles
          ) {
            bins[parentData.idx].countCircles = 0;
          } else {
            // bins[parentData.idx].countCircles = 0;
            bins[parentData.idx].countCircles = currentIndex + 1;
          }

          bins[parentData.idx].temp = false;
          update(bins);
          //   console.log(x);
        }
      }
    },

    /*
            useEffect has a dependency array (below). It's a list of dependency
            variables for this useEffect block. The block will run after mount
            and whenever any of these variables change. We still have to check
            if the variables are valid, but we do not have to compare old props
            to next props to decide whether to rerender.
        */
    []
  );

  return (
    <div
      className="histContainer"
      style={{
        width: width,
        height: height,
        margin: "0 auto",
        marginBottom: "10px",
      }}
    >
      <svg
        className="histComponent"
        style={{ cursor: "pointer" }}
        width={"100%"}
        height={"100%"}
        ref={d3Container}
      />
    </div>
  );
};

/* App */
export default Dotplot;
