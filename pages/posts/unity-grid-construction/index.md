---
id: 720
title: Unity 网格建造
date: 2020-11-22 19:00:05
tags:
  - Unity 3D
  - 建造
  - 网格
categories:
  - 个人项目
---

# 网格建造

游戏中常见的建造方式，目前在做的游戏中需要。

但搜出来的教程比较少，我又是个英文盲，没找到合适的方法，于是瞎研究了一个，说实话也挺简单的。

整体感觉还行，演示：

![](/uploads/2020/11/unity-grid-build-1.gif)

<!--more-->

# 教程

## 变量

先定义几个变量

```csharp
// 建筑的大小
public Vector2 buildSize;

// 建造区域起始点
public Vector2 startPoint;

// 可建造区域大小
public Vector2 buildArea;

// 建造指示器（变红变绿的那个东西，这个是左上角的那一个方块）
private GameObject buildObj;

// 当前建造指示器的位置
private Vector3 curPosition;

// 允许建造区域，外层字典是 X 内层是 Y
// 这里之前我用的是 Vector2 当作字典的 Key
// 但效率会不会有问题，不太懂，索性改成两层字典
private Dictionary<float, Dictionary<float, bool>> allowBuildArea = new Dictionary<float, Dictionary<float, bool>>();

// 是否允许建造
private bool allowBuild = false;
```

## 创建网格

首先根据 可建造区域大小 和 可建造区域起始点 创建网格，放到允许建造区域字典中

```csharp
private void Start()
{
  // 构造网格
  for (int gridX = Mathf.CeilToInt(this.startPoint.x); gridX < this.startPoint.x + this.buildArea.x; gridX++)
  {

    for (int gridY = Mathf.CeilToInt(this.startPoint.y); gridY < this.startPoint.y + this.buildArea.y; gridY++)
    {
      // 没有内层字典则创建
      if (!this.allowBuildArea.ContainsKey(gridX))
      {
        this.allowBuildArea.Add(gridX, new Dictionary<float, bool>());
      }
      // 把坐标加进去
      this.allowBuildArea[gridX].Add(gridY, true);
    }

  }
}
```

## 建造指示器

然后是创建建造指示器，也就是红绿的方块，标识该坐标是否允许建造。

我这里是先创建一个放在左上角，其他会作为它的子级被创建。

```csharp
private void CreateBuildIndicator()
{
  // 建筑大小指示的父级（左上角那个方块）
  this.buildObj = GameObject.CreatePrimitive(PrimitiveType.Cube);
  this.buildObj.transform.localScale = new Vector3(1, 0.1f, 1);
  // 设置 layer，后面发射射线时会把 Build 这一层过滤掉
  this.buildObj.layer = LayerMask.NameToLayer("Build");
  buildGroup.Add(this.buildObj);
  // 这里是修改材质球可以设置透明度
  // 参考教程：https://www.cnblogs.com/chinarbolg/p/9601428.html
  SetTransparent(ScriptObjectPool<MeshRenderer>.Instance.GetComponent(this.buildObj).material);

  // 根据建筑大小 创建子级
  for (int buildX = 0; buildX < this.buildSize.x; buildX++)
  {

    for (int buildY = 0; buildY > -this.buildSize.y; buildY--)
    {
      // 0,0 位置是父级 所以不必创建
      if (buildX == 0 && buildY == 0) continue;

      // 创建子级 后面的设置基本跟父级一样
      GameObject buildChildren = GameObject.CreatePrimitive(PrimitiveType.Cube);
      buildChildren.transform.SetParent(this.buildObj.transform);
      buildChildren.transform.localScale = Vector3.one;
      buildChildren.transform.position = new Vector3(buildX, this.buildObj.transform.position.y, buildY);
      buildChildren.layer = LayerMask.NameToLayer("Build");
      SetTransparent(ScriptObjectPool<MeshRenderer>.Instance.GetComponent(buildChildren).material);

      buildGroup.Add(buildChildren);
    }
  }
}
```

## 发射射线

然后是发射射线，让建造指示器跟随鼠标

这一步可以直接在 Update() 里做，我这里是放到了一个循环计时器中

为了测试方便，我直接改成了右键创建建造指示器，左键建造

```csharp
void Update()
{
  // 左键 && 允许建造
  if (Input.GetMouseButtonDown(0) && this.allowBuild)
  {
    Build();
  }
  // 右键
  if (Input.GetMouseButtonDown(1))
  {
    if (this.buildObj != null) return;
    // 创建建造指示器（就是上面那个方法）
    CreateBuildIndicator();
    // 开启循环计时器
    GameUtil.Instance.SetInterval((intervalID) =>
    {
      // 如果建筑指示器为空 则清除当前计时器
      if (this.buildObj == null)
      {
        GameUtil.Instance.RemoveInterval(intervalID);
        return;
      }
      // 鼠标位置的射线
      Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
      RaycastHit hit;
      // 发射射线，过滤掉 Build 层
      if (Physics.Raycast(ray, out hit, Mathf.Infinity, ~(1 << LayerMask.NameToLayer("Build"))))
      {
        // 让建造指示器的父级移动到鼠标左上角（让鼠标大致处于整个指示器中心）
        this.buildObj.transform.position = new Vector3(Mathf.Round(hit.point.x - this.buildSize.x / 2), hit.point.y + 0.1f, Mathf.Round(hit.point.z + this.buildSize.y / 2));
        // 如果上次保存的 当前位置 与 本次位置不相等 说明位置变了
        if (this.curPosition != this.buildObj.transform.position)
        {
          // 更新位置
          this.curPosition = this.buildObj.transform.position;
          // 调用位置改变的方法
          OnPositionChanged();
        }

      }

    }, 0.03f);

  }
}

// 当位置改变
private void OnPositionChanged()
{
  // 先允许建造
  this.allowBuild = true;

  // 循环建筑块
  foreach (var buildBlock in buildGroup)
  {
    Vector3 position = buildBlock.transform.position;
    // 判断当前格是否在可建造区域内 并且 该格是可建造的
    if (
      this.allowBuildArea.ContainsKey(position.x)
      && this.allowBuildArea[position.x].ContainsKey(position.z)
      && this.allowBuildArea[position.x][position.z] == true
    )
    {
      // 可建造 变成绿色
      // 这句代码等价于 buildBlock.GetComponent<MeshRenderer>().material......
      ScriptObjectPool<MeshRenderer>.Instance.GetComponent(buildBlock).material.color = new Color(0.1f, 1, 0.1f, 0.3f);
    }
    else
    {
      // 否则不允许建造
      this.allowBuild = false;
      // 变为红色
      ScriptObjectPool<MeshRenderer>.Instance.GetComponent(buildBlock).material.color = new Color(1, 0.1f, 0.1f, 0.3f);
    }
  }
}
```

左键执行的那个`Build()`就只是把当前的建造指示器改个颜色放在原位，实际游戏中会创建建筑，删掉建造指示器。

OK，以上就是这个网格建造的分享，告辞。
