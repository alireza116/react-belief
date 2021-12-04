import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import * as ss from "simple-statistics";

/* Component */
const TrendChoice = (props) => {
  const d3Container = useRef(null);
  const width = props.width || "100%";
  const height = props.height || "100%";

  useEffect(
    () => {
      if (d3Container.current) {
        let interceptSelected = false;
        let interceptCISelected = false;
        let slopeSelected = false;
        let slopeCISelected = false;
        let nLines = props.nLines || 200;
        //svg returned by this component
        const svg = d3.select(d3Container.current);
        //width of svg
        const width = svg.node().getBoundingClientRect().width;
        //height of svg
        const height = svg.node().getBoundingClientRect().height;

        const leftMarginPct = 0.1;
        const rightMarginpct = 0.1;
        const topMarginPct = 0.1;
        const bottomMarginPct = 0.1;

        const margins = {
          left: width * leftMarginPct,
          right: width * rightMarginpct,
          top: height * topMarginPct,
          bottom: height * bottomMarginPct,
        };
        const w = width - margins.left - margins.right;
        const h = height - margins.top - margins.bottom;

        const xDomain = props.xDomain || [-5.0, 5.0];
        const yDomain = props.yDomain || [-1, 1];

        console.log(w);
        console.log(h);

        const g = svg
          .append("g")
          .attr("transform", `translate(${margins.left},${margins.top})`);

        let clip = g
          .append("clipPath")
          .attr("id", "clipRect")
          .append("rect")
          .attr("fill", "rgba(0,0,0,0)")
          .attr("width", w)
          .attr("height", h);

        const xScale = d3.scaleLinear().range([0, w]).domain(xDomain);
        const yScale = d3.scaleLinear().range([h, 0]).domain(yDomain);

        // let tickLabels = props.tickLabels || ["A", "", "C"];

        let xAxis = g
          .append("g")
          .attr("transform", `translate(${0},${h / 2})`)
          .attr("class", "xAxis")
          .call(
            d3.axisBottom(xScale)
            // .tickValues([-1, 1])
          )
          .attr("pointer-events", "none")
          .style("font-size", "12px");

        let yAxis = g
          .append("g")
          .attr("transform", `translate(${w / 2},${0})`)
          .call(
            d3.axisLeft(yScale)
            // .tickValues([-1, 1])
          )
          .attr("pointer-events", "none")
          .style("font-size", "12px");

        let CILines = [];
        for (var i = 0; i < nLines; i++) {
          CILines.push(0);
        }

        let band = g
          .selectAll(".uncertaintyLines")
          .data(CILines)
          .enter()
          .append("line")
          .attr("class", "uncertaintyLines")
          .attr("pointer-events", "none")
          .attr("stroke-opacity", 0.05)
          .attr("stroke-width", 6)
          .attr("clip-path", "url(#clipRect)")
          .attr("stroke", "#484848");

        let line = g
          .append("line")
          .attr("stroke-width", 6)
          .attr("stroke", "orange")
          .attr("clip-path", "url(#clipRect)")
          .style("pointer-events", "none");

        //slope
        let m = 0;
        //intercept
        let b = 0;

        let bCI;
        let sampleBs = [b];
        let mCI;
        let sampleMs = [m];

        let [x1, x2, y1, y2] = getLineCoords(m, b);

        line
          .attr("x1", xScale(x1))
          .attr("x2", xScale(x2))
          .attr("y1", yScale(y1))
          .attr("y2", yScale(y2))
          .style("pointer-events", "none");

        let rect = g
          .append("rect")
          .attr("fill", "rgba(0,0,0,0)")
          .attr("width", w)
          .attr("height", h);

        rect
          .on("mousemove", function () {
            let coords = d3.mouse(this);
            let mouseY = coords[1];
            let mouseX = coords[0];
            if (!interceptSelected) {
              b = yScale.invert(mouseY);
              let [x1, x2, y1, y2] = getLineCoords(m, b);

              line
                .attr("y1", yScale(y1))
                .attr("y2", yScale(y2))
                .style("pointer-events", "none");
            } else if (!interceptCISelected) {
              let b2 = yScale.invert(mouseY);
              let bDif = Math.abs(b2 - b);
              bCI = [b - bDif, b + bDif];
              let bCIMu = bDif / 2;
              let bNormalDist = d3.randomNormal(b, bCIMu);
              sampleBs = [];
              for (let i = 0; i < nLines; i++) {
                let sampleB = bNormalDist();
                sampleBs.push(sampleB);
              }
              //   console.log(sampleBs);
              let CILines = sampleBs.map((sampleB) => {
                return getLineCoords(m, sampleB);
              });

              band
                .data(CILines)
                .attr("stroke-width", 6)
                .attr("x1", function (d) {
                  return xScale(d[0]);
                })
                .attr("x2", function (d) {
                  return xScale(d[1]);
                })
                .attr("y1", function (d) {
                  return yScale(d[2]);
                })
                .attr("y2", function (d) {
                  return yScale(d[3]);
                });
            } else if (!slopeSelected) {
              let b2 = yScale.invert(mouseY);
              let yDif = b2 - b;
              let xDif = xScale.invert(mouseX);
              m = yDif / xDif;
              let [x1, x2, y1, y2] = getLineCoords(m, b);

              line
                .attr("y1", yScale(y1))
                .attr("y2", yScale(y2))
                .style("pointer-events", "none");

              let CILines = sampleBs.map((sampleB) => {
                return getLineCoords(m, sampleB);
              });

              band
                .data(CILines)
                .attr("x1", function (d) {
                  return xScale(d[0]);
                })
                .attr("x2", function (d) {
                  return xScale(d[1]);
                })
                .attr("y1", function (d) {
                  return yScale(d[2]);
                })
                .attr("y2", function (d) {
                  return yScale(d[3]);
                });
            } else if (!slopeCISelected) {
              let b2 = yScale.invert(mouseY);
              let yDif = b2 - b;
              let xDif = xScale.invert(mouseX);
              let m1 = yDif / xDif;
              let angle1 = Math.atan(m1);
              let angleCenter = Math.atan(m);
              let angleDif = angleCenter - angle1;
              let m2 = Math.tan(angleDif);
              mCI = [m1, m2].sort();
              let mNormalDist = d3.randomNormal(m, (m1 - m) / 2);
              CILines = [];
              sampleMs = [];
              console.log(mCI);
              for (let i = 0; i < nLines; i++) {
                let sampleM = mNormalDist();
                sampleMs.push(sampleM);
                CILines.push(getLineCoords(sampleMs[i], sampleBs[i]));
              }
              band
                .data(CILines)
                .attr("x1", function (d) {
                  return xScale(d[0]);
                })
                .attr("x2", function (d) {
                  return xScale(d[1]);
                })
                .attr("y1", function (d) {
                  return yScale(d[2]);
                })
                .attr("y2", function (d) {
                  return yScale(d[3]);
                });
            }
          })
          .on("click", function () {
            if (!interceptSelected) {
              interceptSelected = true;
            } else if (!interceptCISelected) {
              interceptCISelected = true;
            } else if (!slopeSelected) {
              slopeSelected = true;
            } else {
              slopeCISelected = true;
            }
          });

        console.log(y1);
        console.log(y2);

        function getLineCoords(m, b) {
          let lineFunction = ss.linearRegressionLine({ m: m, b: b });
          let x1 = xDomain[0];
          let x2 = xDomain[1];
          let y1 = lineFunction(x1);
          let y2 = lineFunction(x2);
          return [x1, x2, y1, y2];
        }

        const reset = g
          .append("rect")
          .attr("width", "60px")
          .attr("height", "40px")
          .attr("transform", `translate(0,${h})`)
          .attr("fill", "grey");

        g.append("text")
          .attr("text-anchor", "center")
          .attr("font-size", "1em")
          .attr("transform", `translate(10,${h + margins.bottom / 2})`)
          .attr("pointer-events", "none")
          .text("Reset");

        reset
          .on("mouseenter", function () {
            reset.style("fill", "orange");
          })
          .on("mouseout", function () {
            reset.style("fill", "gray");
          })
          .on("click", () => {
            slopeSelected = false;
            slopeCISelected = false;
            interceptSelected = false;
            interceptCISelected = false;
            m = 0;
            //intercept
            b = 0;
            let [x1, x2, y1, y2] = getLineCoords(m, b);
            console.log([x1, x2, y1, y2]);

            line
              .attr("x1", xScale(x1))
              .attr("x2", xScale(x2))
              .attr("y1", yScale(y1))
              .attr("y2", yScale(y2))
              .style("pointer-events", "none");

            band.attr("stroke-width", 0);
            if (props.handleResponse)
              props.handleResponse(null, props.responseIndex);
          });
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
      className="choiceContainer"
      style={{
        width: width,
        height: height,
        margin: "0 auto",
        marginBottom: "10px",
      }}
    >
      <svg
        className="choiceComponent"
        style={{ cursor: "pointer" }}
        width={"100%"}
        height={"100%"}
        ref={d3Container}
      />
    </div>
  );
};

/* App */
export default TrendChoice;
