import React from "react";
import Container from "@material-ui/core/Container";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import BinaryChoice from "./components/choice/binary";
import TrendChoice from "./components/choice/trend";

import "./App.css";

// const App = () => {
class App extends React.Component {
  state = {};

  // componentWillMount() {
  //   // axios.get("/consent");
  // }

  componentDidMount() {}

  render() {
    return (
      <div className="app" style={{ height: "100%", lineHeight: "150%" }}>
        <Container id="root-container">
          <BinaryChoice
            choiceDomain={[0.0, 1.0]}
            key={`choice`}
            responseIndex={0}
            // handleResponse={handleResponse}
            question="How A / B is your choice?"
            tickLabels={["A", "", "B"]}
          ></BinaryChoice>
          <hr />
          <TrendChoice width="500px" height="500px"></TrendChoice>
        </Container>
      </div>
    );
  }
}

// const Consent = () => {
//   return <p className="test">consent</p>;
// };

// const Pre = () => {
//   return <p className="test">Pre</p>;
// };

// const Post = () => {
//   return <p className="test">Post</p>;
// };

export default App;
