import {
  createPrinter,
  createSourceFile,
  ExpressionStatement,
  factory,
  ListFormat,
  NodeFlags,
  ScriptKind,
  ScriptTarget,
  SyntaxKind
} from "typescript"
import * as Laravel from "./LaravelRoute"

function toPascalCase(input: string): string {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join("")
}

function toCamelCase(input: string): string {
  return input
    .split(/[^a-zA-Z0-9]+/)
    .map((item, index) => (index === 0 ? item.charAt(0) : item.charAt(0).toUpperCase()) + item.slice(1))
    .join("")
}

function readJsonFromStdin() {
  let stdin = process.stdin
  let inputChunks: Buffer[] = []

  stdin.resume()
  stdin.setEncoding("utf8")

  stdin.on("data", (chunk) => {
    inputChunks.push(chunk)
  })

  return new Promise<Laravel.Route[]>((resolve, reject) => {
    stdin.on("end", () => {
      resolve(JSON.parse(inputChunks.join()))
    })
    stdin.on("error", () => {
      reject(new Error("error during read"))
    })
    stdin.on("timeout", () => {
      reject(new Error("timout during read"))
    })
  })
}

const GetRouteName = (route: Laravel.Route) => {
  const alias = route.action.as && toPascalCase(route.action.as)

  const [controllerName, actionName] = route.action.uses.split("@")

  // Using either route custom name or controller name concatenated with action method name
  return (
    alias ||
    controllerName.slice(controllerName.lastIndexOf("\\") + 1).replace("Controller", "") +
      actionName[0].toUpperCase() +
      actionName.slice(1)
  )
}

// TODO: write alghorithm, that converts tokens to some weird AST template string literal structure
// at now it parses string to ast and attached to the tree
const GetRoutePath = (route: Laravel.Route) => {
  const rawuri = route.symfony.path_tokens.reverse().reduce((a, item) => {
    if (item[0] === "text") {
      return a + item[1]
    }
    if (item[0] === "variable") {
      return a + `${item[1]}\${${item[3]}}`
    }
    return a
  }, "")

  const source = createSourceFile(
    "temp.ts",
    `\`${rawuri.replace(/^\/|\/$/, "")}\``,
    ScriptTarget.Latest,
    undefined,
    ScriptKind.TS
  )

  return source.getChildAt(0).getChildAt(0) as ExpressionStatement
}

