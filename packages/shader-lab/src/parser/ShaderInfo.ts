import { ASTNode } from "./AST";
import { SymbolTable } from "../parser/symbolTable";

export class ShaderData {
  symbolTable: SymbolTable;

  vertexMain: ASTNode.FunctionDefinition;
  fragmentMain: ASTNode.FunctionDefinition;

  globalPrecisions: ASTNode.PrecisionSpecifier[] = [];
}
