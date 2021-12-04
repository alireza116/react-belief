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
        const nbins = props.nBins || 20;
        const leftMarginPct = 0.1;
        const rightMarginPct = 0.15;
        const topMarginPct = 0.2;
        const bottomMarginPct = 0.15;

        const margins = {
          left: width * leftMarginPct,
          right: width * rightMarginPct,
          top: height * topMarginPct,
          bottom: height * bottomMarginPct,
        };
        const w = width - margins.left - margins.right;
        const h = height - margins.top - margins.bottom;
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

        dotplotContainer
          .append("g")
          .attr("class", "axis axis--x")
          .attr("transform", "translate(0," + h + ")")
          .call(d3.axisBottom(xScale).ticks(nbins));

        const histogram = d3
          .histogram()
          .domain(xScale.domain())
          .thresholds(xScale.ticks(nbins))
          .value(function (d) {
            return d.value;
          });

        const focusRect = dotplotContainer
          .append("rect")
          .attr("width", w)
          .attr("height", h)
          .attr("fill-opacity", 0)
          .attr("stroke", "gray")
          .attr("stroke-opacity", 0.2)
          .on("click", click)
          .on("mousemove", mousemove)
          .on("mouseout", () => {});

        update(data);

        function update(data) {
          const bins = histogram(data).filter((d) => d.length > 0);

          let binContainer = dotplotContainer.selectAll(".gBin").data(bins);

          let binContainerEnter = binContainer
            .enter()
            .append("g")
            .attr("class", "gBin")
            .attr("transform", (d) => {
              //   console.log(d);
              return `translate(${xScale(d.x0)}, ${h})`;
            });

          // //need to populate the bin containers with data the first time
          // binContainerEnter
          //   .selectAll("circle")
          //   .data((d) => {
          //     return d.map((p, i) => {
          //       return {
          //         idx: i,
          //         color: p.perm ? "gray" : "orange",
          //         value: p.value,
          //         radius: (xScale(d.x1) - xScale(d.x0)) / 2,
          //       };
          //     });
          //   })
          //   .enter()
          //   .append("circle")
          //   .attr("cx", function (d) {
          //     return d.radius;
          //   }) //g element already at correct x pos
          //   .attr("cy", function (d) {
          //     return -d.idx * 2 * d.radius - d.radius;
          //   })
          //   .attr("r", function (d) {
          //     return d.radius;
          //   });

          binContainerEnter
            .merge(binContainer)
            .attr("transform", (d) => `translate(${xScale(d.x0)}, ${h})`);

          binContainer.exit().remove();

          let dotsUpdate = binContainer
            .selectAll("circle")
            .data((d) =>
              d.map((p, i) => {
                return {
                  idx: i,
                  color: p.perm ? "gray" : "orange",
                  value: p.value,
                  radius: (xScale(d.x1) - xScale(d.x0)) / 2,
                };
              })
            )
            .attr("fill", (d) => {
              return d.color;
            });

          //EXIT old elements not present in data

          const dotsEnter = dotsUpdate
            .enter()
            .append("circle")
            .attr("cx", function (d) {
              return d.radius;
            }) //g element already at correct x pos
            .attr("cy", function (d) {
              return -d.idx * 2 * d.radius - d.radius;
            })
            .attr("fill", (d) => {
              return d.color;
            })
            .style("pointer-events", "none");

          const dotsExit = dotsUpdate.exit().remove();

          dotsEnter.merge(dotsUpdate).attr("r", function (d) {
            return d.radius;
          });
        }

        function mousemove() {
          let coords = d3.mouse(this);
          let x = xScale.invert(coords[0]);
          let tempData = [...data, { perm: false, value: x }];
          update(tempData);
          //   line.attr("x1", coords[0]).attr("x2", coords[0]);
        }

        function click() {
          let coords = d3.mouse(this);
          let x = xScale.invert(coords[0]);

          data.push({ perm: true, value: x });

          update(data);
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
