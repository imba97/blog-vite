---
id: 780
title: Windows 安装 ZSH 踩坑记录
date: 2024-05-04 23:09:39
tags:
  - wsl
  - zsh
categories:
  - 瞎研究
---

# WSL

WSL 是适用于 Linux 的 Windows 子系统，可以在 Windows 中跑一个 Linux，常用于开发

我的使用场景只有一个，就是安装 <i icon i-simple-icons-zsh></i> `zsh` 作为 VS Code 的终端

但里面有太多的坑，目前我个人已经换回 `PowerShell` 了，以下是踩过的坑

# 安装

打开启用或关闭 Windows 功能

勾选适用于 Linux 的 Windows 子系统

重启后打开 <i icon i-fluent-store-microsoft-24-filled bg="#125697"></i> 应用商店，安装 `Ubuntu`

# 升级到 WSL 2

执行 `wsl -l -v` 查看当前安装了什么版本，我这边是 <i icon i-logos-ubuntu></i> `Ubuntu 24.04 LTS`

切换版本

```bash
wsl --set-version Ubuntu-24.04 2
```

![](/uploads/2024/05/wsl-1.png)

设置默认安装版本

```bash
wsl --set-default-version 2
```

[官方文档](https://learn.microsoft.com/zh-cn/windows/wsl/install)

# 安装 ZSH

管他有没有先更新再说

```bash
apt update && apt upgrade
```

安装 ZSH

```bash
apt install zsh
```

安装 `oh-my-zsh`

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

下面参考托 [尼老师的配置](https://github.com/antfu/dotfiles/blob/main/.zshrc)，安装主题、插件

主题是 `spaceship`

```bash
git clone https://github.com/denysdovhan/spaceship-prompt.git "$ZSH_CUSTOM/themes/spaceship-prompt" --depth=1
```

```bash
ln -s "$ZSH_CUSTOM/themes/spaceship-prompt/spaceship.zsh-theme" "$ZSH_CUSTOM/themes/spaceship.zsh-theme"
```

常用插件安装，`zsh-autosuggestions`、`zsh-syntax-highlighting`、`zsh-z`

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

```bash
git clone https://github.com/agkozak/zsh-z $ZSH_CUSTOM/plugins/zsh-z
```

# 挂载 Windows 盘符

默认是 `/mnt/c` 之类的，改成直接挂在到根目录 `/c`

后面发现其实改不改影响不是很大，姑且先记录一下

编辑

```bash
code /etc/wsl.conf
```

添加

```ini
[automount]
enabled = true
root = /
options = "metadata,umask=22,fmask=11"
mountFsTab = false
```

# 同步配置

大部分文件、文件夹的配置，例如 <span icon i-logos-git-icon></span> `.gitconfig`、<span icon i-streamline-interface-security-shield-profileshield-secure-security-profile-person></span> `.ssh`，都可以通过链接的方式同步

```bash
ln -s /c/Users/imba97/.gitconfig ~/.gitconfig
ln -s /c/Users/imba97/.ssh ~/
```

出现权限问题

```
Load key "/root/.ssh/id_rsa": bad permissions
```

设置权限解决

```bash
chmod -R 600 ~/.ssh
```

# 设置 VS Code

你可以分别设置 Windows 和 Linux 下的终端

```
"terminal.integrated.defaultProfile.windows": "Ubuntu-24.04 (WSL)",
"terminal.integrated.defaultProfile.linux": "zsh",
```

根据自己实际安装的版本，不知道的话可以先打个引号看看

![](/uploads/2024/05/wsl-2.png)

# VS Code 插件

安装 [WSL](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-wsl) 插件，可以快速切换项目等

# WSL 打开项目

先打开原项目，然后 `Ctrl + Shift + P` 打开命令中心，选择在 WSL 中重新打开文件夹

![](/uploads/2024/05/wsl-3.png)

也可以选在 WSL 中打开文件夹，然后输入 Windows 中目录地址

# 第三方包找不到

使用 WSL 打开项目后文件路径都会走 Linux 系统的，所以需要删掉原来的 `node_modules` 和 `lock` 文件，重新跑一下安装

![](/uploads/2024/05/wsl-4.png)

# Git CRLF

因为 Windows 和 Linux 换行符的不同，在 Linux 中 Git 会匹配到换行符不同，提示文件差异

![](/uploads/2024/05/wsl-5.png)

只需要设置一下 Git 配置即可

```bash
git config --global core.autocrlf true
```

![](/uploads/2024/05/wsl-6.png)

# Path 问题

默认会自动包含 Windows 的所有 <i icon i-vscode-icons-file-type-dotenv></i> 环境变量，但 `node` 比较离谱

可以使用 `node.exe` 但没法用 `node`，但很多程序比如 `npm` 默认执行的是 `node`，所以就会报 `node` 不存在

目前大概只能再在 Linux 中安装一下 `node`，也有 [官方文档](https://learn.microsoft.com/zh-cn/windows/dev-environment/javascript/nodejs-on-wsl#install-nvm-nodejs-and-npm)，是通过 `nvm` 安装

# 结束

大概先分享这么多

我是后面搞到 `GPG` 的时候，发现还需要导出公钥私钥，在从 Linux 导入 <i icon i-material-symbols-key-vertical-outline-rounded bg-orange></i> 公钥私钥，需要维护两份，就感觉很麻烦

然后感觉只为了一个 ZSH 没必要，后面感觉还有不少坑

比如我能想到的就是 <i icon i-skill-icons-electron></i> `electron` 打包的时候这种依赖环境的东西

所以就暂时弃坑了
