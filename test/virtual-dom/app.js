function App() {
  return SimpleReact.createElement(
    "div",
    null,
    SimpleReact.createElement("h1", null, "Hello SimpleReact"),
    SimpleReact.createElement(
      "p",
      null,
      "This is a simple implementation of React-like library."
    )
  );
}

const root = document.getElementById("root");
SimpleReact.render(SimpleReact.createElement(App, null), root);
