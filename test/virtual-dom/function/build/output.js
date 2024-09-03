function App() {
    return SimpleReact.createElement(
      "div",
      null,
      SimpleReact.createElement(
      "h1",
      null,
      "HelloSimpleReact"
    ), SimpleReact.createElement(
      "p",
      null,
      "Thisisasimpleimplementation", SimpleReact.createElement(
      "span",
      null,
      "span!!!"
    ), "ofReact-likelibrary."
    )
    );
  }
  
  const root = document.getElementById("root");
SimpleReact.render(SimpleReact.createElement(App, null), root);
  