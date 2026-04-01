---
title: CCSSSC2026 赛后复现
description: Misc & Web
pubDate: 2026-03-19 15:20:51
draft: false
---

打了软件系统安全赛的初赛，成功爆零。现在跟着师兄师姐的思路复线一遍。


## 2 ThymeLeaf

[Thymeleaf SSTI漏洞分析-先知社区](https://xz.aliyun.com/news/9962)

### 密码生成逻辑

项目结构：
- config
- controller
- model
- repository
- service
	- PseudoRandomGenerator - 伪随机数生成器
		- 
	- randomService
	- UserService
- PRNGCtfApplication


## 3 Auth



## 8 steganography

### 赛后复现

使用 PowerShell 7 内置的 Format-Hex 工具，查看该文件的前 48 个字节：

```powershell
Format-Hex -Path ./ste* -Count 48
```

发现 PNG 头 `89 50 4E 47 0D 0A 1A 0A`. 用 Python 尝试删除 PNG 头前面的内容：

```python
def deletePreHex(inputPath, outputPath):
    with open(inputPath, 'rb') as f:
        content = f.read()

    for i, c in enumerate(content):
        if c == 0x89:
            pngHeaderIdx = i
            break
    print(f"Find PNG header at byte {i}.")
    editedContent = content[pngHeaderIdx:]

    with open(outputPath, 'wb') as f:
        f.write(editedContent)

if __name__ == '__main__':
    deletePreHex('./steganography_challenge', './edited_png_.png')
```



得到图像的一部分：

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026edited_png_.png">

binwalk 扫一下，发现在文件偏移量为 41 的位置，有一个 **Zlib 压缩数据块**。
（在 win 和 wsl 之间切换真麻烦啊qaq）

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260315172826.png">

[各种文件类型及文件头标识大全（十六进制） - 知乎](https://zhuanlan.zhihu.com/p/571208394)

[zsteg](https://github.com/zed-0xff/zsteg) 扫一下文件：

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260315220127.png">

输出看不懂，引用一下 AI 对项目 Github 页面的总结：

> [!Gemini]
> # 🧩 zsteg 输出结构快速理解
> 
> zsteg 会尝试从 PNG 的像素数据中，以不同方式提取隐藏信息，例如：
> 
> - **b1 / b2 / b4**：每像素使用 1、2、4 bit 的最低位（LSB）或最高位（MSB）
  >   
> - **r / g / b / rgb / bgr**：使用红、绿、蓝通道或组合
   > 
> - **lsb / msb**：最低有效位 / 最高有效位
>     
> - **xy**：按像素顺序扫描
  >  
> - **text / file**：尝试解析为文本或文件头
> 
> 你给出的输出中，每一行都是一种“提取方式 + 解析结果”。

发现文件头疑似 `.7z` 的魔数，尝试修改成 `37 7a bc af 27 1c`，得到 `layer2.png`：
（居然是瞪眼法吗）

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026layer2.png">

再 zsteg 扫一下，输出和前面一样。尝试提取 RGB 通道的 1-bit LSB 隐写数据：

```bash
zsteg -e b1,rgb,lsb,xy ./layer2.png > layer2.zip
```

尝试解压，显示非压缩包。和之前思路一样，再看看文件头：

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260315225821.png">

发现 `.zip` 的文件头 `50 4b 03 04`，但不在第 0-3 个字节。尝试用前面的脚本删除 `.zip` 头前的 byte，成功解压出七个文件：

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260315230320.png">

ZipCracker

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260315231221.png">

`pass1` - `pass6` 的内容为：

```
pass is c1!xxtLf%fXYPkaA
```

根据密码解压 `flag.zip`，得到这玩意儿；观察其结构，只有 `e2 80 8b` 和 `e2 80 8c` 两种组合；询问 AI 得知是 **零宽字符**。[ 零宽间隔 (U+200B) 符号含义](https://symbl.cc/cn/200B/)

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260315231818.png">

不妨设想其是 0 和 1 的映射，写脚本解码：

```python
with open("./flag.txt", "r", encoding="utf-8") as f:
    content = f.read()
    valid_content = content[12:]

mapping = {"\u200b": 0, "\u200c": 1}
result = 0

for b in valid_content:
    result = (result << 1) + mapping[b]

print(result.to_bytes(result.bit_length() // 8)
```

但是 interpreter 报错：

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260317130736.png">

需要考虑 **位溢出**。介绍一个技巧，对 `bit_length()` +7 （官方文档中也有介绍[Python 3.14.3 documentation](https://docs.python.org/3/library/stdtypes.html#int.to_bytes)），即可输出正确的 Flag：

<img src="https://huarunblogimagehost.blob.core.windows.net/imagehost/posts/006CCSSSC2026Pasted%20image%2020260317131727.png">
