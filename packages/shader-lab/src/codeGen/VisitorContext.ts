import { Logger } from "@galacean/engine";
import { EShaderStage } from "../common/Enums";
import { ASTNode } from "../parser/AST";
import { ESymbolType, SymbolTable, SymbolInfo } from "../parser/symbolTable";
import { IParamInfo } from "../parser/types";

export class VisitorContext {
  private static _singleton: VisitorContext;
  static get context() {
    return this._singleton;
  }

  static reset() {
    if (!this._singleton) {
      this._singleton = new VisitorContext();
    }
    this._singleton.reset();
  }

  attributeList: IParamInfo[] = [];
  attributeStructs: ASTNode.StructSpecifier[] = [];
  varyingStruct?: ASTNode.StructSpecifier;

  stage: EShaderStage;

  _referencedAttributeList: Record<string, IParamInfo & { qualifier?: string }> = Object.create(null);
  _referencedGlobals: Record<string, SymbolInfo | ASTNode.PrecisionSpecifier> = Object.create(null);
  _referencedVaryingList: Record<string, IParamInfo & { qualifier?: string }> = Object.create(null);

  _curFn?: ASTNode.FunctionProtoType;

  _passSymbolTable: SymbolTable;
  get passSymbolTable() {
    return this._passSymbolTable;
  }

  private constructor() {}

  reset() {
    this.attributeList.length = 0;
    this.attributeStructs.length = 0;
    this._referencedAttributeList = Object.create(null);
    this._referencedGlobals = Object.create(null);
    this._referencedVaryingList = Object.create(null);
  }

  isAttributeStruct(type: string) {
    return this.attributeStructs.findIndex((item) => item.ident!.lexeme === type) !== -1;
  }

  isVaryingStruct(type: string) {
    return this.varyingStruct?.ident?.lexeme === type;
  }

  referenceAttribute(ident: string) {
    if (this._referencedAttributeList[ident]) return;

    const prop = this.attributeList.find((item) => item.ident.lexeme === ident);
    if (!prop) {
      Logger.error("referenced attribute not found:", ident);
      return;
    }
    this._referencedAttributeList[ident] = prop;
  }

  referenceVarying(ident: string) {
    if (this._referencedVaryingList[ident]) return;

    const prop = this.varyingStruct?.propList.find((item) => item.ident.lexeme === ident);
    if (!prop) {
      Logger.error("referenced varying not found:", ident);
      return;
    }
    this._referencedVaryingList[ident] = prop;
  }

  referenceGlobal(ident: string, type: ESymbolType) {
    if (this._referencedGlobals[ident]) return;

    if (type === ESymbolType.FN) {
      const fnEntries = this._passSymbolTable.getAllFnSymbols(ident);
      for (let i = 0; i < fnEntries.length; i++) {
        const key = i === 0 ? ident : ident + i;
        this._referencedGlobals[key] = fnEntries[i];
      }
      return;
    }
    const sm = this.passSymbolTable.lookup({ ident, symbolType: type });
    if (sm) {
      this._referencedGlobals[ident] = sm;
    }
  }
}
