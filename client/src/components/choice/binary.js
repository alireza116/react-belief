import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

/* Component */
const BinaryChoice = (props) => {
  const d3Container = useRef(null);
  const width = props.width || "50%";
  const height = props.height || "18%";

  useEffect(
    () => {
      if (d3Container.current) {
        //svg returned by this component
        const svg = d3.select(d3Container.current);
        //width of svg
        const width = svg.node().getBoundingClientRect().width;
        //height of svg
        const height = svg.node().getBoundingClientRect().height;

        const leftMarginPct = 0.08;
        const rightMarginpct = 0.08;
        const topMarginPct = 0.15;
        const bottomMarginPct = 0.15;

        const margins = {
          left: width * leftMarginPct,
          right: width * rightMarginpct,
          top: height * topMarginPct,
          bottom: height * bottomMarginPct,
        };
        const w = width - margins.left - margins.right;
        const h = height - margins.top - margins.bottom;

        let choice;
        let CI;
        let choiceMade = false;
        let uncertaintyMade = false;
        let nLines = props.nLines || 100;
        const choiceDomain = props.choiceDomain || [-1.0, 1.0];
        let qText = props.question || "how suspicious is this tweet?";

        const g = svg
          .append("g")
          .attr("transform", `translate(${margins.left},${margins.top})`);

        const text = g.append("text").text(qText);

        const xScale = d3.scaleLinear().range([0, w]).domain(choiceDomain);

        let tickLabels = props.tickLabels || ["A", "", "C"];

        let xAxis = svg
          .append("g")
          .attr(
            "transform",
            `translate(${margins.left},${h / 2 + margins.top})`
          )
          .call(
            d3
              .axisBottom(xScale)
              .ticks(tickLabels.length - 1)
              .tickFormat((d, i) => tickLabels[i])
          )
          .attr("pointer-events", "none")
          .style("font-size", "12px");

        let rect = g
          .append("rect")
          .attr("width", w)
          .attr("height", h)
          .attr("fill", "rgba(0,0,0,0)");

        let xs = [];
        for (var i = 0; i < nLines; i++) {
          xs.push(0);
        }
        let band = g
          .selectAll(".uncertaintyLines")
          .data(xs)
          .enter()
          .append("line")
          .attr("class", "uncertaintyLines")
          .attr("pointer-events", "none");

        let line = g
          .append("line")
          .attr("x1", 5)
          .attr("x2", 5)
          .attr("y1", h * topMarginPct)
          .attr("y2", h - h * topMarginPct)
          .attr("stroke-width", 6)
          .attr("stroke", "orange")
          .style("pointer-events", "none");

        const reset = g
          .append("rect")
          .attr("width", "60px")
          .attr("height", "30px")
          .attr("transform", `translate(0,${h - margins.bottom / 2})`)
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
            choiceMade = false;
            uncertaintyMade = false;
            line.attr("stroke", "orange");
            band.attr("stroke-width", 0);
            if (props.handleResponse)
              props.handleResponse(null, props.responseIndex);
          });

        rect
          .on("mousemove", function () {
            let coords = d3.mouse(this);
            if (!choiceMade) {
              line.attr("x1", coords[0]).attr("x2", coords[0]);
              choice = xScale.invert(coords[0]);

              if (props.setChoice) props.setChoice(choice);
            } else if (choiceMade && !uncertaintyMade) {
              let uncertaintySize = xScale.invert(coords[0]) - choice;
              let uncertaintyPixelSize = Math.abs(coords[0] - xScale(choice));
              CI = [choice - uncertaintySize, choice + uncertaintySize];

              CI = [
                d3.min(CI) > choiceDomain[0] ? d3.min(CI) : choiceDomain[0],
                d3.max(CI) < choiceDomain[1] ? d3.max(CI) : choiceDomain[0],
              ];

              xs = [];
              let randomize = d3.randomNormal(
                xScale(choice),
                uncertaintyPixelSize / 2
              );
              for (var i = 0; i < nLines; i++) {
                xs.push(randomize());
              }
              xs = xs.filter((r) => {
                return (
                  r < xScale(choice) + uncertaintyPixelSize &&
                  r > xScale(choice) - uncertaintyPixelSize &&
                  r <= xScale(choiceDomain[1]) &&
                  r >= xScale(choiceDomain[0])
                );
              });

              band
                .data(xs)
                .attr("class", "uncertaintyLines")
                .attr("x1", function (d) {
                  return d;
                })
                .attr("x2", function (d) {
                  return d;
                })
                .attr("y1", h * topMarginPct)
                .attr("y2", h - h * topMarginPct)
                .attr("stroke", "orange")
                .attr("stroke-opacity", 0.05)
                .attr("stroke-width", 6);

              // band.exit().remove();
            }
          })
          .on("click", () => {
            if (!choiceMade) {
              choiceMade = true;
              line.attr("stroke", "#484848");
            } else if (!uncertaintyMade) {
              uncertaintyMade = true;
              band.attr("stroke", "#484848");
              if (props.handleResponse)
                props.handleResponse(
                  {
                    CI: CI ? [d3.min(CI), d3.max(CI)] : null,
                    choice: choice,
                    time: Date.now(),
                  },
                  props.responseIndex
                );
            }
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
export default BinaryChoice;
