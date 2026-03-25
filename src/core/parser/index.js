const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

function parseFile(file) {
    let ast;
    
    try {
        ast = parser.parse(file.content, {
            sourceType: "unambiguous",
            plugins: ["jsx", "typescript"],
        });
    } catch (err) {
        // skip files that fail parsing
        return {
            file: file.path,
            imports: [],
        };
    }
    
    const imports = [];
    
    traverse(ast, {
        ImportDeclaration({ node }) {
            imports.push(node.source.value);
        },
        CallExpression({ node }) {
            if (
                node.callee.name === "require" &&
                node.arguments.length > 0 &&
                node.arguments[0].type === "StringLiteral"
            ) {
                imports.push(node.arguments[0].value);
            }
        },
    });
    
    return {
        file: file.path,
        imports,
    };
}

module.exports = { parseFile };
