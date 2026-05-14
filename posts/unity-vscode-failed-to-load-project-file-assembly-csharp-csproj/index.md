---
id: 705
title: Unity VSCode 报错 Failed to load project file Assembly-CSharp.csproj
date: 2020-08-26 02:32:29
tags:
  - Unity 3D
  - VSCode
categories:
  - 笔记
---

这次文章探讨一个报错：

```bash
[fail]: OmniSharp.MSBuild.ProjectManager

Failed to load project file 'e:\Project\Assembly-CSharp.csproj'

The reference assemblies for .NETFramework,Version=v4.7.1 were not found. To resolve this, install the Developer Pack (SDK/Targeting Pack) for this framework version or retarget your application. You can download .NET Framework Developer Packs at https://aka.ms/msbuild/developerpacks
```

<!--more-->

# 原因

重装了系统，所有东西都重新下了，Unity的安装位置也变了

虽然`Assembly-CSharp.csproj`中有配置路径，但最后发现问题并不是路径问题

```
<Reference Include="UnityEngine.AIModule">
  <HintPath>E:/Unity/2020.1.1f1c1/Editor/Data/Managed/UnityEngine/UnityEngine.AIModule.dll</HintPath>
</Reference>
<Reference Include="UnityEngine.ARModule">
  <HintPath>E:/Unity/2020.1.1f1c1/Editor/Data/Managed/UnityEngine/UnityEngine.ARModule.dll</HintPath>
</Reference>
```

# 解决

## 报错问题

其实提示里就说了，没找到`.NETFramework,Version=v4.7.1`，你可以在 [https://aka.ms/msbuild/developerpacks](https://aka.ms/msbuild/developerpacks) 下载对应的版本

但注意这里必须下载`Runtime`，或者是`Runtime`和`Developer Pack`两个都需要，我最开始只下了`Developer Pack`，结果没用，可能`Developer Pack`只是一个开发包，这个开发包还是要基于`Runtime`的

## 路径问题

如果你换了Unity路径，也要解决的，不然你会看到满屏红

![](/uploads/2020/08/failed-to-load-project-file-assembly-csharp-1.png)

因为`C#`需要的一些引用丢失了，找不到位置所以就报错了

解决方法很简单，重新生成一下项目文件就好

依次点击

`Edit`->`Preferences...`->`External Tools`->`Regenerate project files`

就OK了
