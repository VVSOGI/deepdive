function App() {
  return SimpleReact.createElement(
    "div",
    null,
    SimpleReact.createElement("h1", null, "Hello Another"),
    SimpleReact.createElement("p", null, "This is a Another place.")
  );
}

const root = document.getElementById("root");
SimpleReact.render(SimpleReact.createElement(App, null), root);
