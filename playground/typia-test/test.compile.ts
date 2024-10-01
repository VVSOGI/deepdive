import * as ts from "typescript";
import * as path from "path";
import { transform as typiaTransform } from "typia/lib/transform";

function createTypiaTransformer(
  program: ts.Program,
  options: ts.CompilerOptions
): ts.TransformerFactory<ts.SourceFile> {
  return (context: ts.TransformationContext) => {
    return (sourceFile: ts.SourceFile) => {
      const diagnostics: ts.Diagnostic[] = [];

      const typiaResult = typiaTransform(
        program,
        ((options.plugins as any[]) ?? []).find(
          (p: any) => p.transform === "typia/lib/transform" || p.transform === "../src/transform.ts"
        ) ?? {},
        {
          addDiagnostic: (diag) => diagnostics.push(diag),
        }
      );
      return typiaResult(context)(sourceFile);
    };
  };
}

function compile(fileNames: string[], options: ts.CompilerOptions): void {
  const host = ts.createCompilerHost(options);

  const originalWriteFile = host.writeFile;

  host.writeFile = (fileName: string, content: string, writeByteOrderMark: boolean, ...args) => {
    if (path.extname(fileName) === ".map") {
      console.log(`생성된 소스맵: ${fileName}`);
    } else if (path.extname(fileName) === ".d.ts") {
      console.log(`생성된 선언 파일: ${fileName}`);
    } else {
      console.log(`생성된 JavaScript 파일: ${fileName}`);
    }

    originalWriteFile(fileName, content, writeByteOrderMark, ...args);
  };

  let program = ts.createProgram(fileNames, options, host);

  const typiaTransformer = createTypiaTransformer(program, options);

  let emitResult = program.emit(undefined, undefined, undefined, false, {
    before: [typiaTransformer],
    after: [],
    afterDeclarations: [],
  });

  let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
      let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
    }
  });

  let exitCode = emitResult.emitSkipped ? 1 : 0;
  console.log(`프로세스 종료 코드: ${exitCode}`);
}

const compilerOptions: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2016,
  module: ts.ModuleKind.CommonJS,
  esModuleInterop: true,
  forceConsistentCasingInFileNames: true,
  strict: true,
  skipLibCheck: true,
  declaration: true,
  sourceMap: true,
  strictNullChecks: true,
};

compile(["./src/check.ts"], compilerOptions);
