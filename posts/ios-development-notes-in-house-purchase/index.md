---
id: 502
title: iOS 开发笔记 – 内购
date: 2020-03-08 13:20:52
tags:
  - ios
  - 内购
categories:
  - 笔记
---

## 内购流程

1. 请求商品列表
2. 返回有效商品
3. 显示购买项
4. 支付

<!--more-->

## 代码实现

```objective-c
// 引入头文件
#import <StoreKit/StoreKit.h>
@interface ViewController ()<SKProductsRequestDelegate, SKPaymentTransactionObserver>
// 记录商品信息
@property (nonatomic, strong) NSArray *products;
@end

@implementation ViewController

- (void)viewDidLoad {
  [super viewDidLoad];
  // 请求可售商品列表
  // 创建商品ID无序集
  NSSet *set = [NSSet setWithObjects: @"cn.imba97.item1", @"cn.imba97.item2", nil];
  // 创建商品请求对象
  NSProductsRequest *request = [[SKProductsRequest alloc] initWithProductIdentifiers: set];
  // 设置代理
  request.delegate = self;
  // 开始请求
  [request start];
}

// 在代理方法中返回商品列表

- (void)productsRequest:(SKProductsRequest *)request didReceiveResponse:(SKProductsResponse *)response NS_AVAILABLE_IOS(3_0) {
  // 如果标示符不正确，会返回array集合供开发者调试
  // 无效标示符大于0，
  if (response.invalidProductIdentifiers.count > 0) {
    return;
  }
  // 成功返回则保存
  self.products = response.products;
  // 显示到界面
}

// 支付

- (void)pay: (Int) productIndex {
  // 选择商品
  SKProduct *product = self.products[productIndex];
  // 开具凭证
  SKPayment *payment = [SKPayment paymentWithProduct: product];
  // 进入交易队列
  [[SKPaymentQueue defaultQueue] addPayment: payment];
  // 监听支付流程
  [[SKPaymentQueue defaultQueue] addTransactionObserver: self];
}

// 实现监听支付流程协议的方法

- (void)paymentQueue:(SKPaymentQueue *)queue updatedTransactions:(NSArray<SKPaymentTransaction *> *)transactions {
  for (SKPaymentTransaction *transaction in transactions) {
    switch (transaction.transactionState) {
      case SKPaymentTransactionStatePurchasing:
        NSLog(@"正在购买");
        break;
      case SKPaymentTransactionStatePurchased:
        NSLog(@"购买完成");
        // 结束交易
        [[SKPaymentQueue defaultQueue] finishTrancation: trancation];
        break;
      case SKPaymentTransactionStateFailed:
        NSLog(@"购买失败");
        break;
      case SKPaymentTransactionStateRestored:
        NSLog(@"恢复购买");
        // 结束交易
        [[SKPaymentQueue defaultQueue] finishTrancation: trancation];
        break;
      case SKPaymentTransactionStateDeferred:
        NSLog(@"无法判断");
        break;
    }
  }
}

@end
```

`SKPaymentTransactionState`的类型

1. SKPaymentTransactionStatePurchasing - 正在购买
2. SKPaymentTransactionStatePurchased - 购买完成（客户端必须完成交易）
3. SKPaymentTransactionStateFailed - 购买失败
4. SKPaymentTransactionStateRestored - 恢复购买（客户端必须完成交易）
5. SKPaymentTransactionStateDeferred - 用户未决定（信用卡信息未配置等情况）

## 恢复购买

恢复之前购买过的商品

```objective-c
// 按钮点击事件
- (IBAction)restoreClick: (id)sender {
  [[SKPaymentQueue defaultQueue] restoreCompletedTransactions];
}
```

## 优化

监听支付流程无需每次购买时添加，只要在购买界面被加载时添加即可

```objective-c
// 视图将要出现时
- (void)viewWillAppear:(BOOL)animated {
  [super viewWillAppear:animated];
  [[SKPaymentQueue defaultQueue] addTranstactionObserver: self];
}
// 视图消失时
- (void)viewWillDisappear:(BOOL)animated {
  [super viewWillDisappear:animated];
  [[SKPaymentQueue defaultQueue] removeTransactionObserver: self];
}
```
