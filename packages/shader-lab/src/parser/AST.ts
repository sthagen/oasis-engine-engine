// #if _VERBOSE
import { BuiltinFunction, BuiltinVariable, NonGenericGalaceanType } from "./builtin";
// #endif
import { ClearableObjectPool, IPoolElement } from "@galacean/engine";
import { CodeGenVisitor } from "../codeGen";
import { EKeyword, ETokenType, GalaceanDataType, ShaderRange, TokenType, TypeAny } from "../common";
import { BaseToken, BaseToken as Token } from "../common/BaseToken";
import { ParserUtils } from "../ParserUtils";
import { ShaderLabUtils } from "../ShaderLabUtils";
import { NoneTerminal } from "./GrammarSymbol";
import SematicAnalyzer from "./SemanticAnalyzer";
import { ShaderData } from "./ShaderInfo";
import { ESymbolType, FnSymbol, StructSymbol, VarSymbol } from "./symbolTable";
import { IParamInfo, NodeChild, StructProp, SymbolType } from "./types";

function ASTNodeDecorator(nonTerminal: NoneTerminal) {
  return function <T extends { new (): TreeNode }>(ASTNode: T) {
    ASTNode.prototype.nt = nonTerminal;
    (<any>ASTNode).pool = ShaderLabUtils.createObjectPool(ASTNode);
  };
}

export abstract class TreeNode implements IPoolElement {
  static pool: ClearableObjectPool<TreeNode & { set: (loc: ShaderRange, children: NodeChild[]) => void }>;

  /** The non-terminal in grammar. */
  nt: NoneTerminal;
  private _children: NodeChild[];
  private _location: ShaderRange;

  get children() {
    return this._children;
  }

  get location() {
    return this._location;
  }

  set(loc: ShaderRange, children: NodeChild[]): void {
    this._location = loc;
    this._children = children;
    this.init();
  }

  init() {}

  dispose(): void {}

  // Visitor pattern interface for code generation
  codeGen(visitor: CodeGenVisitor) {
    return visitor.defaultCodeGen(this.children);
  }

  /**
   * Do semantic analyze right after the ast node is generated.
   */
  semanticAnalyze(sa: SematicAnalyzer) {}
}

export namespace ASTNode {
  export type ASTNodePool = ClearableObjectPool<
    { set: (loc: ShaderRange, children: NodeChild[]) => void } & IPoolElement & TreeNode
  >;

  export function _unwrapToken(node: NodeChild) {
    if (node instanceof Token) {
      return node;
    }
    throw "not token";
  }

  export function get(pool: ASTNodePool, sa: SematicAnalyzer, loc: ShaderRange, children: NodeChild[]) {
    const node = pool.get();
    node.set(loc, children);
    node.semanticAnalyze(sa);
    sa.semanticStack.push(node);
  }

