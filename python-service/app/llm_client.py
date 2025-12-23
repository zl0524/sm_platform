import os
import requests
from typing import Optional


class LLMClient:
    """
    DeepSeek 客户端（默认使用 DeepSeek OpenAI 兼容接口）。
    环境变量：
      LLM_API_KEY  = 必填，DeepSeek API Key
      LLM_BASE_URL = 可选，默认 https://api.deepseek.com
      LLM_MODEL    = 可选，默认 deepseek-chat
    """

    def __init__(self) -> None:
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.base_url = os.getenv("LLM_BASE_URL", "https://api.deepseek.com")
        self.model = os.getenv("LLM_MODEL", "deepseek-chat")

    def chat(self, prompt: str, system: Optional[str] = None) -> str:
        if not self.api_key:
            return "[LLM disabled: missing API key]"
        return self._call_openai_compatible(prompt, system)

    def _call_openai_compatible(self, prompt: str, system: Optional[str]) -> str:
        base = self.base_url
        model = self.model
        url = f"{base}/v1/chat/completions"
        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        body = {
            "model": model,
            "messages": ([{"role": "system", "content": system}] if system else []) +
                        [{"role": "user", "content": prompt}],
            "temperature": 0.2,
        }
        try:
            resp = requests.post(url, json=body, headers=headers, timeout=30)
            resp.raise_for_status()
            data = resp.json()
            return data.get("choices", [{}])[0].get("message", {}).get("content", "") or ""
        except Exception as e:
            return f"[LLM error] {e}"


