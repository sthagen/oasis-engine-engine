import { EKeyword, ETokenType, ShaderRange } from "../common";
import { ASTNode, TreeNode } from "../parser/AST";
import { TranslationRule } from "../parser/SemanticAnalyzer";
import { ENonTerminal, GrammarSymbol } from "../parser/GrammarSymbol";
import Production from "./Production";
import { ActionInfo, EAction } from "./types";
import { ShaderLab } from "../ShaderLab";
import { ShaderLabObjectPool } from "../ShaderLabObjectPool";
import { IPoolElement } from "@galacean/engine";
import { NodeChild } from "../parser/types";

export default class GrammarUtils {
  static isTerminal(sm: GrammarSymbol) {
    return sm < ENonTerminal.START;
  }

  static toString(sm: GrammarSymbol) {
    if (this.isTerminal(sm)) {
      return ETokenType[sm] ?? EKeyword[sm];
    }
    return ENonTerminal[sm];
  }

  static createProductionWithOptions(
    goal: ENonTerminal,
    options: GrammarSymbol[][],
    /** the ast node */
    // astType?: ASTNodeConstructor
    astTypePool?: ShaderLabObjectPool<
      { set: (loc: ShaderRange, children: NodeChild[]) => void } & IPoolElement & TreeNode
    >
  ) {
    const ret: [GrammarSymbol[], TranslationRule | undefined][] = [];
    for (const opt of options) {
      ret.push([
        [goal, ...opt],
        function (sa, ...children) {
          if (!children[0]) return;
          const start = children[0].location.start;
          const end = children[children.length - 1].location.end;
          const location = ShaderLab.createRange(start, end);
          ASTNode.get(astTypePool ?? ASTNode.TrivialNode.pool, sa, location, children);
        }
      ]);
    }
    return ret;
  }

  static createProductionOptions(common: GrammarSymbol[], position: number, opts: GrammarSymbol[][]) {
    const ret: GrammarSymbol[][] = [];
    for (const opt of opts) {
      const list = common.slice(0, position);
      list.push(...opt);
      list.push(...common.slice(position));
      ret.push(list);
    }
    return ret;
  }

  static addMapSetItem<K, T>(map: Map<K, Set<T>>, k: K, v: T) {
    const set = map.get(k) ?? new Set();
    set.add(v);
    map.set(k, set);
  }

  static isSubSet<T>(sa: Set<T>, sb: Set<T>) {
    for (const item of sa) {
      if (!sb.has(item)) return false;
    }
    return true;
  }

  static isActionEqual(a: ActionInfo, b: ActionInfo) {
    return a.action === b.action && a.target === b.target;
  }

  static printAction(actionInfo: ActionInfo) {
    return `<Action: ${EAction[actionInfo.action]} -> ${
      actionInfo.action === EAction.Reduce ? Production.pool.get(actionInfo.target!) : `State ${actionInfo.target!}`
    }>`;
  }

  static printProduction(production: Production) {
    const deriv = production.derivation.map((gs) => GrammarUtils.toString(gs)).join("|");
    return `${ENonTerminal[production.goal]} :=> ${deriv}`;
  }
}
