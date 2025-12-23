from dataclasses import dataclass
from typing import List, Optional
from .models import AlgorithmType, LanguageType, SeverityLevel


@dataclass
class RuleResult:
    hit: bool
    detail: Optional[str] = None
    lineStart: Optional[int] = None
    lineEnd: Optional[int] = None


class Rule:
    def id(self) -> str: ...
    def title(self) -> str: ...
    def description(self) -> str: ...
    def severity(self) -> SeverityLevel: ...
    def supports(self, algorithm: AlgorithmType, language: LanguageType) -> bool: ...
    def evaluate(self, algorithm: AlgorithmType, language: LanguageType, source: str) -> RuleResult: ...


class HardcodedKeyRule(Rule):
    def id(self) -> str: return "GM-HC-KEY-001"
    def title(self) -> str: return "疑似硬编码密钥/IV"
    def description(self) -> str: return "检测源码中疑似直接以常量形式传入密钥/IV"
    def severity(self) -> SeverityLevel: return SeverityLevel.HIGH
    def supports(self, algorithm: AlgorithmType, language: LanguageType) -> bool:
        return algorithm == AlgorithmType.SM4
    def evaluate(self, algorithm: AlgorithmType, language: LanguageType, source: str) -> RuleResult:
        if not source:
            return RuleResult(False)
        hit = ("SM4(" in source) and ("\"" in source or "'" in source)
        return RuleResult(True, "发现疑似硬编码密钥或IV") if hit else RuleResult(False)


class Sm4IvReuseRule(Rule):
    def id(self) -> str: return "GM-SM4-IV-REUSE-001"
    def title(self) -> str: return "SM4 CBC/CTR 模式 IV 复用风险"
    def description(self) -> str: return "检测到疑似在循环中重复使用固定IV"
    def severity(self) -> SeverityLevel: return SeverityLevel.HIGH
    def supports(self, algorithm: AlgorithmType, language: LanguageType) -> bool:
        return algorithm == AlgorithmType.SM4
    def evaluate(self, algorithm: AlgorithmType, language: LanguageType, source: str) -> RuleResult:
        if not source:
            return RuleResult(False)
        has_mode = ("CBC" in source) or ("CTR" in source)
        iv_once = ("iv =" in source) or ("IvParameterSpec(" in source)
        used_loop = ("for(" in source) or ("while(" in source)
        hit = has_mode and iv_once and used_loop
        return RuleResult(True, "可能的IV复用（循环中重复使用相同IV）") if hit else RuleResult(False)


class RuleEngine:
    def __init__(self) -> None:
        self.rules: List[Rule] = []

    def register(self, rule: Rule) -> "RuleEngine":
        self.rules.append(rule)
        return self

    def evaluate_all(self, algorithm: AlgorithmType, language: LanguageType, source: str):
        hits = []
        for r in self.rules:
            if not r.supports(algorithm, language):
                continue
            res = r.evaluate(algorithm, language, source)
            if res and res.hit:
                hits.append((r, res))
        return hits


# --- Additional GM rules ---

class Sm2KeyGenRandomnessRule(Rule):
    def id(self) -> str: return "GM-SM2-KG-RND-001"
    def title(self) -> str: return "SM2 密钥生成随机性/派生流程合规性"
    def description(self) -> str: return "检测到疑似使用不安全随机数或跳过合规派生流程"
    def severity(self) -> SeverityLevel: return SeverityLevel.HIGH
    def supports(self, algorithm: AlgorithmType, language: LanguageType) -> bool:
        return algorithm == AlgorithmType.SM2
    def evaluate(self, algorithm: AlgorithmType, language: LanguageType, source: str) -> RuleResult:
        if not source:
            return RuleResult(False)
        # 启发式：使用固定种子/Math.random/random.random、或未见安全随机接口
        insecure_patterns = ["Math.random(", "random.random(", "Random(", "seed("]
        derived_skip = ("deriveKey" not in source) and ("kdf" not in source.lower())
        hit = any(p in source for p in insecure_patterns) or derived_skip
        return RuleResult(True, "可能未使用合规的随机数或未按规范进行密钥派生") if hit else RuleResult(False)


class Sm3PaddingRule(Rule):
    def id(self) -> str: return "GM-SM3-PAD-001"
    def title(self) -> str: return "SM3 填充/消息长度编码规范性"
    def description(self) -> str: return "检测到疑似自实现SM3时未正确进行填充或长度编码"
    def severity(self) -> SeverityLevel: return SeverityLevel.MEDIUM
    def supports(self, algorithm: AlgorithmType, language: LanguageType) -> bool:
        return algorithm == AlgorithmType.SM3
    def evaluate(self, algorithm: AlgorithmType, language: LanguageType, source: str) -> RuleResult:
        if not source:
            return RuleResult(False)
        # 启发式：自实现时缺少 padding/len 关键步骤表述
        mentions_sm3 = ("SM3" in source) or ("sm3" in source.lower())
        lacks_padding = ("pad" not in source.lower()) and ("padding" not in source.lower())
        lacks_len = ("bitlen" not in source.lower()) and ("length" not in source.lower())
        hit = mentions_sm3 and (lacks_padding or lacks_len)
        return RuleResult(True, "疑似缺少SM3标准中的填充或长度编码步骤") if hit else RuleResult(False)


class Sm4ModeParamRule(Rule):
    def id(self) -> str: return "GM-SM4-MODE-001"
    def title(self) -> str: return "SM4 模式参数/IV 合规性"
    def description(self) -> str: return "检测到模式与参数可能不合法（如 ECB 明文模式或 CBC 缺失 IV）"
    def severity(self) -> SeverityLevel: return SeverityLevel.MEDIUM
    def supports(self, algorithm: AlgorithmType, language: LanguageType) -> bool:
        return algorithm == AlgorithmType.SM4
    def evaluate(self, algorithm: AlgorithmType, language: LanguageType, source: str) -> RuleResult:
        if not source:
            return RuleResult(False)
        mode_ecb = "ECB" in source
        mode_cbc = "CBC" in source and ("IvParameterSpec(" not in source and "iv=" not in source.lower())
        hit = mode_ecb or mode_cbc
        if mode_ecb:
            return RuleResult(True, "不建议使用ECB模式，存在明文结构泄露风险")
        if mode_cbc:
            return RuleResult(True, "CBC模式下未检测到IV初始化或传入，可能不合规")
        return RuleResult(False)


