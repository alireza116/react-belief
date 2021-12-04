import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import * as ss from "simple-statistics";

/* Component */
const TrendChoice = (props) => {
  const d3Container = useRef(null);
  const width = props.width || "100%";
  const height = props.height || "100%";
  console.log(props);

  useEffect(
    () => {
      if (d3Container.current) {
        const svg = d3.select(d3Container.current);
        //width of svg
        const width = svg.node().getBoundingClientRect().width;
        //height of svg
        const height = svg.node().getBoundingClientRect().height;

        const leftMarginPct = 0.1;
        const rightMarginpct = 0.1;
        const topMarginPct = 0.1;
        const bottomMarginPct = 0.2;

        const margins = {
          left: width * leftMarginPct,
          right: width * rightMarginpct,
          top: height * topMarginPct,
          bottom: height * bottomMarginPct,
        };
        const w = width - margins.left - margins.right;
        const h = height - margins.top - margins.bottom;

        const yType = props.yTpe || d3.scaleLinear;

        const maintainMaxSum = props.maintainMaxCount;
        const showGuidelines = props.showGuidelines;

        const title = props.title || "";
        const yLabel = props.yLabel || "";
        const color = props.color || "grey";

        const categories = props.categories || ["A", "B", "C", "D", "E"];

        const xDomain = categories;
        const maxYValue = props.maxValue || 100;
        const minYValue = props.minValue || 0;

        // const dataInitializer =
        //   props.dataInitializer || maxYValue / categories.length;
        const dataInitializer = props.dataInitializer || 0;
        const data = categories.map((c, i) => [c, dataInitializer, i]);

        const xPadding = props.xPadding || 0.35;
        const xRange = [0, w];

        const yDomain = [minYValue, maxYValue];
        const yRange = [h, 0];

        const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding);
        const yScale = yType(yDomain, yRange);
        const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
        const yAxis = d3.axisLeft(yScale).ticks(height / 40);

        let focusing = true;

        svg.on("click", () => {
          focusing = !focusing;
        });

        const g = svg
          .append("g")
          .attr("transform", `translate(${margins.left},${margins.top})`);

        g.append("g")
          .call(yAxis)
          .call((g) => g.select(".domain").remove())
          .call((g) =>
            g
              .selectAll(".tick line")
              .clone()
              .attr("x2", w)
              .attr("stroke-opacity", 0.1)
          )
          .call((g) =>
            g
              .append("text")
              .attr("x", -margins.left)
              .attr("y", 10)
              .attr("fill", "currentColor")
              .attr("text-anchor", "start")
              .text(yLabel)
          );

        g.append("g").attr("transform", `translate(0,${h})`).call(xAxis);

        // guide
        let guideData = calculateGuideData();

        const guide = g
          .append("g")
          .attr("fill", "lightgrey")
          .attr("fill-opacity", function (d) {
            if (showGuidelines) {
              return 0.5;
            } else {
              return 0;
            }
          })
          .selectAll("rect")
          .data(guideData)
          .join("rect")
          .attr("x", (d) => xScale(d[0]))
          .attr("y", (d) => yScale(d[1]))
          .attr("height", (d) => yScale(0) - yScale(d[1]))
          .attr("width", xScale.bandwidth());

        //bar
        const bar = g
          .append("g")
          .attr("fill", color)

          .selectAll("rect")
          .data(data)
          .join("rect")
          .attr("x", (d) => xScale(d[0]))
          .attr("y", (d) => yScale(d[1]))
          .attr("height", (d) => yScale(0) - yScale(d[1]))
          .attr("width", xScale.bandwidth());

        //focus

        const focusRect = g
          .append("rect")
          .attr("width", w)
          .attr("height", h)
          .style("fill-opacity", 0)
          .on("mousemove", mousemove)
          .on("mouseout", () => {
            focus.style("fill-opacity", 0);
            bar.attr("fill", "grey");
          });

        const focus = g
          .append("g")
          .append("rect")
          .attr("fill", "orange")
          .attr("fill-opacity", 0)
          .attr("height", h)
          .attr("width", xScale.bandwidth())
          .style("pointer-events", "none");

        // reset button
        const reset = g
          .append("g")
          .attr("transform", `translate(0,${h + margins.bottom / 2})`);
        reset
          .append("rect")
          .attr("width", "60px")
          .attr("height", "40px")

          .attr("fill", "grey");

        reset
          .append("text")
          .attr("text-anchor", "center")
          .attr("font-size", "1em")
          .attr("transform", `translate(10,25)`)
          .attr("pointer-events", "none")
          .text("Reset");

        reset
          .on("mouseenter", function () {
            reset.select("rect").style("fill", "orange");
          })
          .on("mouseout", function () {
            reset.select("rect").style("fill", "gray");
          })
          .on("click", () => {
            if (props.handleResponse)
              props.handleResponse(null, props.responseIndex);
          });

        let focusCat;
        let focusIndex;

        function mousemove() {
          let m = d3.mouse(this);

          if (focusing) {
            var lowDiff = 1e99,
              xI = null;
            for (var i = 0; i < categories.length; i++) {
              var diff = Math.abs(
                m[0] - xScale(categories[i]) - xScale.bandwidth() / 2
              );

              if (diff < lowDiff) {
                lowDiff = diff;
                xI = i;
              }
            }

            focusCat = categories[xI];
            focusIndex = xI;

            focus
              .attr(
                "transform",
                "translate(" + xScale(categories[xI]) + "," + 0 + ")"
              )
              .style("fill-opacity", 0.5);
          } else {
            focus.style("fill-opacity", 0);
            let guideData = calculateGuideData();
            let choice = yScale.invert(m[1]);
            if (maintainMaxSum) {
              choice =
                choice <= guideData[focusIndex][1]
                  ? choice
                  : guideData[focusIndex][1];

              guide
                .data(guideData)
                .attr("x", (d) => xScale(d[0]))
                .attr("y", (d) => yScale(d[1]))
                .attr("height", (d) => yScale(0) - yScale(d[1]))
                .attr("width", xScale.bandwidth());
            }

            data[focusIndex][1] = choice;

            if (maintainMaxSum) {
              let sum = data.reduce((pv, cv) => {
                return pv + cv[1];
              }, 0);
              if (sum > maxYValue) {
                let otherValues = data.filter((d, i) => i !== focusIndex);
                let otherValuesSum = otherValues.reduce((pv, cv) => {
                  return pv + cv[1];
                }, 0);
                let proportions = otherValues.map((d) => {
                  return [d[0], d[1] / otherValuesSum, d[2]];
                });

                let remainder = maxYValue - data[focusIndex][1];

                let newOtherValues = proportions.map((d) => {
                  return [d[0], d[1] * remainder, d[2]];
                });

                newOtherValues.forEach((d) => {
                  data[d[2]][1] = d[1];
                });

                console.log(proportions);
                console.log(otherValues);
              }
              //   console.log(sum);
            }
            bar
              .data(data)
              .attr("fill", (d, i) => {
                if (i === focusIndex) {
                  return "orange";
                } else {
                  return "grey";
                }
              })
              .attr("y", (d) => yScale(d[1]))
              .attr("height", (d) => yScale(0) - yScale(d[1]));
          }
        }

        function calculateGuideData() {
          let sum = data.reduce((pv, cv) => {
            return pv + cv[1];
          }, 0);
          let guideData = data.map((d) => {
            return [d[0], d[1] + maxYValue - sum, d[2]];
          });
          console.log(guideData);
          return guideData;
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
