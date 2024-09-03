const fs = require("fs");
const path = require("path");

fs.readFile(path.resolve(__dirname, `./test.jsb`), "utf8", (err, data) => {
  if (err) {
    console.error(err);
  }

  const replace = data.replace(/\s/g, "");
  const tree = tokenizeJSXtoTree(replace);
  const isExistFolder = fs.existsSync(path.resolve(__dirname, `../build`));

  if (isExistFolder) {
    fs.rmSync(
      path.resolve(__dirname, `./build`),
      { recursive: true, force: true },
      (err) => {
        if (err) {
          console.error(err);
        }
      }
    );
  }

  fs.mkdirSync(path.resolve(__dirname, `../build`), { recursive: true });

  const simpleReact = fs.readFileSync(
    path.resolve(__dirname, `../packages/simple-react.js`),
    "utf8"
  );

  fs.writeFile(
    path.resolve(__dirname, `../build/simple-react.js`),
    simpleReact,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );

  fs.writeFile(
    path.resolve(__dirname, `../build/output.js`),
    generateAppFunction(tree),
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );

  fs.writeFile(
    path.resolve(__dirname, `../build/output.html`),
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
      <script src="./simple-react.js"></script>
      <script src="./output.js"></script>
    </html>    
  `,
    (err) => {
      if (err) {
        console.error(err);
      }
    }
  );
});

function convertToCreateElement(node) {
  if (node.type === "text") {
    return JSON.stringify(node.content);
  }

  const children = node.children.map(convertToCreateElement);
  const childrenString = children.join(", ");

  return `SimpleReact.createElement(
      "${node.type}",
      null,
      ${childrenString}
    )`;
}

function generateAppFunction(tree) {
  const elementString = convertToCreateElement(tree);
  return `function App() {
    return ${elementString};
  }
  
  const root = document.getElementById("root");
SimpleReact.render(SimpleReact.createElement(App, null), root);
  `;
}

function tokenizeJSXtoTree(input) {
  let current = 0;

  function parseElement() {
    let element = {
      type: null,
      children: [],
    };

    if (input[current] === "<" && input[current + 1] !== "/") {
      current++;
      let tagName = "";
      while (input[current] !== ">") {
        tagName += input[current];
        current++;
      }
      current++;
      element.type = tagName;

      while (input[current] !== "<" || input[current + 1] !== "/") {
        if (input[current] === "<") {
          element.children.push(parseElement());
        } else {
          let textContent = "";
          while (input[current] !== "<") {
            textContent += input[current];
            current++;
          }
          if (textContent.trim()) {
            element.children.push({
              type: "text",
              content: textContent.trim(),
            });
          }
        }
      }

      while (input[current] !== ">") {
        current++;
      }
      current++;
    }

    return element;
  }

  while (current < input.length && input[current] !== "<") {
    current++;
  }

  return parseElement();
}