async function main() {
  const routes: Laravel.Route[] = await readJsonFromStdin()
  const printer = createPrinter()

  const routeNodes = routes.map((route) => {
    const method = route.methods[0].toLowerCase() as "get" | "post"
    const funcName = GetRouteName(route)
    const path = GetRoutePath(route)

    const baseInput = route.input
    const pathInput = route.symfony.vars.reduce((a, b) => ({ ...a, [b]: "string" }), {})

    const inputVars = {
      ...baseInput,
      ...pathInput
    }

    const inputVarsEmpty = Object.values(inputVars).length === 0

    return factory.createPropertyAssignment(
      factory.createIdentifier(funcName),
      factory.createArrowFunction(
        undefined,
        undefined,
        inputVars && !inputVarsEmpty
          ? [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                factory.createObjectBindingPattern(
                  Object.keys(inputVars).map((key) =>
                    factory.createBindingElement(
                      undefined,
                      undefined,
                      factory.createIdentifier(toCamelCase(key)),
                      undefined
                    )
                  )
                ),
                undefined,
                factory.createTypeLiteralNode(
                  Object.entries(inputVars).map(([key, value]) => {
                    const rules: string[] =
                      typeof value === "string" ? value.split("|") : value instanceof Array ? value : []

                    return factory.createPropertySignature(
                      undefined,
                      toCamelCase(key),
                      rules.includes("required") ? undefined : factory.createToken(SyntaxKind.QuestionToken),
                      rules.includes("integer")
                        ? factory.createKeywordTypeNode(SyntaxKind.NumberKeyword)
                        : rules.includes("date")
                        ? factory.createTypeReferenceNode(factory.createIdentifier("Date"))
                        : rules.includes("string")
                        ? factory.createKeywordTypeNode(SyntaxKind.StringKeyword)
                        : factory.createLiteralTypeNode(factory.createStringLiteral(JSON.stringify(value)))
                    )
                  })
                )
              ),

              factory.createParameterDeclaration(
                [],
                [],
                undefined,
                "options",
                factory.createToken(SyntaxKind.QuestionToken),
                factory.createTypeReferenceNode(factory.createIdentifier("Partial"), [
                  factory.createTypeReferenceNode(factory.createIdentifier("Options"), undefined)
                ])
              )
            ]
          : [
              factory.createParameterDeclaration(
                [],
                [],
                undefined,
                "options",
                factory.createToken(SyntaxKind.QuestionToken),
                factory.createTypeReferenceNode(factory.createIdentifier("Partial"), [
                  factory.createTypeReferenceNode(factory.createIdentifier("Options"), undefined)
                ])
              )
            ],
        undefined,
        factory.createToken(SyntaxKind.EqualsGreaterThanToken),
        factory.createBlock(
          [
            factory.createReturnStatement(
              factory.createCallExpression(
                factory.createPropertyAccessExpression(
                  factory.createIdentifier("client"),
                  factory.createIdentifier(route.methods[0].toLowerCase())
                ),
                undefined,
                baseInput
                  ? method === "get"
                    ? [
                        path.expression,
                        factory.createObjectLiteralExpression(
                          [
                            factory.createPropertyAssignment(
                              factory.createIdentifier("searchParams"),
                              factory.createObjectLiteralExpression(
                                Object.keys(baseInput).map((key) =>
                                  factory.createPropertyAssignment(
                                    factory.createIdentifier(key),
                                    factory.createCallExpression(factory.createIdentifier("String"), undefined, [
                                      factory.createIdentifier(toCamelCase(key))
                                    ])
                                  )
                                ),
                                true
                              )
                            ),
                            factory.createSpreadAssignment(factory.createIdentifier("options"))
                          ],
                          true
                        )
                      ]
                    : [
                        path.expression,
                        factory.createObjectLiteralExpression(
                          [
                            factory.createPropertyAssignment(
                              factory.createIdentifier("json"),
                              factory.createObjectLiteralExpression(
                                Object.keys(baseInput).map((key) =>
                                  toCamelCase(key) === key
                                    ? factory.createShorthandPropertyAssignment(
                                        factory.createIdentifier(key),
                                        undefined
                                      )
                                    : factory.createPropertyAssignment(
                                        factory.createIdentifier(key),
                                        factory.createIdentifier(toCamelCase(key))
                                      )
                                ),
                                true
                              )
                            ),
                            factory.createSpreadAssignment(factory.createIdentifier("options"))
                          ],
                          true
                        )
                      ]
                  : [path.expression, factory.createIdentifier("options")]
              )
            )
          ],
          true
        )
      )
    )
  })

  const nodes = [
    factory.createImportDeclaration(
      undefined,
      undefined,
      factory.createImportClause(
        false,
        factory.createIdentifier("ky"),
        factory.createNamedImports([
          factory.createImportSpecifier(false, undefined, factory.createIdentifier("Options"))
        ])
      ),
      factory.createStringLiteral("ky"),
      undefined
    ),
    factory.createVariableStatement(
      [factory.createModifier(SyntaxKind.ExportKeyword)],
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createIdentifier("getRoutes"),
            undefined,
            undefined,
            factory.createArrowFunction(
              undefined,
              undefined,
              [
                factory.createParameterDeclaration(
                  undefined,
                  undefined,
                  undefined,
                  factory.createIdentifier("client"),
                  undefined,
                  factory.createTypeQueryNode(factory.createIdentifier("ky")),
                  undefined
                )
              ],
              undefined,
              factory.createToken(SyntaxKind.EqualsGreaterThanToken),
              factory.createParenthesizedExpression(factory.createObjectLiteralExpression(routeNodes, true))
            )
          )
        ],
        NodeFlags.Const
      )
    )
  ]

  const file = createSourceFile("routes.ts", "", ScriptTarget.Latest, true, ScriptKind.TS)

  const output = printer.printList(ListFormat.MultiLine, factory.createNodeArray(nodes), file)

  console.log(output)
}

main()
