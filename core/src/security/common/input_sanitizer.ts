export type SanitizationRule = {
  name: string;
  pattern: RegExp;
  replaceWith: string;
};

export class InputSanitizer {
  private rules: SanitizationRule[] = [];

  constructor(initialRules?: SanitizationRule[]) {
    if (initialRules) {
      this.rules = initialRules;
    }
  }

  addRule(rule: SanitizationRule) {
    this.rules.push(rule);
  }

  injectRules(...rules: SanitizationRule[]) {
    this.rules.concat(rules);
  }

  sanitize(input: string): string {
    let sanitized = input;
    for (const rule of this.rules) {
      sanitized = sanitized.replace(rule.pattern, rule.replaceWith);
    }
    return sanitized;
  }

  clearRules() {
    this.rules = [];
  }

  listRules(): SanitizationRule[] {
    return [...this.rules];
  }
}
