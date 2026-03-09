export default function AboutPage() {
  return (
    <div className="min-h-screen bg-ios-bg pb-20">
      {/* Header */}
      <div className="bg-white px-4 pb-6 pt-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FF8D4D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8Z" />
            <line x1="6" y1="2" x2="6" y2="4" />
            <line x1="10" y1="2" x2="10" y2="4" />
            <line x1="14" y1="2" x2="14" y2="4" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-text-main">
          精品咖啡烘焙店
        </h1>
        <p className="mt-1 text-sm text-text-secondary">v1.0.0</p>
      </div>

      {/* Info Cards */}
      <div className="mx-4 mt-4 space-y-3">
        <div className="rounded-xl bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-text-main">关于我们</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            我们是一家专注于精品咖啡的烘焙店，精选来自世界各地的优质咖啡豆，采用专业烘焙工艺，为您带来每一杯都值得细细品味的好咖啡。
          </p>
        </div>

        <div className="rounded-xl bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-text-main">在线点单</h2>
          <p className="text-sm leading-relaxed text-text-secondary">
            通过我们的在线点单系统，您可以随时浏览菜单、自定义饮品选项，轻松下单，到店即取，节省等待时间。
          </p>
        </div>

        <div className="rounded-xl bg-white p-4">
          <h2 className="mb-2 text-sm font-medium text-text-main">联系方式</h2>
          <div className="space-y-2 text-sm text-text-secondary">
            <p>营业时间：每日 08:00 - 22:00</p>
            <p>地址：请到店咨询</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-text-light">
        <p>Made with love for coffee lovers</p>
      </div>
    </div>
  )
}
