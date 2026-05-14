---
id: 693
title: Unity VSCode 代码自动补全失效解决方法
date: 2020-08-21 12:17:56
tags:
  - Unity 3D
  - VSCode
  - 自动补全
categories:
  - 笔记
---

# 问题说明

最开始我新建了一个项目A，不知道设置了什么，这个是有自动补全的。之后又建了几个项目，发现自动补全都失效。

<!--more-->

# 搜到的解决方法

网上各种解决方法，比如更改`Assembly-CSharp.csproj`中的`TargetFrameworkVersion`，与自己电脑的`.NET Framework`版本保持一致，可惜我这里依然不生效。

还有什么下载`TargetFrameworkVersion`写的`.NET Framework`版本，我下载安装提示已安装更高版本，不让安装

与我的解决方法比较接近的是在VsCode按`Ctrl + Shift + P`输入`OmniSharp: select project`，选择项目文件

# 我的解决流程

通过文件对比，可以看出项目A的`.sln`文件要多几行内容

![](/uploads/2020/08/unity-vscode-1.png)

**第一段不同**

```
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Assembly-CSharp", "Assembly-CSharp.csproj", "{152411fb-37df-f0ff-193c-c41c1f943a0d}"
EndProject
```

`{}`里面那些字符串叫Guid（全球唯一标识），`FAE04EC0-301F-11D3-BF4B-00C04F79EFBC`表示这个项目是`Windows (C#)`项目

后面的Guid都是项目的Guid，在项目文件夹中的`Assembly-CSharp.csproj`，我们能找到一行配置

```
<ProjectGuid>{152411fb-37df-f0ff-193c-c41c1f943a0d}</ProjectGuid>
```

**第二三段不同**

这个应该是一些Debug配置，具体我没细研究，有兴趣可以自行搜索`.sln`文件的配置项都是干什么的

# 解决方法

如果你的`.sln`文件没有上面所说的这几行，那么问题应该就出在这

## 第一步

复制以下代码，把项目Guid改成你项目的Guid。第一段中的`Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}")`这个Guid应该可以不变。

```
Microsoft Visual Studio Solution File, Format Version 11.00
# Visual Studio 2010
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Assembly-CSharp", "Assembly-CSharp.csproj", "{152411fb-37df-f0ff-193c-c41c1f943a0d}"
EndProject
Global
  GlobalSection(SolutionConfigurationPlatforms) = preSolution
    Debug|Any CPU = Debug|Any CPU
  EndGlobalSection
  GlobalSection(ProjectConfigurationPlatforms) = postSolution
    {152411fb-37df-f0ff-193c-c41c1f943a0d}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
    {152411fb-37df-f0ff-193c-c41c1f943a0d}.Debug|Any CPU.Build.0 = Debug|Any CPU
  EndGlobalSection
  GlobalSection(SolutionProperties) = preSolution
    HideSolutionNode = FALSE
  EndGlobalSection
EndGlobal
```

两个文件的图

![](/uploads/2020/08/unity-vscode-2.png)

## 第二步

来到VsCode，按`Ctrl + Shift + P`输入`OmniSharp: select project`

选择项目`.sln`文件，回车

![](/uploads/2020/08/unity-vscode-3.png)

等一会后你会发现VsCode左下角出现`.sln`文件名，这样就可以了

![](/uploads/2020/08/unity-vscode-4.png)

---

# 参考

> [《Visual Studio 使用的 ProjectTypeGuids》](https://www.cnblogs.com/zealic/archive/2009/06/25/1511039.html)
> [文本对比工具](http://www.jq22.com/textDifference)
