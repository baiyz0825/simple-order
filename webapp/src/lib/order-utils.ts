// 生成订单号：日期 + 4位流水号
export function generateOrderNo(): string {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
  return `${date}${random}`
}

// 检查所有商品是否制作完成
export function checkAllItemsDone(items: any[]): boolean {
  return items.every(item => {
    if (!item.process || item.process.length === 0) return true
    return item.process.every((step: any) => step.done)
  })
}
