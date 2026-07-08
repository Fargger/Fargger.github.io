---
title: 我遇到的 WSL 各类网络问题
description: WSL 真的好用吗？
pubDate: 2026-02-28 23:17:50
draft: false
---

2026/04/24 更新：
WSL 网络环境真的槽点太多了。我决定以后把遇到的每一个问题都记录在这。  

> [!TIP]
> 本文作为笔记，大部分解决办法来自他人的 Blog 或 AI 生成。

若无特别说明，本机使用的环境为：

- WSL2
- Windows 版的 Clash Verge 配置代理

# 用户环境变量不同导致代理未正确配置

## 问题描述

在开启 Mirrored 模式的 WSL 中，执行 `apt update` 成功，但是 `sudo apt update` 却出现了 DNS 解析问题。

## 解决办法

使用 `-E` 选项，强制 `sudo` 保留当前的环境变量：

```shell
sudo -E apt update
```

## 分析

在 Linux 中，不同用户的环境变量是不同的。

查看 `root` 用户 / 当前用户 的环境变量：

```shell
sudo env | grep -i proxy # root
env | grep -i proxy # 当前用户
```

- `env` 显示环境变量。
- `grep -i` 忽略大小写进行正则表达式匹配。

其中，第一条命令**没有输出**；第二条命令输出了 Windows 中配置的系统代理端口：

```text
huarun@laptop-huarun233:~$ env | grep -i proxy
no_proxy=192.168.*,172.31.*,172.30.*,172.29.*,172.28.*,172.27.*,172.26.*,172.25.*,172.24.*,172.23.*,172.22.*,172.21.*,172.20.*,172.19.*,172.18.*,172.17.*,172.16.*,10.*,127.*,localhost
https_proxy=http://127.0.0.1:7897
NO_PROXY=192.168.*,172.31.*,172.30.*,172.29.*,172.28.*,172.27.*,172.26.*,172.25.*,172.24.*,172.23.*,172.22.*,172.21.*,172.20.*,172.19.*,172.18.*,172.17.*,172.16.*,10.*,127.*,localhost
HTTPS_PROXY=http://127.0.0.1:7897
HTTP_PROXY=http://127.0.0.1:7897
http_proxy=http://127.0.0.1:7897
```

所以原因在于：没有为 `root`用户设置代理。使用 `-E` 选项让 `sudo` 继承当前用户的环境变量即可。


# 校园网下，MTU 较小导致 SSL 连接错误，无法拉取 Github Repo

## 问题描述

环境：Clash Verge TUN 模式全局代理
在学校连校园网，拉取 Github Repo 时，显示 SSL 连接超时：

```shell
huarun@laptop-huarun233:~/huarun233/Projects/ObsidianPlugin/.obsidian/plugins$ git clone https://github.com/obsidianmd/obsidian-sample-plugin.git
Cloning into 'obsidian-sample-plugin'...
fatal: unable to access 'https://github.com/obsidianmd/obsidian-sample-plugin.git/': SSL connection timeout
```

## 解决办法

查看网卡名称：

```shell
ip addr
```

通常是 `eth0`，可以看到此时 MTU 是 9000 :

```
9: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 9000 qdisc mq state UP group default qlen 1000
    link/ether 00:15:5d:42:6e:52 brd ff:ff:ff:ff:ff:ff
    inet 198.18.0.1/30 brd 198.18.0.3 scope global noprefixroute eth0
       valid_lft forever preferred_lft forever
```

临时更改 MTU 为 `1400`（**重启 Shell 后需重新更改**）：

```shell
sudo ip link set dev eth0 mtu 1400
```

## 分析

> [!TIP]
> 以下分析由 Gemini 生成。
### 1. 为什么 MTU 9000 会导致失败？

**MTU (Maximum Transmission Unit，最大传输单元)** 决定了一个数据包在不被拆分的情况下，能通过网络接口的最大字节数。

- **标准互联网 MTU 为 1500：** 全球绝大多数路由器和骨干网的最大承载能力就是 1500 字节。
    
- **WSL 的 eth0 设置为 9000：** 你的 WSL 认为它可以一次性发送 9000 字节的巨型包（Jumbo Frames）。
    
- **黑洞效应 (PMTUD Failure)：** 当 WSL 发出一个大的加密数据包（比如 3000 字节）去连接 GitHub 时，由于校园网或运营商的路由器只能处理 1500 字节，它们理应要求 WSL “把包拆小”。但出于安全或配置原因，这些路由器往往会直接**丢弃 (Drop)** 掉超大的包且不发回任何通知。
    
- **结果：** 你的 WSL 一直在等回复，直到超时报错 `SSL connection timeout`。


### 2. 为什么发生在 SSL/TLS 阶段？

你可能会发现 `ping` 或者简单的网页访问是正常的，唯独 `git clone`（即 HTTPS）报错。这是因为：

- **握手包很大：** 在 **TLS 握手 (TLS Handshake)** 过程中，服务器会发送包含**证书链 (Certificate Chain)** 的数据包，这些包通常很大（轻松超过 2000 字节）。
    
- **HTTPS 依赖完整性：** 如果证书包因为 MTU 过大在校园网出口被拦截，握手就无法完成，连接直接卡死。而简单的 HTTP 请求或 Ping 包通常很小（小于 1500），所以能通过。
    

### 3. 这和校园网有关系吗？

**非常有关系。** 校园网通常比普通的家用宽带更复杂：

1. **多层封装 (Encapsulation)：** 校园网经常使用 **认证系统 (Portal/802.1X)** 或 **VPN/隧道技术 (GRE/IPsec)** 将流量转发到校园网核心。这些技术会在原始数据包外“套一层皮”，这层皮会占用大约 20~60 字节的空间。
    
2. **可用空间减小：** 如果物理链路是 1500，套上一层 40 字节的皮，剩下的有效载荷就只有 **1460** 了。
    
3. **WSL 的误判：** 你的 WSL 显示 `eth0` 是 9000，这通常是因为 **WSL2 的虚拟交换机 (Hyper-V Virtual Switch)** 为了性能默认开启了巨型帧支持。但在复杂的校园网环境下，这种“自以为是”的高性能设置直接导致了数据包撞墙。


# 使用 Windows 版 VSCode 远程连接 WSL 目录时，REST Client 无法向 localhost 发送请求

Web 开发要用到 REST Client 做 CRUD.