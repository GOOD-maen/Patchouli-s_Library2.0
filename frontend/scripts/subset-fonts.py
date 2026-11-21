#!/usr/bin/env python3
"""
构建前自动生成字体子集。

为什么需要它：
    中文字体动辄 10 MB，但页面实际只用到几百个字。
    把字体裁成"只含用到的字形"，体积能降两个数量级（9.85 MB -> 178 KB）。

运行方式：
    npm run build          # 由 prebuild 钩子自动调用
    npm run font:subset    # 手动跑一次
    python scripts/subset-fonts.py

设计要点：
    1. 缓存：字符集没变化就跳过，避免每次 build 都重跑（woff2 压缩较慢）
    2. 容错：缺少 fontTools 时只告警、不失败，因为子集文件已提交到仓库，
       没装 Python 的人照样能 build
"""

from __future__ import annotations

import hashlib
import json
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
CACHE_FILE = os.path.join(ROOT, "scripts", ".font-cache.json")

# ---- 字体配置：src 是源文件，out 是产物，unicode 为 None 表示"按源码字符集裁" ----
FONTS = [
    {
        "name": "中文正文/UI",
        "src": os.path.join(SRC, "assets", "fonts", "WDXL_Lubrifont_SC", "WDXLLubrifontSC-Regular.ttf"),
        "out": os.path.join(SRC, "assets", "fonts", "WDXL_Lubrifont_SC", "WDXLLubrifontSC-subset.woff2"),
        "unicode": None,  # 用源码里出现过的字符
    },
    {
        "name": "英文像素体",
        "src": os.path.join(SRC, "assets", "fonts", "Bitcount_Single", "BitcountSingle-VariableFont.ttf"),
        "out": os.path.join(SRC, "assets", "fonts", "Bitcount_Single", "BitcountSingle-subset.woff2"),
        "unicode": "U+0020-007E,U+00A0-00FF,U+3000-303F,U+FF00-FFEF",
    },
]

EXTS = (".tsx", ".ts", ".css", ".html")
# 无论源码里有没有，这些字符都必须保留
EXTRA_CHARS = "，。！？、；：“”‘’（）《》【】…—·～￥%&*+=/<>\\|@#$^_`{}[]~　"


def collect_chars() -> str:
    """扫描 src 下所有源码文件，返回去重排序后的字符集。"""
    chars = set(EXTRA_CHARS)
    chars |= {chr(c) for c in range(0x20, 0x7F)}  # 基础 ASCII
    scanned = 0
    for root, _dirs, files in os.walk(SRC):
        for name in files:
            if name.endswith(EXTS):
                scanned += 1
                try:
                    with open(os.path.join(root, name), encoding="utf-8") as fh:
                        chars |= set(fh.read())
                except (UnicodeDecodeError, OSError):
                    pass
    print(f"[font] 扫描 {scanned} 个源文件，字符集 {len(chars)} 个")
    return "".join(sorted(chars))


def load_cache() -> dict:
    try:
        with open(CACHE_FILE, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def save_cache(cache: dict) -> None:
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as fh:
            json.dump(cache, fh, ensure_ascii=False, indent=2)
    except OSError:
        pass


def main() -> int:
    try:
        import fontTools  # noqa: F401
        import brotli  # noqa: F401
    except ImportError:
        print("[font] 未安装 fontTools/brotli，跳过子集生成（沿用已有文件）")
        print("[font] 安装命令: pip install fonttools brotli")
        return 0

    text = collect_chars()
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
    cache = load_cache()

    chars_tmp = os.path.join(ROOT, "scripts", ".chars.txt")
    with open(chars_tmp, "w", encoding="utf-8") as fh:
        fh.write(text)

    produced = []
    for font in FONTS:
        src, out = font["src"], font["out"]
        key = os.path.basename(out)

        if not os.path.exists(src):
            print(f"[font] 跳过 {key}：源文件不存在")
            continue

        # 字符集 + unicode 范围一起参与缓存键
        cache_key = digest + "|" + (font["unicode"] or "SRC")
        if cache.get(key) == cache_key and os.path.exists(out):
            print(f"[font] {key} 未变化，跳过（{os.path.getsize(out) / 1024:.1f} KB）")
            produced.append(out)
            continue

        cmd = [sys.executable, "-m", "fontTools.subset", src,
               "--flavor=woff2",
               "--layout-features=*",
               "--no-hinting",
               "--desubroutinize",
               "--output-file=" + out]
        if font["unicode"]:
            cmd.append("--unicodes=" + font["unicode"])
        else:
            cmd.append("--text-file=" + chars_tmp)

        print(f"[font] 生成 {key} ...")
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"[font] 失败：{result.stderr.strip()[:400]}")
            continue

        cache[key] = cache_key
        size_kb = os.path.getsize(out) / 1024
        src_kb = os.path.getsize(src) / 1024
        print(f"[font] {key}: {src_kb:.1f} KB -> {size_kb:.1f} KB "
              f"（压缩到 {size_kb / src_kb * 100:.1f}%）")
        produced.append(out)

    save_cache(cache)
    if os.path.exists(chars_tmp):
        os.remove(chars_tmp)
    print(f"[font] 完成，共 {len(produced)} 个子集文件")
    return 0


if __name__ == "__main__":
    sys.exit(main())