  @ASTNodeDecorator(NoneTerminal._ignore)
  export class TrivialNode extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.scope_brace)
  export class ScopeBrace extends TreeNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      sa.newScope();
    }
  }

  @ASTNodeDecorator(NoneTerminal.scope_end_brace)
  export class ScopeEndBrace extends TreeNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      sa.dropScope();
    }
  }

  @ASTNodeDecorator(NoneTerminal.jump_statement)
  export class JumpStatement extends TreeNode {
    isFragReturnStatement: boolean;

    override init(): void {
      this.isFragReturnStatement = false;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (ASTNode._unwrapToken(this.children![0]).type === EKeyword.RETURN) {
        sa.curFunctionInfo.returnStatement = this;
      }
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitJumpStatement(this);
    }
  }

  // #if _VERBOSE
  @ASTNodeDecorator(NoneTerminal.conditionopt)
  export class ConditionOpt extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.for_rest_statement)
  export class ForRestStatement extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.condition)
  export class Condition extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.for_init_statement)
  export class ForInitStatement extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.iteration_statement)
  export class IterationStatement extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.selection_statement)
  export class SelectionStatement extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.expression_statement)
  export class ExpressionStatement extends TreeNode {}
  // #endif

  export abstract class ExpressionAstNode extends TreeNode {
    protected _type?: GalaceanDataType;
    set type(t: GalaceanDataType | undefined) {
      this._type = t;
    }
    get type() {
      return this._type ?? TypeAny;
    }

    override init(): void {
      this._type = undefined;
    }
  }

  // #if _VERBOSE
  @ASTNodeDecorator(NoneTerminal.initializer_list)
  export class InitializerList extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      const init = this.children[0] as Initializer | InitializerList;
      this.type = init.type;
    }
  }

  @ASTNodeDecorator(NoneTerminal.initializer)
  export class Initializer extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<AssignmentExpression>this.children[0]).type;
      } else {
        this.type = (<InitializerList>this.children[1]).type;
      }
    }
  }
  // #endif

  @ASTNodeDecorator(NoneTerminal.single_declaration)
  export class SingleDeclaration extends TreeNode {
    typeSpecifier: TypeSpecifier;
    arraySpecifier?: ArraySpecifier;

    override init(): void {
      this.typeSpecifier = undefined;
      this.arraySpecifier = undefined;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      const children = this.children;
      const childrenLen = children.length;
      const fullyType = children[0] as FullySpecifiedType;
      const typeSpecifier = fullyType.typeSpecifier;
      this.typeSpecifier = typeSpecifier;
      this.arraySpecifier = typeSpecifier.arraySpecifier;

      const id = children[1] as Token;

      let sm: VarSymbol;
      if (childrenLen === 2 || childrenLen === 4) {
        const symbolType = new SymbolType(fullyType.type, typeSpecifier.lexeme, this.arraySpecifier);
        const initializer = children[3] as Initializer;

        sm = new VarSymbol(id.lexeme, symbolType, false, initializer);
      } else {
        const arraySpecifier = children[2] as ArraySpecifier;
        // #if _VERBOSE
        if (arraySpecifier && this.arraySpecifier) {
          sa.reportError(arraySpecifier.location, "Array of array is not supported.");
        }
        // #endif
        this.arraySpecifier = arraySpecifier;
        const symbolType = new SymbolType(fullyType.type, typeSpecifier.lexeme, this.arraySpecifier);
        const initializer = children[4] as Initializer;

        sm = new VarSymbol(id.lexeme, symbolType, false, initializer);
      }
      sa.symbolTableStack.insert(sm);
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitSingleDeclaration(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.fully_specified_type)
  export class FullySpecifiedType extends TreeNode {
    get qualifierList() {
      if (this.children.length > 1) {
        return (<TypeQualifier>this.children[0]).qualifierList;
      }
    }

    get typeSpecifier() {
      return (this.children.length === 1 ? this.children[0] : this.children[1]) as TypeSpecifier;
    }

    get type() {
      return this.typeSpecifier.type;
    }
  }

  @ASTNodeDecorator(NoneTerminal.type_qualifier)
  export class TypeQualifier extends TreeNode {
    qualifierList: EKeyword[];

    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length > 1) {
        this.qualifierList = [
          ...(<TypeQualifier>this.children[0]).qualifierList,
          (<SingleTypeQualifier>this.children[1]).qualifier
        ];
      } else {
        this.qualifierList = [(<SingleTypeQualifier>this.children[0]).qualifier];
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.single_type_qualifier)
  export class SingleTypeQualifier extends TreeNode {
    qualifier: EKeyword;
    lexeme: string;

    override semanticAnalyze(sa: SematicAnalyzer): void {
      const child = this.children[0];
      if (child instanceof Token) {
        this.qualifier = child.type as EKeyword;
        this.lexeme = child.lexeme;
      } else {
        this.qualifier = (<BasicTypeQualifier>child).qualifier;
        this.lexeme = (<BasicTypeQualifier>child).lexeme;
      }
    }
  }

  abstract class BasicTypeQualifier extends TreeNode {
    get qualifier(): EKeyword {
      return (<Token>this.children[0]).type as EKeyword;
    }
    get lexeme(): string {
      return (<Token>this.children[0]).lexeme;
    }
  }

  // #if _VERBOSE
  @ASTNodeDecorator(NoneTerminal.storage_qualifier)
  export class StorageQualifier extends BasicTypeQualifier {}

  @ASTNodeDecorator(NoneTerminal.precision_qualifier)
  export class PrecisionQualifier extends BasicTypeQualifier {}

  @ASTNodeDecorator(NoneTerminal.interpolation_qualifier)
  export class InterpolationQualifier extends BasicTypeQualifier {}

  @ASTNodeDecorator(NoneTerminal.invariant_qualifier)
  export class InvariantQualifier extends BasicTypeQualifier {}
  // #endif

  @ASTNodeDecorator(NoneTerminal.type_specifier)
  export class TypeSpecifier extends TreeNode {
    get type(): GalaceanDataType {
      return (this.children![0] as TypeSpecifierNonArray).type;
    }
    get lexeme(): string {
      return (this.children![0] as TypeSpecifierNonArray).lexeme;
    }
    get arraySize(): number {
      return (this.children?.[1] as ArraySpecifier)?.size;
    }
    get arraySpecifier(): ArraySpecifier {
      return this.children[1] as ArraySpecifier;
    }

    get isCustom() {
      return typeof this.type === "string";
    }
  }

  @ASTNodeDecorator(NoneTerminal.array_specifier)
  export class ArraySpecifier extends TreeNode {
    get size(): number | undefined {
      const integerConstantExpr = this.children[1] as IntegerConstantExpression;
      return integerConstantExpr.value;
    }
  }

  @ASTNodeDecorator(NoneTerminal.integer_constant_expression_operator)
  export class IntegerConstantExpressionOperator extends TreeNode {
    compute: (a: number, b: number) => number;
    get lexeme(): string {
      return (this.children[0] as Token).lexeme;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      const operator = this.children[0] as Token;
      switch (operator.type) {
        case ETokenType.PLUS:
          this.compute = (a, b) => a + b;
          break;
        case ETokenType.DASH:
          this.compute = (a, b) => a - b;
          break;
        case ETokenType.STAR:
          this.compute = (a, b) => a * b;
          break;
        case ETokenType.SLASH:
          this.compute = (a, b) => a / b;
          break;
        case ETokenType.PERCENT:
          this.compute = (a, b) => a % b;
          break;
        default:
          sa.reportError(operator.location, `not implemented operator ${operator.lexeme}`);
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.integer_constant_expression)
  export class IntegerConstantExpression extends TreeNode {
    value?: number;

    override init(): void {
      this.value = undefined;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        const child = this.children[0];
        if (child instanceof Token) {
          this.value = Number(child.lexeme);
        }
        // #if _VERBOSE
        else {
          const id = child as VariableIdentifier;
          if (!id.symbolInfo) {
            sa.reportError(id.location, `Undeclared symbol: ${id.lexeme}`);
          }
          if (!ParserUtils.typeCompatible(EKeyword.INT, id.typeInfo)) {
            sa.reportError(id.location, "Invalid integer.");
            return;
          }
        }
        // #endif
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.type_specifier_nonarray)
  export class TypeSpecifierNonArray extends TreeNode {
    type: GalaceanDataType;
    lexeme: string;

    override init(): void {
      const tt = this.children[0];
      if (tt instanceof Token) {
        this.type = tt.lexeme;
        this.lexeme = tt.lexeme;
      } else {
        this.type = (tt as ExtBuiltinTypeSpecifierNonArray).type as GalaceanDataType;
        this.lexeme = (tt as ExtBuiltinTypeSpecifierNonArray).lexeme;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.ext_builtin_type_specifier_nonarray)
  export class ExtBuiltinTypeSpecifierNonArray extends TreeNode {
    type: TokenType;
    lexeme: string;

    override init(): void {
      const token = this.children[0] as Token;
      this.type = token.type;
      this.lexeme = token.lexeme;
    }
  }

  @ASTNodeDecorator(NoneTerminal.init_declarator_list)
  export class InitDeclaratorList extends TreeNode {
    get typeInfo(): SymbolType {
      if (this.children.length === 1) {
        const singleDecl = this.children[0] as SingleDeclaration;
        return new SymbolType(
          singleDecl.typeSpecifier.type,
          singleDecl.typeSpecifier.lexeme,
          singleDecl.arraySpecifier
        );
      }

      const initDeclList = this.children[0] as InitDeclaratorList;
      return initDeclList.typeInfo;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      let sm: VarSymbol;
      if (this.children.length === 3 || this.children.length === 5) {
        const id = this.children[2] as Token;
        sm = new VarSymbol(id.lexeme, this.typeInfo, false, this);
        sa.symbolTableStack.insert(sm);
      } else if (this.children.length === 4 || this.children.length === 6) {
        const typeInfo = this.typeInfo;
        const arraySpecifier = this.children[3] as ArraySpecifier;
        // #if _VERBOSE
        if (typeInfo.arraySpecifier && arraySpecifier) {
          sa.reportError(arraySpecifier.location, "Array of array is not supported.");
        }
        // #endif
        typeInfo.arraySpecifier = arraySpecifier;
        const id = this.children[2] as Token;
        sm = new VarSymbol(id.lexeme, typeInfo, false, this);
        sa.symbolTableStack.insert(sm);
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.identifier_list)
  export class IdentifierList extends TreeNode {
    get idList(): Token[] {
      if (this.children.length === 2) {
        return [this.children[1] as Token];
      }
      return [...(<IdentifierList>this.children[0]).idList, this.children[2] as Token];
    }
  }

  @ASTNodeDecorator(NoneTerminal.declaration)
  export class Declaration extends TreeNode {
    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitDeclaration(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_prototype)
  export class FunctionProtoType extends TreeNode {
    private get declarator() {
      return this.children[0] as FunctionDeclarator;
    }

    get ident() {
      return this.declarator.ident;
    }

    get returnType() {
      return this.declarator.returnType;
    }

    get parameterList() {
      return this.declarator.parameterInfoList;
    }

    get paramSig() {
      return this.declarator.paramSig;
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitFunctionProtoType(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_declarator)
  export class FunctionDeclarator extends TreeNode {
    private get header() {
      return this.children[0] as FunctionHeader;
    }

    private get parameterList() {
      return this.children[1] as FunctionParameterList | undefined;
    }

    get ident() {
      return this.header.ident;
    }

    get returnType() {
      return this.header.returnType;
    }

    get parameterInfoList() {
      return this.parameterList?.parameterInfoList;
    }

    get paramSig() {
      return this.parameterList?.paramSig;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      sa.curFunctionInfo.returnStatement = null;
      sa.curFunctionInfo.header = this;
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_header)
  export class FunctionHeader extends TreeNode {
    get ident() {
      return this.children[1] as Token;
    }
    get returnType() {
      return this.children[0] as FullySpecifiedType;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      sa.newScope();
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitFunctionHeader(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_parameter_list)
  export class FunctionParameterList extends TreeNode {
    get parameterInfoList(): IParamInfo[] {
      if (this.children.length === 1) {
        const decl = this.children[0] as ParameterDeclaration;
        return [{ ident: decl.ident, typeInfo: decl.typeInfo, astNode: decl }];
      }
      const list = this.children[0] as FunctionParameterList;
      const decl = this.children[2] as ParameterDeclaration;
      return [...list.parameterInfoList, { ident: decl.ident, typeInfo: decl.typeInfo, astNode: decl }];
    }

    get paramSig(): GalaceanDataType[] {
      if (this.children.length === 1) {
        const decl = this.children[0] as ParameterDeclaration;
        return [decl.typeInfo.type];
      } else {
        const list = this.children[0] as FunctionParameterList;
        const decl = this.children[2] as ParameterDeclaration;
        return list.paramSig.concat([decl.typeInfo.type]);
      }
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitFunctionParameterList(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.parameter_declaration)
  export class ParameterDeclaration extends TreeNode {
    get typeQualifier() {
      if (this.children.length === 2) return this.children[0] as TypeQualifier;
    }

    private get parameterDeclarator() {
      if (this.children.length === 1) return this.children[0] as ParameterDeclarator;
      return this.children[1] as ParameterDeclarator;
    }

    get typeInfo() {
      return this.parameterDeclarator.typeInfo;
    }

    get ident() {
      return this.parameterDeclarator.ident;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      let declarator: ParameterDeclarator;
      if (this.children.length === 1) {
        declarator = this.children[0] as ParameterDeclarator;
      } else {
        declarator = this.children[1] as ParameterDeclarator;
      }
      const varSymbol = new VarSymbol(declarator.ident.lexeme, declarator.typeInfo, false, this);
      sa.symbolTableStack.insert(varSymbol);
    }
  }

  @ASTNodeDecorator(NoneTerminal.parameter_declarator)
  export class ParameterDeclarator extends TreeNode {
    get ident() {
      return this.children[1] as Token;
    }

    get typeInfo(): SymbolType {
      const typeSpecifier = this.children[0] as TypeSpecifier;
      const arraySpecifier = this.children[2] as ArraySpecifier;
      return new SymbolType(typeSpecifier.type, typeSpecifier.lexeme, arraySpecifier);
    }
  }

  // #if _VERBOSE
  @ASTNodeDecorator(NoneTerminal.simple_statement)
  export class SimpleStatement extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.compound_statement)
  export class CompoundStatement extends TreeNode {}
  // #endif

  @ASTNodeDecorator(NoneTerminal.compound_statement_no_scope)
  export class CompoundStatementNoScope extends TreeNode {}

  // #if _VERBOSE
  @ASTNodeDecorator(NoneTerminal.statement)
  export class Statement extends TreeNode {}
  // #endif

  @ASTNodeDecorator(NoneTerminal.statement_list)
  export class StatementList extends TreeNode {
    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitStatementList(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_definition)
  export class FunctionDefinition extends TreeNode {
    private _returnStatement?: ASTNode.JumpStatement;

    get returnStatement(): ASTNode.JumpStatement | undefined {
      return this._returnStatement;
    }

    get protoType() {
      return this.children[0] as FunctionProtoType;
    }

    get statements() {
      return this.children[1] as CompoundStatementNoScope;
    }

    override init(): void {
      this._returnStatement = undefined;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      sa.dropScope();
      const sm = new FnSymbol(this.protoType.ident.lexeme, this);
      sa.symbolTableStack.insert(sm);

      const { curFunctionInfo } = sa;
      const { header, returnStatement } = curFunctionInfo;
      if (header.returnType.type === EKeyword.VOID) {
        if (returnStatement) {
          sa.reportError(header.returnType.location, "Return in void function.");
        }
      } else {
        if (!returnStatement) {
          sa.reportError(header.returnType.location, `No return statement found.`);
        } else {
          this._returnStatement = returnStatement;
        }
      }
      curFunctionInfo.header = undefined;
      curFunctionInfo.returnStatement = undefined;
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitFunctionDefinition(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_call)
  export class FunctionCall extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      this.type = (this.children[0] as FunctionCallGeneric).type;
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitFunctionCall(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_call_generic)
  export class FunctionCallGeneric extends ExpressionAstNode {
    fnSymbol: FnSymbol | StructSymbol | undefined;

    override init(): void {
      super.init();
      this.fnSymbol = undefined;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      const functionIdentifier = this.children[0] as FunctionIdentifier;
      if (functionIdentifier.isBuiltin) {
        this.type = functionIdentifier.ident;
      } else {
        const fnIdent = <string>functionIdentifier.ident;

        let paramSig: NonGenericGalaceanType[] | undefined;
        if (this.children.length === 4) {
          const paramList = this.children[2];
          if (paramList instanceof FunctionCallParameterList) {
            paramSig = paramList.paramSig as any;
          }
        }
        // #if _VERBOSE
        const builtinFn = BuiltinFunction.getFn(fnIdent, paramSig);
        if (builtinFn) {
          this.type = builtinFn.realReturnType;
          return;
        }
        // #endif

        const fnSymbol = sa.lookupSymbolBy(fnIdent, ESymbolType.FN, paramSig);
        if (!fnSymbol) {
          // #if _VERBOSE
          sa.reportError(this.location, `No overload function type found: ${functionIdentifier.ident}`);
          // #endif
          return;
        }
        this.type = fnSymbol?.dataType?.type;
        this.fnSymbol = fnSymbol as FnSymbol;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_call_parameter_list)
  export class FunctionCallParameterList extends TreeNode {
    get paramSig(): GalaceanDataType[] | undefined {
      if (this.children.length === 1) {
        const expr = this.children[0] as AssignmentExpression;
        if (expr.type == undefined) return [TypeAny];
        return [expr.type];
      } else {
        const list = this.children[0] as FunctionCallParameterList;
        const decl = this.children[2] as AssignmentExpression;
        if (list.paramSig == undefined || decl.type == undefined) {
          return [TypeAny];
        } else {
          return list.paramSig.concat([decl.type]);
        }
      }
    }

    get paramNodes(): AssignmentExpression[] {
      if (this.children.length === 1) {
        return [this.children[0] as AssignmentExpression];
      } else {
        const list = this.children[0] as FunctionCallParameterList;
        const decl = this.children[2] as AssignmentExpression;

        return list.paramNodes.concat([decl]);
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.precision_specifier)
  export class PrecisionSpecifier extends TreeNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      sa.shaderData.globalPrecisions.push(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.function_identifier)
  export class FunctionIdentifier extends TreeNode {
    get ident() {
      const ty = this.children[0] as TypeSpecifier;
      return ty.type;
    }

    get lexeme() {
      const ty = this.children[0] as TypeSpecifier;
      return ty.lexeme;
    }

    get isBuiltin() {
      return typeof this.ident !== "string";
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {}

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitFunctionIdentifier(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.assignment_expression)
  export class AssignmentExpression extends ExpressionAstNode {
    // #if _VERBOSE
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        const expr = this.children[0] as ConditionalExpression;
        this.type = expr.type ?? TypeAny;
      } else {
        const expr = this.children[2] as AssignmentExpression;
        this.type = expr.type ?? TypeAny;
      }
    }
    // #endif
  }

  // #if _VERBOSE
  @ASTNodeDecorator(NoneTerminal.assignment_operator)
  export class AssignmentOperator extends TreeNode {}
  // #endif

  @ASTNodeDecorator(NoneTerminal.expression)
  export class Expression extends ExpressionAstNode {
    // #if _VERBOSE
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        const expr = this.children[0] as AssignmentExpression;
        this.type = expr.type;
      } else {
        const expr = this.children[2] as AssignmentExpression;
        this.type = expr.type;
      }
    }
    // #endif
  }

  @ASTNodeDecorator(NoneTerminal.primary_expression)
  export class PrimaryExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        const id = this.children[0];
        if (id instanceof VariableIdentifier) {
          this.type = id.typeInfo ?? TypeAny;
        } else {
          switch ((<Token>id).type) {
            case ETokenType.INT_CONSTANT:
              this._type = EKeyword.INT;
              break;
            case ETokenType.FLOAT_CONSTANT:
              this.type = EKeyword.FLOAT;
              break;
            case EKeyword.TRUE:
            case EKeyword.FALSE:
              this.type = EKeyword.BOOL;
              break;
          }
        }
      } else {
        const expression = this.children[1] as Expression;
        this.type = expression.type;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.postfix_expression)
  export class PostfixExpression extends ExpressionAstNode {
    override init(): void {
      super.init();
      if (this.children.length === 1) {
        const child = this.children[0] as PrimaryExpression | FunctionCall;
        this.type = child.type;
      }
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitPostfixExpression(this);
    }
  }

  // #if _VERBOSE
  @ASTNodeDecorator(NoneTerminal.unary_operator)
  export class UnaryOperator extends TreeNode {}

  @ASTNodeDecorator(NoneTerminal.unary_expression)
  export class UnaryExpression extends ExpressionAstNode {
    override init(): void {
      this.type = (this.children[0] as PostfixExpression).type;
    }
  }

  @ASTNodeDecorator(NoneTerminal.multiplicative_expression)
  export class MultiplicativeExpression extends ExpressionAstNode {
    override init(): void {
      super.init();
      if (this.children.length === 1) {
        this.type = (this.children[0] as UnaryExpression).type;
        // TODO: Temporarily remove type deduce due to generic function type issue.
        // } else {
        //   const exp1 = this.children[0] as MultiplicativeExpression;
        //   const exp2 = this.children[2] as UnaryExpression;
        //   if (exp1.type === exp2.type) {
        //     this.type = exp1.type;
        //   }
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.additive_expression)
  export class AdditiveExpression extends ExpressionAstNode {
    override init(): void {
      super.init();
      if (this.children.length === 1) {
        this.type = (this.children[0] as MultiplicativeExpression).type;
        // TODO: Temporarily remove type deduce due to generic function type issue.
        // } else {
        //   const exp1 = this.children[0] as AdditiveExpression;
        //   const exp2 = this.children[2] as MultiplicativeExpression;
        //   if (exp1.type === exp2.type) {
        //     this.type = exp1.type;
        //   }
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.shift_expression)
  export class ShiftExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      const expr = this.children[0] as ExpressionAstNode;
      this.type = expr.type;
    }
  }

  @ASTNodeDecorator(NoneTerminal.relational_expression)
  export class RelationalExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<ShiftExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.BOOL;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.equality_expression)
  export class EqualityExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<RelationalExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.BOOL;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.and_expression)
  export class AndExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<AndExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.UINT;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.exclusive_or_expression)
  export class ExclusiveOrExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<AndExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.UINT;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.inclusive_or_expression)
  export class InclusiveOrExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<ExclusiveOrExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.UINT;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.logical_and_expression)
  export class LogicalAndExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<InclusiveOrExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.BOOL;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.logical_xor_expression)
  export class LogicalXorExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<LogicalAndExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.BOOL;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.logical_or_expression)
  export class LogicalOrExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<LogicalXorExpression>this.children[0]).type;
      } else {
        this.type = EKeyword.BOOL;
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.conditional_expression)
  export class ConditionalExpression extends ExpressionAstNode {
    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 1) {
        this.type = (<LogicalOrExpression>this.children[0]).type;
      }
    }
  }
  // #endif

  @ASTNodeDecorator(NoneTerminal.struct_specifier)
  export class StructSpecifier extends TreeNode {
    ident?: Token;

    get propList(): StructProp[] {
      const declList = (this.children.length === 6 ? this.children[3] : this.children[2]) as StructDeclarationList;
      return declList.propList;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      if (this.children.length === 6) {
        this.ident = this.children[1] as Token;
        sa.symbolTableStack.insert(new StructSymbol(this.ident.lexeme, this));
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.struct_declaration_list)
  export class StructDeclarationList extends TreeNode {
    get propList(): StructProp[] {
      if (this.children.length === 1) {
        return (<StructDeclaration>this.children[0]).propList;
      }
      const list = this.children[0] as StructDeclarationList;
      const decl = this.children[1] as StructDeclaration;
      return [list.propList, decl.propList].flat();
    }
  }

  @ASTNodeDecorator(NoneTerminal.struct_declaration)
  export class StructDeclaration extends TreeNode {
    get typeSpecifier() {
      if (this.children.length === 3) {
        return this.children[0] as TypeSpecifier;
      }
      return this.children[1] as TypeSpecifier;
    }

    get declaratorList() {
      if (this.children.length === 3) {
        return this.children[1] as StructDeclaratorList;
      }
      return this.children[2] as StructDeclaratorList;
    }

    get propList(): StructProp[] {
      const ret: StructProp[] = [];
      const firstChild = this.children[0];
      if (firstChild instanceof LayoutQualifier) {
        const typeSpecifier = this.children[1] as TypeSpecifier;
        const declarator = this.children[2] as StructDeclarator;
        const typeInfo = new SymbolType(typeSpecifier.type, typeSpecifier.lexeme);
        const prop = new StructProp(typeInfo, declarator.ident, firstChild.index);
        ret.push(prop);
      } else {
        for (let i = 0; i < this.declaratorList.declaratorList.length; i++) {
          const declarator = this.declaratorList.declaratorList[i];
          const typeInfo = new SymbolType(
            this.typeSpecifier.type,
            this.typeSpecifier.lexeme,
            declarator.arraySpecifier
          );
          const prop = new StructProp(typeInfo, declarator.ident);
          ret.push(prop);
        }
      }
      return ret;
    }
  }

  @ASTNodeDecorator(NoneTerminal.layout_qualifier)
  export class LayoutQualifier extends TreeNode {
    get index(): number {
      return Number((<BaseToken>this.children[4]).lexeme);
    }
  }

  @ASTNodeDecorator(NoneTerminal.struct_declarator_list)
  export class StructDeclaratorList extends TreeNode {
    get declaratorList(): StructDeclarator[] {
      if (this.children.length === 1) {
        return [this.children[0] as StructDeclarator];
      } else {
        const list = this.children[0] as StructDeclaratorList;
        return [...list.declaratorList, <StructDeclarator>this.children[1]];
      }
    }
  }

  @ASTNodeDecorator(NoneTerminal.struct_declarator)
  export class StructDeclarator extends TreeNode {
    get ident() {
      return this.children[0] as Token;
    }

    get arraySpecifier(): ArraySpecifier | undefined {
      return this.children[1] as ArraySpecifier;
    }
  }

  @ASTNodeDecorator(NoneTerminal.variable_declaration)
  export class VariableDeclaration extends TreeNode {
    type: FullySpecifiedType;

    override semanticAnalyze(sa: SematicAnalyzer): void {
      const children = this.children;
      const type = children[0] as FullySpecifiedType;
      const ident = children[1] as Token;
      this.type = type;
      const sm = new VarSymbol(ident.lexeme, new SymbolType(type.type, type.typeSpecifier.lexeme), true, this);

      sa.symbolTableStack.insert(sm);
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitGlobalVariableDeclaration(this) + ";";
    }
  }

  @ASTNodeDecorator(NoneTerminal.variable_declaration_list)
  export class VariableDeclarationList extends TreeNode {
    type: FullySpecifiedType;

    override semanticAnalyze(sa: SematicAnalyzer): void {
      const { children } = this;
      const length = children.length;
      const variableDeclaration = children[0] as VariableDeclaration;
      const type = variableDeclaration.type;
      this.type = type;

      if (length === 1) {
        return;
      }

      const ident = children[2] as Token;

      const newVariable = VariableDeclaration.pool.get();
      if (length === 3) {
        // variable_declaration_list ',' id
        newVariable.set(ident.location, [type, ident]);
      } else {
        // variable_declaration_list ',' id array_specifier
        newVariable.set(ident.location, [type, ident, children[3] as ArraySpecifier]);
      }
      newVariable.semanticAnalyze(sa);
    }
  }

  @ASTNodeDecorator(NoneTerminal.variable_identifier)
  export class VariableIdentifier extends TreeNode {
    symbolInfo:
      | VarSymbol
      // #if _VERBOSE
      | BuiltinVariable
      // #endif
      | null;

    get lexeme(): string {
      return (<Token>this.children[0]).lexeme;
    }

    get typeInfo(): GalaceanDataType {
      if (this.symbolInfo instanceof VarSymbol) return this.symbolInfo.dataType.type;
      return this.symbolInfo?.type;
    }

    override semanticAnalyze(sa: SematicAnalyzer): void {
      const token = this.children[0] as Token;

      // #if _VERBOSE
      const builtinVar = BuiltinVariable.getVar(token.lexeme);
      if (builtinVar) {
        this.symbolInfo = builtinVar;
        return;
      }
      // #endif

      this.symbolInfo = sa.lookupSymbolBy(token.lexeme, ESymbolType.VAR) as VarSymbol;
      // #if _VERBOSE
      if (!this.symbolInfo) {
        sa.reportError(this.location, `undeclared identifier: ${token.lexeme}`);
      }
      // #endif
    }

    override codeGen(visitor: CodeGenVisitor): string {
      return visitor.visitVariableIdentifier(this);
    }
  }

  @ASTNodeDecorator(NoneTerminal.gs_shader_program)
  export class GLShaderProgram extends TreeNode {
    shaderData: ShaderData;

    override semanticAnalyze(sa: SematicAnalyzer): void {
      this.shaderData = sa.shaderData;
      this.shaderData.symbolTable = sa.symbolTableStack._scope;
    }
  }
}
